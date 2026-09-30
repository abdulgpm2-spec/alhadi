"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Briefcase,
  RefreshCw,
  ListChecks,
  X,
  FolderPlus,
  Eye,
  FileText,
  Sliders,
  MessageCircle,
  UploadCloud,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  CustomFieldsForm,
  validateCustomFieldValues,
  toCustomFieldPayload,
} from "@/components/common/CustomFieldsForm";
import { attachDocFilesToWork, clientRateFor } from "@/lib/work-apply";

const SERVICE_TYPE_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "CORRECTION", label: "Correction / Update" },
  { value: "RENEWAL", label: "Renewal" },
  { value: "REPRINT", label: "Reprint" },
  { value: "PRINT", label: "Print" },
];

const serviceTypeLabel = (v?: string) =>
  SERVICE_TYPE_OPTIONS.find((o) => o.value === (v || "NEW"))?.label || "New";

// Password toggle is scoped to Smart Card category (current phase)
const isSmartCategoryName = (name?: string) => /smart/i.test(name || "");

interface FormDocument {
  name: string;
  isRequired: boolean;
  description: string;
}

interface FormCorrection {
  name: string;
  note: string;
  isActive: boolean;
}

interface FormCustomField {
  fieldKey: string;
  label: string;
  labelMr: string;
  fieldType: string;
  options: string[];
  isRequired: boolean;
  marathiEnabled: boolean;
  isActive: boolean;
}

const FIELD_TYPE_OPTIONS = [
  { value: "TEXT", label: "Text" },
  { value: "TEXTAREA", label: "Long Text" },
  { value: "PHONE", label: "Phone (10-digit)" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Dropdown" },
];

// One-click preset: Senior Citizen applicant form (English + Marathi)
const SENIOR_CITIZEN_PRESET: FormCustomField[] = [
  { fieldKey: "name", label: "Name", labelMr: "नाव", fieldType: "TEXT", options: [], isRequired: true, marathiEnabled: true, isActive: true },
  { fieldKey: "father_name", label: "Father Name", labelMr: "वडिलांचे नाव", fieldType: "TEXT", options: [], isRequired: true, marathiEnabled: true, isActive: true },
  { fieldKey: "gender", label: "Gender", labelMr: "लिंग", fieldType: "SELECT", options: ["Male", "Female", "Other"], isRequired: true, marathiEnabled: false, isActive: true },
  { fieldKey: "dob", label: "Date of Birth", labelMr: "जन्मतारीख", fieldType: "DATE", options: [], isRequired: true, marathiEnabled: false, isActive: true },
  { fieldKey: "address", label: "Address", labelMr: "पत्ता", fieldType: "TEXTAREA", options: [], isRequired: true, marathiEnabled: true, isActive: true },
  { fieldKey: "emergency_contact_name", label: "Emergency Contact Person Name", labelMr: "आपत्कालीन संपर्क व्यक्तीचे नाव", fieldType: "TEXT", options: [], isRequired: true, marathiEnabled: true, isActive: true },
  { fieldKey: "emergency_contact_number", label: "Emergency Contact Number", labelMr: "आपत्कालीन संपर्क क्रमांक", fieldType: "PHONE", options: [], isRequired: true, marathiEnabled: false, isActive: true },
];

function ServicesContent() {
  // Data states
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Current role (only ADMIN manages catalog; staff + agents get read-only + Apply)
  const [myRole, setMyRole] = useState("");
  const isAgent = myRole === "AGENT";
  const canManageServices = myRole === "ADMIN";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.user) setMyRole(j.data.user.role || "");
      })
      .catch(() => {});
  }, []);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Add Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  // Service Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [serviceActiveTab, setServiceActiveTab] = useState<string>("general");

  // Service Form State
  const [serviceForm, setServiceForm] = useState<{
    name: string;
    categoryId: string;
    serviceType: string;
    passwordRequired: boolean;
    uploadRequired: boolean;
    customerPrice: number;
    agentPrice: number;
    govtFee: number;
    otherCost: number;
    estimatedDays: number;
    description: string;
    employeeInstructions: string;
    requiredDocuments: FormDocument[];
    correctionOptions: FormCorrection[];
    customFields: FormCustomField[];
  }>({
    name: "",
    categoryId: "",
    serviceType: "NEW",
    passwordRequired: false,
    uploadRequired: false,
    customerPrice: 0,
    agentPrice: 0,
    govtFee: 0,
    otherCost: 0,
    estimatedDays: 3,
    description: "",
    employeeInstructions: "",
    requiredDocuments: [],
    correctionOptions: [],
    customFields: [],
  });

  // New Custom Field input helpers in modal
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldLabelMr, setNewFieldLabelMr] = useState("");
  const [newFieldType, setNewFieldType] = useState("TEXT");
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldMarathi, setNewFieldMarathi] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");

  // New Document Input helper in modal
  const [newDocInput, setNewDocInput] = useState("");
  const [newDocRequired, setNewDocRequired] = useState(true);
  const [newDocNote, setNewDocNote] = useState("");

  // New Correction Input helpers in modal
  const [newCorrInput, setNewCorrInput] = useState("");
  const [newCorrNote, setNewCorrNote] = useState("");

  // View Details Modal State
  const [viewingService, setViewingService] = useState<any | null>(null);

  // Rate shown in details: agents see agent rate, staff sees customer rate
  const detailRate = clientRateFor(viewingService, isAgent);

  // WhatsApp Share State (inside View Details)
  const [shareCustomers, setShareCustomers] = useState<any[]>([]);
  const [shareCustomerId, setShareCustomerId] = useState("");
  const [shareMobile, setShareMobile] = useState("");
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);

  // Lazy-load customers when View Details opens (for WhatsApp share picker)
  useEffect(() => {
    if (viewingService && shareCustomers.length === 0) {
      fetch("/api/customers?pageSize=100")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setShareCustomers(j.data || j.customers || []);
        })
        .catch(() => {});
    }
    if (viewingService) {
      setShareCustomerId("");
      setShareMobile("");
    }
  }, [viewingService]);

  const buildShareMessage = useCallback((srv: any) => {
    const lines: string[] = [];
    lines.push(`*${srv.name}*`);
    lines.push(`AL-HADI ENTERPRISE — Service Details`);
    lines.push(`--------------------------`);
    if (srv.category?.name) lines.push(`Category: ${srv.category.name}`);
    lines.push(`Type: ${serviceTypeLabel(srv.serviceType)}`);
    lines.push(`Charges: ${formatCurrency(Number(srv.customerPrice) || 0)}`);
    lines.push(
      `Estimated: ${Number(srv.estimatedDays) > 0 ? `${Number(srv.estimatedDays)} Days` : "Not specified"}`
    );
    const corr = (srv.correctionOptions || []).filter((c: any) => c.isActive !== false);
    if (corr.length > 0) lines.push(`Available Corrections: ${corr.map((c: any) => c.name).join(", ")}`);
    const docs = srv.requiredDocuments || [];
    if (docs.length > 0) {
      lines.push(
        `Required Documents: ${docs.map((d: any) => `${d.name}${d.isRequired === false ? " (Optional)" : ""}`).join(", ")}`
      );
      const withNotes = docs.filter((d: any) => d.description);
      for (const d of withNotes) lines.push(`  • ${d.name}: ${d.description}`);
    }
    if (srv.description) lines.push(`About: ${srv.description}`);
    lines.push(`--------------------------`);
    lines.push(`Reply to this message to apply.`);
    return lines.join("\n");
  }, []);

  const handleShareWhatsApp = useCallback(async () => {
    if (!viewingService) return;
    const picked = shareCustomers.find((c) => c.id === shareCustomerId);
    const mobile = (picked?.mobile || shareMobile || "").trim();
    if (!mobile) {
      toast.error("Select a customer or enter a mobile number to share");
      return;
    }
    setSharingWhatsApp(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile,
          message: buildShareMessage(viewingService),
          customerId: picked?.id || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to share on WhatsApp");
      toast.success(`Service details shared with ${picked?.name || mobile}`);
      if (json.data?.clickToChatUrl) {
        window.open(json.data.clickToChatUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to share on WhatsApp");
    } finally {
      setSharingWhatsApp(false);
    }
  }, [viewingService, shareCustomers, shareCustomerId, shareMobile, buildShareMessage]);

  // Load All Services & Categories
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [srvRes, catRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/services/categories"),
      ]);

      const [srvJson, catJson] = await Promise.all([srvRes.json(), catRes.json()]);

      if (srvJson.success) setServices(srvJson.data || []);
      if (catJson.success) setCategories(catJson.data || []);
    } catch (e) {
      toast.error("Failed to load Services & Categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      // Category filter
      if (selectedCategory !== "ALL" && srv.categoryId !== selectedCategory) {
        return false;
      }

      // Search Query (name, category, type, correction option, document)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = srv.name?.toLowerCase().includes(q);
        const matchCategory = srv.category?.name?.toLowerCase().includes(q);
        const matchType = serviceTypeLabel(srv.serviceType).toLowerCase().includes(q);
        const matchDesc = srv.description?.toLowerCase().includes(q);
        const matchCorrection = (srv.correctionOptions || []).some((c: any) =>
          c.name?.toLowerCase().includes(q)
        );
        const matchDoc = (srv.requiredDocuments || []).some((d: any) =>
          d.name?.toLowerCase().includes(q)
        );
        if (!matchName && !matchCategory && !matchType && !matchDesc && !matchCorrection && !matchDoc) {
          return false;
        }
      }
      return true;
    });
  }, [services, selectedCategory, searchQuery]);

  // Agent tab: category cards (one per category, Apply goes to form)
  const agentGroups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; items: any[] }>();
    for (const srv of filteredServices) {
      const cid = srv.categoryId || srv.category?.id || "GENERAL";
      const cname = srv.category?.name || "General";
      if (!map.has(cid)) map.set(cid, { id: cid, name: cname, items: [] });
      map.get(cid)!.items.push(srv);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredServices]);

  // Smart Apply popup (all roles — Admin, Staff, Agent)
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyCat, setApplyCat] = useState<any | null>(null);
  const [applyServiceId, setApplyServiceId] = useState("");
  const [applyCustMode, setApplyCustMode] = useState<"existing" | "new">("new");
  const [applyCustomers, setApplyCustomers] = useState<any[]>([]);
  const [applyCustomerId, setApplyCustomerId] = useState("");
  const [applyName, setApplyName] = useState("");
  const [applyMobile, setApplyMobile] = useState("");
  const [applyCorrIds, setApplyCorrIds] = useState<string[]>([]);
  const [applyPassword, setApplyPassword] = useState("");
  const [applyNotes, setApplyNotes] = useState("");
  const [applyFiles, setApplyFiles] = useState<Record<string, File>>({});
  const [applyCustom, setApplyCustom] = useState<Record<string, { value: string; valueMr: string }>>({});
  const [applyAgents, setApplyAgents] = useState<any[]>([]);
  const [applyAgentId, setApplyAgentId] = useState("");
  const [applySaving, setApplySaving] = useState(false);
  const [applyUploading, setApplyUploading] = useState(false);

  const OTHER_KEY = "__OTHER__";

  const openApply = useCallback((grp: any) => {
    setApplyCat(grp);
    setApplyServiceId("");
    setApplyCustMode(isAgent ? "new" : "existing");
    setApplyCustomers([]);
    setApplyCustomerId("");
    setApplyName("");
    setApplyMobile("");
    setApplyCorrIds([]);
    setApplyPassword("");
    setApplyNotes("");
    setApplyFiles({});
    setApplyCustom({});
    setApplyAgents([]);
    setApplyAgentId("");
    setApplyOpen(true);

    fetch("/api/customers?pageSize=100")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setApplyCustomers(j.data || []);
      })
      .catch(() => {});
    if (!isAgent) {
      fetch(myRole === "EMPLOYEE" ? "/api/agents/mine" : "/api/agents")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setApplyAgents(j.data || []);
        })
        .catch(() => {});
    }
  }, [isAgent, myRole]);

  const applyService = applyCat?.items?.find((s: any) => s.id === applyServiceId) || null;
  const isApplyOther = applyServiceId === OTHER_KEY;
  // Upload boxes show only when upload is mandatory for the service (Other: always)
  const modalNeedUpload = isApplyOther ? true : Boolean(applyService?.uploadRequired);
  const applyShowPassword = isApplyOther
    ? /smart/i.test(applyCat?.name || "")
    : Boolean(applyService?.passwordRequired);
  const applyTotal = clientRateFor(applyService, isAgent);

  const toggleApplyCorr = useCallback((corrId: string) => {
    setApplyCorrIds((prev) =>
      prev.includes(corrId) ? prev.filter((id) => id !== corrId) : [...prev, corrId]
    );
  }, []);

  const handleApplyFile = useCallback((docName: string, file: File | undefined) => {
    setApplyFiles((prev) => {
      if (!file) {
        const next = { ...prev };
        delete next[docName];
        return next;
      }
      return { ...prev, [docName]: file };
    });
  }, []);

  const handleApplyCustomChange = useCallback((fieldKey: string, patch: Partial<{ value: string; valueMr: string }>) => {
    setApplyCustom((prev) => {
      const cur = prev[fieldKey] || { value: "", valueMr: "" };
      return { ...prev, [fieldKey]: { ...cur, ...patch } };
    });
  }, []);

  const handleApplySubmit = useCallback(async () => {
    if (!applyCat) return;
    if (!applyServiceId) {
      toast.error("Please select a sub-service");
      return;
    }
    const useExisting = !isAgent && applyCustMode === "existing";
    if (useExisting && !applyCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!useExisting && (!applyName.trim() || applyMobile.trim().length !== 10)) {
      toast.error("Enter customer name and 10-digit mobile number");
      return;
    }
    if (!isAgent && !useExisting && myRole === "EMPLOYEE" && !applyAgentId) {
      toast.error("Please select one of your agents for this customer");
      return;
    }

    // Document password is mandatory wherever the field is shown
    const needPassword =
      isApplyOther
        ? /smart/i.test(applyCat?.name || "")
        : Boolean(applyService?.passwordRequired);
    if (needPassword && !applyPassword.trim()) {
      toast.error("Document password is required for this service");
      return;
    }

    // Applicant custom fields (service master form, incl. Marathi)
    if (!isApplyOther) {
      const customErr = validateCustomFieldValues(applyService?.customFields, applyCustom);
      if (customErr) {
        toast.error(customErr);
        return;
      }
    }

    // File upload is mandatory only when the service has Upload Mandatory ON
    // (separate from document Required/Optional). Other-service always needs its 2 files.
    const needUpload = modalNeedUpload;
    const requiredDocNames: string[] = !needUpload
      ? []
      : isApplyOther
        ? ["Document 1", "Document 2"]
        : (applyService?.requiredDocuments || [])
            .filter((d: any) => d.isRequired !== false)
            .map((d: any) => d.name);
    const missingDocs = requiredDocNames.filter((n) => !applyFiles[n]);
    if (missingDocs.length > 0) {
      toast.error(
        `Please upload required document(s): ${missingDocs.slice(0, 3).join(", ")}${
          missingDocs.length > 3 ? ` +${missingDocs.length - 3} more` : ""
        }`
      );
      return;
    }

    setApplySaving(true);
    try {
      const payload: any = {
        serviceId: applyServiceId,
        categoryId: isApplyOther ? applyCat.id : undefined,
        selectedCorrections: applyCorrIds,
        documentPassword: applyPassword.trim() || undefined,
        notes: applyNotes.trim() || undefined,
        customFieldValues: isApplyOther
          ? []
          : toCustomFieldPayload(applyService?.customFields, applyCustom),
      };
      if (useExisting) {
        payload.customerId = applyCustomerId;
      } else {
        payload.name = applyName.trim();
        payload.mobile = applyMobile.trim();
        if (!isAgent && myRole === "EMPLOYEE") payload.agentId = applyAgentId;
      }

      const res = await fetch("/api/work/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success || !json.data?.work?.id) {
        throw new Error(json.error?.message || "Failed to submit application");
      }

      // Attach files to the created work's checklist (matched by document name)
      const entries = Object.entries(applyFiles);
      if (entries.length > 0) {
        setApplyUploading(true);
        try {
          const { attached, failed } = await attachDocFilesToWork(json.data.work.id, applyFiles);
          if (attached > 0) toast.success(`${attached} document(s) attached.`);
          if (failed > 0) toast.error(`${failed} file(s) failed — re-attach from work details.`);
        } finally {
          setApplyUploading(false);
        }
      }

      toast.success(`Application submitted! Work ${json.data.work.workId} created.`);
      setApplyOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setApplySaving(false);
    }
  }, [
    applyCat,
    applyService,
    applyServiceId,
    isAgent,
    myRole,
    applyCustMode,
    applyCustomerId,
    applyName,
    applyMobile,
    applyAgentId,
    isApplyOther,
    applyFiles,
    applyCorrIds,
    applyPassword,
    applyNotes,
    applyCustom,
    applyService,
  ]);

  // ----------------------------------------------------
  // Category Actions
  // ----------------------------------------------------
  const handleOpenAddCategory = useCallback(() => {
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "" });
    setCategoryModalOpen(true);
  }, []);

  const handleOpenEditCategory = useCallback((cat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name || "", description: cat.description || "" });
    setCategoryModalOpen(true);
  }, []);

  const handleDeleteCategory = useCallback(async (cat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const linkedCount = services.filter((s) => s.categoryId === cat.id).length;
    if (linkedCount > 0) {
      toast.error(
        `Cannot delete "${cat.name}" because ${linkedCount} service(s) are linked to it. Move or delete those services first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/services/categories/${cat.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Delete failed");
      toast.success(`Category "${cat.name}" deleted`);
      if (selectedCategory === cat.id) setSelectedCategory("ALL");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  }, [services, selectedCategory, fetchData]);

  const handleSaveCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category Name is required");
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategory) {
        const res = await fetch(`/api/services/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryForm),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || "Failed to update category");

        toast.success(`Category "${categoryForm.name}" updated successfully!`);
        setCategoryModalOpen(false);
        setEditingCategory(null);
        await fetchData();
        return;
      }

      const res = await fetch("/api/services/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to create category");

      toast.success(`Category "${categoryForm.name}" created successfully!`);
      setCategoryModalOpen(false);
      await fetchData();

      // If user was inside service form or had modal open, auto-select newly created category
      if (serviceModalOpen) {
        setServiceForm((prev) => ({ ...prev, categoryId: json.data.id }));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setSavingCategory(false);
    }
  }, [categoryForm, editingCategory, serviceModalOpen, fetchData]);

  // ----------------------------------------------------
  // Service Actions
  // ----------------------------------------------------
  const handleOpenAddService = useCallback(() => {
    setEditingService(null);
    setServiceActiveTab("general");
    setNewDocInput("");
    setNewDocRequired(true);
    setNewDocNote("");
    setNewCorrInput("");
    setNewCorrNote("");
    setNewFieldLabel("");
    setNewFieldLabelMr("");
    setNewFieldType("TEXT");
    setNewFieldRequired(true);
    setNewFieldMarathi(false);
    setNewFieldOptions("");
    setServiceForm({
      name: "",
      categoryId: selectedCategory !== "ALL" ? selectedCategory : (categories[0]?.id || ""),
      serviceType: "NEW",
      passwordRequired: false,
      uploadRequired: false,
      customerPrice: 150,
      agentPrice: 100,
      govtFee: 0,
      otherCost: 0,
      estimatedDays: 3,
      description: "",
      employeeInstructions: "",
      requiredDocuments: [{ name: "Aadhaar Card", isRequired: true, description: "" }],
      correctionOptions: [],
      customFields: [],
    });
    setServiceModalOpen(true);
  }, [selectedCategory, categories]);

  const handleOpenEditService = useCallback((srv: any) => {
    setEditingService(srv);
    setViewingService(null);
    setServiceActiveTab("general");
    setNewDocInput("");
    setNewDocRequired(true);
    setNewDocNote("");
    setNewCorrInput("");
    setNewCorrNote("");
    setNewFieldLabel("");
    setNewFieldLabelMr("");
    setNewFieldType("TEXT");
    setNewFieldRequired(true);
    setNewFieldMarathi(false);
    setNewFieldOptions("");
    setServiceForm({
      name: srv.name || "",
      categoryId: srv.categoryId || (categories[0]?.id || ""),
      serviceType: srv.serviceType || "NEW",
      passwordRequired: Boolean(srv.passwordRequired),
      uploadRequired: Boolean(srv.uploadRequired),
      customerPrice: srv.customerPrice || 0,
      agentPrice: srv.agentPrice || 0,
      govtFee: srv.govtFee || 0,
      otherCost: srv.otherCost || 0,
      estimatedDays: srv.estimatedDays || 3,
      description: srv.description || "",
      employeeInstructions: srv.employeeInstructions || "",
      requiredDocuments: (srv.requiredDocuments || []).map((d: any) => ({
        name: d.name || "",
        isRequired: d.isRequired !== undefined ? Boolean(d.isRequired) : true,
        description: d.description || "",
      })),
      correctionOptions: (srv.correctionOptions || []).map((c: any) => ({
        name: c.name || "",
        note: c.note || "",
        isActive: c.isActive !== undefined ? Boolean(c.isActive) : true,
      })),
      customFields: (srv.customFields || []).map((f: any) => {
        let options: string[] = [];
        try {
          const parsed = typeof f.options === "string" ? JSON.parse(f.options) : f.options;
          if (Array.isArray(parsed)) options = parsed.filter((o) => typeof o === "string");
        } catch {
          options = [];
        }
        return {
          fieldKey: f.fieldKey || "",
          label: f.label || "",
          labelMr: f.labelMr || "",
          fieldType: f.fieldType || "TEXT",
          options,
          isRequired: f.isRequired !== undefined ? Boolean(f.isRequired) : true,
          marathiEnabled: Boolean(f.marathiEnabled),
          isActive: f.isActive !== undefined ? Boolean(f.isActive) : true,
        };
      }),
    });
    setServiceModalOpen(true);
  }, [categories]);

  const handleSaveService = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      toast.error("Service Name is required");
      return;
    }

    setSavingService(true);
    try {
      if (editingService) {
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serviceForm),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || "Failed to update Service");
        toast.success(`Service "${serviceForm.name}" updated successfully!`);
      } else {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serviceForm),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || "Failed to create Service");
        toast.success(`Service "${serviceForm.name}" created successfully!`);
      }
      setServiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Service");
    } finally {
      setSavingService(false);
    }
  }, [serviceForm, editingService, fetchData]);

  const handleDeleteService = useCallback(async (srv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const worksCount = srv._count?.works || 0;
    if (worksCount > 0) {
      toast.error(
        `Cannot delete "${srv.name}" because ${worksCount} work order(s) exist. Please keep it to preserve historical records.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete Service "${srv.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/services/${srv.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Delete failed");
      toast.success(`Service "${srv.name}" deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  }, [fetchData]);

  // Helper: Documents Manager inside Modal
  const handleAddDocumentItem = useCallback(() => {
    if (!newDocInput.trim()) return;
    const docName = newDocInput.trim();
    if (serviceForm.requiredDocuments.some((d) => d.name.toLowerCase() === docName.toLowerCase())) {
      toast.error("This document is already in the checklist");
      return;
    }
    setServiceForm((prev) => ({
      ...prev,
      requiredDocuments: [
        ...prev.requiredDocuments,
        { name: docName, isRequired: newDocRequired, description: newDocNote.trim() },
      ],
    }));
    setNewDocInput("");
    setNewDocNote("");
    setNewDocRequired(true);
  }, [newDocInput, newDocRequired, newDocNote, serviceForm.requiredDocuments]);

  const handleRemoveDocumentItem = useCallback((docName: string) => {
    setServiceForm((prev) => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((d) => d.name !== docName),
    }));
  }, []);

  const handleToggleDocumentRequired = useCallback((docName: string) => {
    setServiceForm((prev) => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.map((d) =>
        d.name === docName ? { ...d, isRequired: !d.isRequired } : d
      ),
    }));
  }, []);

  // Helper: Correction Options Manager inside Modal
  const handleAddCorrectionItem = useCallback(() => {
    if (!newCorrInput.trim()) return;
    const corrName = newCorrInput.trim();
    if (serviceForm.correctionOptions.some((c) => c.name.toLowerCase() === corrName.toLowerCase())) {
      toast.error("This correction option already exists");
      return;
    }
    setServiceForm((prev) => ({
      ...prev,
      correctionOptions: [...prev.correctionOptions, { name: corrName, note: newCorrNote.trim(), isActive: true }],
    }));
    setNewCorrInput("");
    setNewCorrNote("");
  }, [newCorrInput, newCorrNote, serviceForm.correctionOptions]);

  const handleRemoveCorrectionItem = useCallback((corrName: string) => {
    setServiceForm((prev) => ({
      ...prev,
      correctionOptions: prev.correctionOptions.filter((c) => c.name !== corrName),
    }));
  }, []);

  const handleToggleCorrectionActive = useCallback((corrName: string) => {
    setServiceForm((prev) => ({
      ...prev,
      correctionOptions: prev.correctionOptions.map((c) =>
        c.name === corrName ? { ...c, isActive: !c.isActive } : c
      ),
    }));
  }, []);

  // Helper: Custom Fields Manager inside Modal
  const slugFieldKey = (label: string) =>
    label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "field";

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) {
      toast.error("Field label is required");
      return;
    }
    const key = slugFieldKey(newFieldLabel);
    if (serviceForm.customFields.some((f) => f.fieldKey === key)) {
      toast.error("A field with this name already exists");
      return;
    }
    const options =
      newFieldType === "SELECT"
        ? Array.from(new Set(newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean))).slice(0, 50)
        : [];
    if (newFieldType === "SELECT" && options.length === 0) {
      toast.error("Dropdown fields need at least one option (comma separated)");
      return;
    }
    setServiceForm((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        {
          fieldKey: key,
          label: newFieldLabel.trim(),
          labelMr: newFieldLabelMr.trim(),
          fieldType: newFieldType,
          options,
          isRequired: newFieldRequired,
          marathiEnabled: newFieldMarathi,
          isActive: true,
        },
      ],
    }));
    setNewFieldLabel("");
    setNewFieldLabelMr("");
    setNewFieldType("TEXT");
    setNewFieldRequired(true);
    setNewFieldMarathi(false);
    setNewFieldOptions("");
  };

  const handleRemoveCustomField = (fieldKey: string) => {
    setServiceForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((f) => f.fieldKey !== fieldKey),
    }));
  };

  const handleToggleCustomFieldActive = (fieldKey: string) => {
    setServiceForm((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) =>
        f.fieldKey === fieldKey ? { ...f, isActive: !f.isActive } : f
      ),
    }));
  };

  const handleApplySeniorPreset = () => {
    setServiceForm((prev) => {
      const existing = new Set(prev.customFields.map((f) => f.fieldKey));
      const additions = SENIOR_CITIZEN_PRESET.filter((f) => !existing.has(f.fieldKey)).map((f) => ({
        ...f,
        options: [...f.options],
      }));
      if (additions.length === 0) {
        toast.info("Senior Citizen fields are already added");
        return prev;
      }
      toast.success(`${additions.length} Senior Citizen fields added`);
      return { ...prev, customFields: [...prev.customFields, ...additions] };
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header with [Add Category] and [Add Services] */}
      <PageHeader
        title="Services"
        subtitle={
          isAgent
            ? "Service catalog offered at our center — pick a service to apply for a customer"
            : canManageServices
              ? "Catalog of government and citizen services with pricing, turnaround SLA, and document checklists"
              : "Service catalog offered at our center — pick a service to apply for a customer"
        }
        action={
          canManageServices && (
            <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenAddCategory}
              className="h-8 text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-300 font-semibold shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add Category
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAddService}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add Services
            </Button>
            </div>
          )
        }
      />

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
            selectedCategory === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Categories ({services.length})
        </button>
        {categories.map((cat) => {
          const count = services.filter((s) => s.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
              {canManageServices && (
                <>
                  <span
                    role="button"
                    tabIndex={0}
                    title="Edit Category"
                    onClick={(e) => handleOpenEditCategory(cat, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleOpenEditCategory(cat, e as any);
                    }}
                    className={`ml-0.5 p-0.5 rounded-full transition-colors ${
                      isSelected ? "hover:bg-emerald-700 text-white" : "hover:bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Edit2 className="h-3 w-3" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    title="Delete Category"
                    onClick={(e) => handleDeleteCategory(cat, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleDeleteCategory(cat, e as any);
                    }}
                    className={`p-0.5 rounded-full transition-colors ${
                      isSelected ? "hover:bg-emerald-700 text-white" : "hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                    }`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search Services by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            className="h-8 text-xs px-2.5 bg-white text-slate-600"
            title="Refresh Services"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Services Grid / Datatable */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200 space-y-3">
          <Layers className="h-10 w-10 text-slate-300 mx-auto" />
          <div>
            <p className="font-bold text-slate-800 text-sm">No Services found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery || selectedCategory !== "ALL"
                ? "Try adjusting your search query or category filter"
                : "Get started by adding your first service to the catalog"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {canManageServices && (
              <>
                <Button size="sm" variant="outline" onClick={handleOpenAddCategory} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
                </Button>
                <Button size="sm" onClick={handleOpenAddService} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Services
                </Button>
              </>
            )}
          </div>
        </div>
      ) : !canManageServices ? (
        /* Agent view: one clean card per category — name + count + Apply.
           Sub-service selection happens in the apply form (category locked). */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentGroups.map((grp) => {
            return (
              <Card
                key={grp.id}
                className="border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <CardHeader className="pb-2.5 pt-5 px-5">
                  <CardTitle
                    title={grp.name}
                    className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate leading-tight"
                  >
                    {grp.name}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                      {grp.items.length} service{grp.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 px-5 pb-4">
                  <div className="flex items-center pt-2.5 border-t border-slate-100">
                    <Button
                      size="sm"
                      onClick={() => openApply(grp)}
                      className="w-full flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5"
                      title={`Apply for a ${grp.name} service`}
                    >
                      <Plus className="h-3.5 w-3.5" /> Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((srv) => {
            const docs = srv.requiredDocuments || [];
            const corrections = (srv.correctionOptions || []).filter((c: any) => c.isActive !== false);
            const isCorrection = (srv.serviceType || "NEW") === "CORRECTION";
            const price = Number(srv.customerPrice) || 0;
            const days = Number(srv.estimatedDays) || 0;

            return (
              <Card
                key={srv.id}
                className="border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <CardHeader className="pb-2.5 pt-5 px-5">
                  <CardTitle
                    title={srv.name}
                    className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate leading-tight"
                  >
                    {srv.name}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {srv.category?.name ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                        {srv.category.name}
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium whitespace-nowrap">
                        General
                      </span>
                    )}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                      {serviceTypeLabel(srv.serviceType)}
                    </span>
                    {srv.isActive === false && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                        Inactive
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-2.5 pt-0 px-5 pb-4">
                  {/* Charges + Estimated — one compact line */}
                  <div className="flex items-center gap-3 text-xs py-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-black text-slate-900 text-base whitespace-nowrap">{formatCurrency(price)}</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5 whitespace-nowrap text-[13px]">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {days > 0 ? `${days} Days` : "Time N/A"}
                    </span>
                    <span className="ml-auto text-[11px] text-slate-400 whitespace-nowrap">
                      {docs.length} docs{isCorrection && corrections.length > 0 ? ` • ${corrections.length} fixes` : ""}
                    </span>
                  </div>

                  {/* Corrections — one line, correction services only */}
                  {isCorrection && (
                    <div
                      title={corrections.map((c: any) => c.name).join(", ")}
                      className="flex items-center gap-2 text-xs text-slate-600 truncate py-0.5"
                    >
                      <Sliders className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">
                        {corrections.length > 0 ? corrections.map((c: any) => c.name).join(", ") : "No options defined"}
                      </span>
                    </div>
                  )}

                  {/* Documents — one line */}
                  <div
                    title={docs.map((d: any) => `${d.name}${d.isRequired === false ? " (Optional)" : ""}`).join(", ")}
                    className="flex items-center gap-2 text-xs text-slate-600 py-0.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    {docs.length > 0 ? (
                      <span className="truncate">
                        {docs.slice(0, 3).map((d: any) => d.name).join(", ")}
                        {docs.length > 3 ? ` +${docs.length - 3} more` : ""}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No documents specified</span>
                    )}
                  </div>

                  {/* Card Action Buttons (staff only — agents use category cards) */}
                  <div className="flex items-center pt-2.5 border-t border-slate-100 gap-2">
                    <Button
                      size="sm"
                      onClick={() => setViewingService(srv)}
                      className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Details
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditService(srv)}
                      className="h-9 text-xs px-3 bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
                      title="Edit Service"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleDeleteService(srv, e)}
                      className="h-9 text-xs px-3 bg-white text-rose-600 hover:bg-rose-50 border-rose-200"
                      title="Remove Service"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. Add Category Modal */}
      {/* ==================================================== */}
      <Dialog
        open={categoryModalOpen}
        onOpenChange={(open) => {
          setCategoryModalOpen(open);
          if (!open) setEditingCategory(null);
        }}
      >
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-emerald-600" />
              {editingCategory ? `Edit Category: ${editingCategory.name}` : "Add Category"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingCategory
                ? "Update the category name and description"
                : "Create a new category to group and organize citizen services"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 my-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Category Name *</label>
              <Input
                required
                placeholder="e.g. PAN Card, Passport, Driving Licence, Gazette"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Description</label>
              <Input
                placeholder="e.g. Government identity & documentation services"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingCategory}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {savingCategory ? "Saving..." : editingCategory ? "Save Category" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* 2. Add / Edit Services Modal */}
      {/* ==================================================== */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent className="max-w-2xl p-6 bg-white max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              {editingService ? `Edit Service: ${editingService.name}` : "Add Services"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure service details, category, pricing, turnaround SLA, and document checklist
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveService} className="space-y-4 my-2 text-xs">
            <Tabs value={serviceActiveTab} onValueChange={setServiceActiveTab} className="w-full h-[440px] sm:h-[460px] flex flex-col">
              <TabsList className="bg-slate-100 p-1 rounded-lg w-full flex justify-start">
                <TabsTrigger value="general" className="text-xs font-semibold flex items-center gap-1.5 flex-1">
                  <Briefcase className="h-3.5 w-3.5" /> General Details
                </TabsTrigger>
                <TabsTrigger
                  value="corrections"
                  disabled={serviceForm.serviceType !== "CORRECTION"}
                  title={
                    serviceForm.serviceType !== "CORRECTION"
                      ? "Correction options are only available for Correction / Update services"
                      : "Define what can be corrected"
                  }
                  className="text-xs font-semibold flex items-center gap-1.5 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sliders className="h-3.5 w-3.5" /> Corrections ({serviceForm.correctionOptions.length})
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs font-semibold flex items-center gap-1.5 flex-1">
                  <ListChecks className="h-3.5 w-3.5" /> Documents ({serviceForm.requiredDocuments.length})
                </TabsTrigger>
                <TabsTrigger value="fields" className="text-xs font-semibold flex items-center gap-1.5 flex-1">
                  <ClipboardList className="h-3.5 w-3.5" /> Fields ({serviceForm.customFields.length})
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: General Details */}
              <TabsContent value="general" className="space-y-3.5 pt-3 flex-1 overflow-y-auto pr-0.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Service Name *</label>
                    <Input
                      required
                      placeholder="e.g. PAN New, PAN Correction, Fresh Passport"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Category *</label>
                    <Select
                      value={serviceForm.categoryId}
                      onValueChange={(val) => {
                        const picked = categories.find((c) => c.id === val);
                        setServiceForm({
                          ...serviceForm,
                          categoryId: val,
                          // Password flag is Smart-Card-scoped: reset when leaving it
                          passwordRequired: isSmartCategoryName(picked?.name)
                            ? serviceForm.passwordRequired
                            : false,
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue placeholder="Select Category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Service Type</label>
                    <Select
                      value={serviceForm.serviceType}
                      onValueChange={(val) => {
                        setServiceForm({ ...serviceForm, serviceType: val });
                        if (val !== "CORRECTION" && serviceActiveTab === "corrections") {
                          setServiceActiveTab("general");
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue placeholder="Select Type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isSmartCategoryName(
                    categories.find((c) => c.id === serviceForm.categoryId)?.name
                  ) && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>Password Required?</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={serviceForm.passwordRequired}
                          onClick={() =>
                            setServiceForm({ ...serviceForm, passwordRequired: !serviceForm.passwordRequired })
                          }
                          className={`relative h-5 w-9 rounded-full transition-colors ${
                            serviceForm.passwordRequired ? "bg-emerald-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                              serviceForm.passwordRequired ? "left-[18px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </label>
                      <p className="text-[11px] text-slate-500">
                        {serviceForm.passwordRequired
                          ? "ON — agent ko apply karte waqt document password likhna hoga."
                          : "OFF — agent se password nahi manga jayega."}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-slate-700 flex items-center justify-between">
                      <span>Document Upload Mandatory?</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={serviceForm.uploadRequired}
                        onClick={() =>
                          setServiceForm({ ...serviceForm, uploadRequired: !serviceForm.uploadRequired })
                        }
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          serviceForm.uploadRequired ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                            serviceForm.uploadRequired ? "left-[18px]" : "left-0.5"
                          }`}
                        />
                      </button>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {serviceForm.uploadRequired
                        ? "ON — apply par required documents ki file lazmi hogi."
                        : "OFF — checklist dikhega, file baad me lag sakti hai. (Document Required/Optional se alag setting.)"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:col-span-2">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Customer Rate (₹) *</label>
                      <Input
                        required
                        type="number"
                        min={0}
                        value={serviceForm.customerPrice}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, customerPrice: parseFloat(e.target.value) || 0 })
                        }
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Agent Rate (₹) *</label>
                      <Input
                        required
                        type="number"
                        min={0}
                        value={serviceForm.agentPrice}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, agentPrice: parseFloat(e.target.value) || 0 })
                        }
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:col-span-2">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Govt Fee (₹) — cost</label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 107"
                        value={serviceForm.govtFee}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, govtFee: parseFloat(e.target.value) || 0 })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Other Cost (₹) — printing, travel</label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 30"
                        value={serviceForm.otherCost}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, otherCost: parseFloat(e.target.value) || 0 })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-900">
                    Total cost: <span className="font-black">{formatCurrency((serviceForm.govtFee || 0) + (serviceForm.otherCost || 0))}</span>
                    {"  "}• Margin @ customer rate:{" "}
                    <span className="font-black">{formatCurrency((serviceForm.customerPrice || 0) - (serviceForm.govtFee || 0) - (serviceForm.otherCost || 0))}</span>
                    {"  "}• Margin @ agent rate:{" "}
                    <span className="font-black">{formatCurrency((serviceForm.agentPrice || 0) - (serviceForm.govtFee || 0) - (serviceForm.otherCost || 0))}</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Target SLA / Estimated Days</label>
                    <Input
                      type="number"
                      min={1}
                      value={serviceForm.estimatedDays}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, estimatedDays: parseInt(e.target.value, 10) || 3 })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-slate-700">About This Service / Description</label>
                  <textarea
                    placeholder="e.g. PAN correction service for updating name, father's name, date of birth, mobile number or email."
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="w-full min-h-[56px] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-slate-700">
                    Employee Instructions <span className="font-normal text-slate-400">(internal, not customer-facing)</span>
                  </label>
                  <textarea
                    placeholder="e.g. Check original PAN and Aadhaar before submitting. Verify spelling carefully."
                    value={serviceForm.employeeInstructions}
                    onChange={(e) => setServiceForm({ ...serviceForm, employeeInstructions: e.target.value })}
                    className="w-full min-h-[56px] rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </TabsContent>

              {/* TAB 2: Correction / Customer Options */}
              <TabsContent value="corrections" className="space-y-3 pt-3 flex-1 overflow-y-auto pr-0.5">
                {serviceForm.serviceType !== "CORRECTION" ? (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-1.5">
                    <Sliders className="h-6 w-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">Correction options apply to Correction / Update services</p>
                    <p className="text-[11px] text-slate-500">
                      Set Service Type to <span className="font-bold">“Correction / Update”</span> in General Details to
                      define what can be corrected for this service. You may still add options below — they will only be
                      offered during Work Order creation for correction-type services.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">What Can Be Corrected?</h4>
                    <p className="text-[11px] text-slate-500">
                      Service-specific checklist shown to the operator during Work Order creation (no pricing here)
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Correction item (e.g. Name, Father's Name, Date of Birth)..."
                      value={newCorrInput}
                      onChange={(e) => setNewCorrInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCorrectionItem();
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCorrectionItem}
                      className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                  <Input
                    placeholder="Internal note for operator (optional)..."
                    value={newCorrNote}
                    onChange={(e) => setNewCorrNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCorrectionItem();
                      }
                    }}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  {serviceForm.correctionOptions.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No correction options added.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {serviceForm.correctionOptions.map((corr) => (
                        <div
                          key={corr.name}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                            corr.isActive
                              ? "bg-sky-50/60 border-sky-200 text-slate-800"
                              : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleCorrectionActive(corr.name)}
                            title={corr.isActive ? "Deactivate" : "Activate"}
                            className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                              corr.isActive ? "bg-sky-600 border-sky-600 text-white" : "bg-white border-slate-300"
                            }`}
                          >
                            {corr.isActive && <CheckCircle2 className="h-3 w-3" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold block truncate">{corr.name}</span>
                            {corr.note && <span className="text-[11px] text-slate-500 block truncate">{corr.note}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCorrectionItem(corr.name)}
                            className="text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                            title="Remove Correction"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 4: Custom Applicant Fields */}
              <TabsContent value="fields" className="space-y-3 pt-3 flex-1 overflow-y-auto pr-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Applicant Form Fields</h4>
                    <p className="text-[11px] text-slate-500">
                      Extra details collected at apply time (shown in work order for staff). Tick Marathi where a
                      Marathi value is also needed.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplySeniorPreset}
                    className="h-7 text-[11px] bg-sky-600 hover:bg-sky-700 text-white shrink-0"
                    title="Add Name, Father Name, Gender, DOB, Address, Emergency Contact fields"
                  >
                    Senior Citizen Set
                  </Button>
                </div>

                <div className="space-y-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Field label * (e.g. Father Name)"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                    <Input
                      placeholder="Marathi label (e.g. वडिलांचे नाव)"
                      value={newFieldLabelMr}
                      onChange={(e) => setNewFieldLabelMr(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={newFieldType} onValueChange={setNewFieldType}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={newFieldType === "SELECT" ? "Options, comma separated *" : "Options (dropdown only)"}
                      value={newFieldOptions}
                      disabled={newFieldType !== "SELECT"}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      className="h-8 text-xs bg-white disabled:opacity-50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewFieldRequired(!newFieldRequired)}
                      className={`h-7 px-2.5 rounded-md text-[11px] font-bold border transition-colors ${
                        newFieldRequired
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-slate-300 text-slate-500"
                      }`}
                    >
                      {newFieldRequired ? "Required" : "Optional"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFieldMarathi(!newFieldMarathi)}
                      className={`h-7 px-2.5 rounded-md text-[11px] font-bold border transition-colors ${
                        newFieldMarathi
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-slate-300 text-slate-500"
                      }`}
                      title="Also collect Marathi value"
                    >
                      {newFieldMarathi ? "मराठी ON" : "मराठी OFF"}
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomField}
                      className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Field
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {serviceForm.customFields.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No custom fields. Use Senior Citizen Set or add manually.</p>
                  ) : (
                    serviceForm.customFields.map((f) => (
                      <div
                        key={f.fieldKey}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                          f.isActive ? "bg-white border-slate-200 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleCustomFieldActive(f.fieldKey)}
                          title={f.isActive ? "Deactivate" : "Activate"}
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            f.isActive ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300"
                          }`}
                        >
                          {f.isActive && <CheckCircle2 className="h-3 w-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block truncate">
                            {f.label}
                            {f.labelMr && <span className="font-normal text-slate-500"> • {f.labelMr}</span>}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {FIELD_TYPE_OPTIONS.find((t) => t.value === f.fieldType)?.label || f.fieldType}
                            {f.fieldType === "SELECT" && f.options.length > 0 ? `: ${f.options.join(", ")}` : ""}
                            {" • "}{f.isRequired ? "Required" : "Optional"}
                            {f.marathiEnabled ? " • मराठी" : ""}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(f.fieldKey)}
                          className="text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                          title="Remove Field"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* TAB 5: Required Documents Checklist */}
              <TabsContent value="documents" className="space-y-3 pt-3 flex-1 overflow-y-auto pr-0.5">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Required Documents Checklist</h4>
                  <p className="text-[11px] text-slate-500">
                    Citizen documents auto-generated on work order creation. Mark each as Required or Optional and add
                    instructions for the operator.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter document name (e.g. Aadhaar Card, Passport Photo, Old PAN Copy)..."
                      value={newDocInput}
                      onChange={(e) => setNewDocInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDocumentItem();
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setNewDocRequired(!newDocRequired)}
                      title="Toggle Required / Optional for the new document"
                      className={`h-8 px-2.5 rounded-md text-[11px] font-bold border shrink-0 transition-colors ${
                        newDocRequired
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-slate-300 text-slate-500"
                      }`}
                    >
                      {newDocRequired ? "Required" : "Optional"}
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddDocumentItem}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                  <Input
                    placeholder="Instructions for operator (optional, e.g. Clear front and back copy)..."
                    value={newDocNote}
                    onChange={(e) => setNewDocNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDocumentItem();
                      }
                    }}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  {serviceForm.requiredDocuments.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No required documents added.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {serviceForm.requiredDocuments.map((doc) => (
                        <div
                          key={doc.name}
                          className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-50 text-slate-800 text-xs border border-slate-200"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold block truncate">{doc.name}</span>
                            {doc.description && (
                              <span className="text-[11px] text-slate-500 block">“{doc.description}”</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleDocumentRequired(doc.name)}
                            title="Toggle Required / Optional"
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                              doc.isRequired
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-white text-slate-500 border-slate-300"
                            }`}
                          >
                            {doc.isRequired ? "Required" : "Optional"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocumentItem(doc.name)}
                            className="text-slate-400 hover:text-rose-600 transition-colors shrink-0 mt-0.5"
                            title="Remove Document"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setServiceModalOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingService}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {savingService ? "Saving..." : editingService ? "Save Service" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* 3. View Service Details Modal */}
      {/* ==================================================== */}
      <Dialog open={!!viewingService} onOpenChange={(open) => { if (!open) setViewingService(null); }}>
        <DialogContent className="max-w-2xl p-6 bg-white max-h-[92vh] overflow-y-auto">
          {viewingService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  {viewingService.name}
                </DialogTitle>
                <DialogDescription className="text-xs flex flex-wrap items-center gap-1.5 pt-1">
                  {viewingService.category?.name && (
                    <span className="font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {viewingService.category.name}
                    </span>
                  )}
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {serviceTypeLabel(viewingService.serviceType)}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-3 text-xs">
                {/* Service Information */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Service Charges</span>
                    <span className="font-black text-slate-900 text-base">{formatCurrency(detailRate)}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Estimated Days</span>
                    <span className="font-black text-slate-900 text-base">
                      {Number(viewingService.estimatedDays) > 0
                        ? `${Number(viewingService.estimatedDays)} Days`
                        : "Estimated time not specified"}
                    </span>
                  </div>
                </div>

                {/* Customer Summary */}
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                  <h4 className="text-xs font-bold text-emerald-900">Customer Summary — read to customer</h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    <span className="font-bold">{viewingService.name}</span>
                    {(viewingService.correctionOptions || []).filter((c: any) => c.isActive !== false).length > 0 &&
                      ` — available for ${(viewingService.correctionOptions || [])
                        .filter((c: any) => c.isActive !== false)
                        .map((c: any) => c.name)
                        .join(", ")}`}
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Charges: <span className="font-bold">{formatCurrency(detailRate)}</span>
                    {"  "}• Estimated:{" "}
                    <span className="font-bold">
                      {Number(viewingService.estimatedDays) > 0
                        ? `${Number(viewingService.estimatedDays)} Days`
                        : "Not specified"}
                    </span>
                    {(viewingService.requiredDocuments || []).length > 0 &&
                      `  • Documents: ${(viewingService.requiredDocuments || []).map((d: any) => d.name).join(" + ")}`}
                  </p>
                </div>

                {/* Available Corrections */}
                {(viewingService.serviceType || "NEW") === "CORRECTION" && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-sky-600" /> Available Corrections
                    </h4>
                    {(viewingService.correctionOptions || []).filter((c: any) => c.isActive !== false).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {(viewingService.correctionOptions || [])
                          .filter((c: any) => c.isActive !== false)
                          .map((c: any) => (
                            <div key={c.id || c.name} className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50/60 border border-sky-100">
                              <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 block">{c.name}</span>
                                {c.note && <span className="text-[11px] text-slate-500 block">{c.note}</span>}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No correction options defined for this service.</p>
                    )}
                  </div>
                )}

                {/* Required Documents */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ListChecks className="h-3.5 w-3.5 text-emerald-600" /> Required Documents
                    ({(viewingService.requiredDocuments || []).length})
                  </h4>
                  {(viewingService.requiredDocuments || []).length > 0 ? (
                    <div className="space-y-1.5">
                      {(viewingService.requiredDocuments || []).map((d: any) => (
                        <div key={d.id || d.name} className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-slate-800 block">{d.name}</span>
                            {d.description && <span className="text-[11px] text-slate-500 block">“{d.description}”</span>}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                              d.isRequired !== false
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-white text-slate-500 border-slate-300"
                            }`}
                          >
                            {d.isRequired !== false ? "Required" : "Optional"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No documents specified</p>
                  )}
                </div>

                {/* About */}
                {viewingService.description && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">About This Service</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{viewingService.description}</p>
                  </div>
                )}

                {/* Employee Instructions + Quick Guide */}
                {viewingService.employeeInstructions && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-900">Employee Quick Guide (internal)</h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed whitespace-pre-line">
                      {viewingService.employeeInstructions}
                    </p>
                    <div className="text-[11px] text-amber-800 space-y-0.5 pt-1 border-t border-amber-200">
                      <p className="font-semibold">What to ask customer</p>
                      <ul className="list-disc ml-4 space-y-0.5">
                        {(viewingService.correctionOptions || []).filter((c: any) => c.isActive !== false).length > 0 && (
                          <li>
                            Which correction is required? (
                            {(viewingService.correctionOptions || [])
                              .filter((c: any) => c.isActive !== false)
                              .map((c: any) => c.name)
                              .join(", ")}
                            )
                          </li>
                        )}
                        <li>Verify spelling carefully and confirm mobile number.</li>
                        {(viewingService.requiredDocuments || []).length > 0 && (
                          <li>
                            Collect documents: {(viewingService.requiredDocuments || []).map((d: any) => d.name).join(", ")}.
                          </li>
                        )}
                        <li>Verify originals before submission.</li>
                      </ul>
                    </div>
                  </div>
                )}
                {/* Share on WhatsApp (staff only — needs WHATSAPP_SEND permission) */}
                {!isAgent && (
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select value={shareCustomerId} onValueChange={setShareCustomerId}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue placeholder="Select customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {shareCustomers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} {c.mobile ? `(${c.mobile})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or enter mobile number..."
                      value={shareMobile}
                      onChange={(e) => setShareMobile(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={sharingWhatsApp}
                    onClick={handleShareWhatsApp}
                    className="h-8 text-xs bg-[#25D366] hover:bg-[#1fb857] text-white font-semibold w-full sm:w-auto"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    {sharingWhatsApp ? "Sharing..." : "Share Service Details"}
                  </Button>
                  <p className="text-[10px] text-emerald-700">
                    Sends the customer-facing summary above (charges, time, corrections, documents) to the customer.
                  </p>
                </div>
                )}
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setViewingService(null)} className="h-8 text-xs">
                  Close
                </Button>
                {canManageServices && (
                  <Button
                    type="button"
                    onClick={() => handleOpenEditService(viewingService)}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Service
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* 4. Smart Apply Popup (Admin, Staff, Agent) */}
      {/* ==================================================== */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-2xl p-6 bg-white max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              Apply — {applyCat?.name || ""}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill customer details, pick a sub-service, attach documents and submit — no page change.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            {/* Customer */}
            {!isAgent && (
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 w-fit">
                {(["existing", "new"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setApplyCustMode(m)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      applyCustMode === m ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    {m === "existing" ? "Existing Customer" : "New Customer"}
                  </button>
                ))}
              </div>
            )}

            {!isAgent && applyCustMode === "existing" ? (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Select Customer *</label>
                <Select value={applyCustomerId} onValueChange={setApplyCustomerId}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Choose customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applyCustomers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.mobile})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Customer Name *</label>
                  <Input
                    placeholder="Full name"
                    value={applyName}
                    onChange={(e) => setApplyName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">10-digit Mobile *</label>
                  <Input
                    placeholder="9820112233"
                    value={applyMobile}
                    onChange={(e) => setApplyMobile(e.target.value.replace(/\D/g, ""))}
                    className="h-8 text-xs font-mono"
                    maxLength={10}
                  />
                </div>
              </div>
            )}

            {!isAgent && applyCustMode === "new" && myRole === "EMPLOYEE" && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">My Agent *</label>
                {applyAgents.length === 0 ? (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
                    No agents work under you yet. Ask Admin to map agents first.
                  </p>
                ) : (
                  <Select value={applyAgentId} onValueChange={setApplyAgentId}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Select one of your agents..." />
                    </SelectTrigger>
                    <SelectContent>
                      {applyAgents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {(a.businessName && a.businessName !== "-" ? `${a.businessName} — ` : "") + a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Sub-service */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">
                Sub-service * <span className="font-normal text-slate-400">({applyCat?.name || ""})</span>
              </label>
              <Select value={applyServiceId} onValueChange={(v) => { setApplyServiceId(v); setApplyCorrIds([]); setApplyCustom({}); }}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="Choose sub-service..." />
                </SelectTrigger>
                <SelectContent>
                  {(applyCat?.items || []).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER_KEY}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Corrections */}
            {applyService?.serviceType === "CORRECTION" &&
              (applyService?.correctionOptions || []).filter((c: any) => c.isActive !== false).length > 0 && (
                <div className="space-y-1.5 p-2.5 rounded-lg bg-sky-50/60 border border-sky-200">
                  <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wide block">
                    What to correct?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {(applyService.correctionOptions || [])
                      .filter((c: any) => c.isActive !== false)
                      .map((c: any) => {
                        const checked = applyCorrIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[11px] cursor-pointer ${
                              checked
                                ? "bg-sky-100 border-sky-300 text-sky-900 font-semibold"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleApplyCorr(c.id)}
                              className="h-3.5 w-3.5 accent-sky-600 shrink-0"
                            />
                            <span className="truncate" title={c.note || c.name}>{c.name}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

            {/* Password */}
            {applyShowPassword && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">
                  Document Password * <span className="font-normal text-slate-400">(for staff to open documents)</span>
                </label>
                <Input
                  placeholder="PDF / portal password shared by customer"
                  value={applyPassword}
                  onChange={(e) => setApplyPassword(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}

            {/* Applicant custom fields (service master form) */}
            {!isApplyOther && (
              <CustomFieldsForm
                fields={applyService?.customFields}
                values={applyCustom}
                onChange={handleApplyCustomChange}
                resetKey={applyServiceId}
              />
            )}

            {/* Documents */}
            {isApplyOther ? (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Upload Documents * (both required)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {["Document 1", "Document 2"].map((docName) => (
                    <label key={docName} className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => handleApplyFile(docName, e.target.files?.[0])}
                      />
                      <span
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md border border-dashed text-[11px] font-semibold transition-colors ${
                          applyFiles[docName]
                            ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                            : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400"
                        }`}
                      >
                        <UploadCloud className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {applyFiles[docName] ? applyFiles[docName].name.slice(0, 24) : `${docName} *`}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              modalNeedUpload &&
              applyService &&
              (applyService.requiredDocuments || []).length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Upload Documents ({(applyService.requiredDocuments || []).length})
                  </label>
                  <div className="space-y-1.5">
                    {(applyService.requiredDocuments || []).map((d: any) => (
                      <div key={d.id || d.name} className="flex items-center gap-2 text-[11px]">
                        <span className="flex-1 truncate font-medium text-slate-700" title={d.description || d.name}>
                          {d.name}
                          {d.isRequired === false && <span className="text-slate-400"> (opt)</span>}
                        </span>
                        {modalNeedUpload && (
                          <label className="cursor-pointer shrink-0">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="hidden"
                              onChange={(e) => handleApplyFile(d.name, e.target.files?.[0])}
                            />
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed text-[10px] font-semibold transition-colors ${
                                applyFiles[d.name]
                                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                  : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400"
                              }`}
                            >
                              <UploadCloud className="h-3 w-3" />
                              {applyFiles[d.name] ? applyFiles[d.name].name.slice(0, 18) : "Attach *"}
                            </span>
                          </label>
                        )}
                        {modalNeedUpload && applyFiles[d.name] && (
                          <button
                            type="button"
                            onClick={() => handleApplyFile(d.name, undefined)}
                            className="text-slate-400 hover:text-rose-600 text-[10px] font-bold shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Notes + Total */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Notes (optional)</label>
              <Input
                placeholder="Any remarks for office staff"
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-3 text-xs py-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-black text-slate-900 text-sm whitespace-nowrap">{formatCurrency(applyTotal)}</span>
              <span className="text-slate-300">|</span>
              <span className="text-[11px] text-slate-500">Total (service rate, locked)</span>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setApplyOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApplySubmit}
              disabled={applySaving || applyUploading}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {applySaving || applyUploading ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
      <ServicesContent />
    </Suspense>
  );
}

