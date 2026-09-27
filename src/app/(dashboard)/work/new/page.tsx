"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  UploadCloud,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { attachDocFilesToWork, clientRateFor } from "@/lib/work-apply";
import {
  CustomFieldsForm,
  validateCustomFieldValues,
  toCustomFieldPayload,
} from "@/components/common/CustomFieldsForm";

function NewWorkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get("customerId");
  const initialServiceId = searchParams.get("serviceId");
  const initialCategoryId = searchParams.get("categoryId");

  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || "");
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || "");
  const [selectedCorrectionIds, setSelectedCorrectionIds] = useState<string[]>([]);
  // Agent apply mode: customer is always created fresh with the work order
  const [myRole, setMyRole] = useState("");
  const isAgent = myRole === "AGENT";

  const priceFor = useCallback((s: any) => clientRateFor(s, isAgent), [isAgent]);
  const [newCustName, setNewCustName] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");

  // Agent two-step picker: Category -> Sub-service (+ Other)
  // When arriving from a category card Apply (?categoryId=), the category is
  // already locked — the dropdown is hidden to avoid duplication.
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId || "");
  const categoryLocked = Boolean(initialCategoryId);
  const OTHER_KEY = "__OTHER__";

  // Document/PDF password collected at apply (staff use only)
  const [documentPassword, setDocumentPassword] = useState("");

  // Applicant custom field values, keyed by fieldKey
  const [customValues, setCustomValues] = useState<Record<string, { value: string; valueMr: string }>>({});

  const handleCustomChange = useCallback((fieldKey: string, patch: Partial<{ value: string; valueMr: string }>) => {
    setCustomValues((prev) => {
      const cur = prev[fieldKey] || { value: "", valueMr: "" };
      return { ...prev, [fieldKey]: { ...cur, ...patch } };
    });
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        const role = j.data?.user?.role || "";
        setMyRole(role);
      })
      .catch(() => {});
  }, []);
  // Pre-attached citizen document files, keyed by required-document NAME
  // (WorkDocument rows are created at submit; matched back by name)
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [assignedUserId, setAssignedUserId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [customPrice, setCustomPrice] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        setLoading(true);
        const [custRes, srvRes, empRes] = await Promise.all([
          fetch("/api/customers?pageSize=100"),
          fetch("/api/services?activeOnly=true"),
          fetch("/api/employees"),
        ]);
        const custJson = await custRes.json();
        const srvJson = await srvRes.json();
        const empJson = await empRes.json();

        if (custJson.success) setCustomers(custJson.data || []);
        if (srvJson.success) {
          const srvList = srvJson.data || [];
          setServices(srvList);
          if (initialServiceId) {
            const match = srvList.find((s: any) => s.id === initialServiceId);
            if (match) {
              setCustomPrice(priceFor(match).toString());
              setSelectedCategoryId(match.categoryId || match.category?.id || "");

              const due = new Date();
              due.setDate(due.getDate() + (match.estimatedDays || 3));
              setDueDate(due.toISOString().slice(0, 10));
            }
          }
        }
        if (empJson.success) setEmployees(empJson.data || []);
      } catch (e) {
        toast.error("Failed to load prerequisites");
      } finally {
        setLoading(false);
      }
    };
    loadPrerequisites();
  }, [initialServiceId, priceFor]);

  const selectedService = useMemo(() => {
    if (selectedServiceId === OTHER_KEY) return null;
    return services.find((s) => s.id === selectedServiceId);
  }, [services, selectedServiceId]);

  const isOtherService = selectedServiceId === OTHER_KEY;

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of services) {
      const cid = s.categoryId || s.category?.id || "";
      const cname = s.category?.name || "General";
      if (cid && !map.has(cid)) map.set(cid, cname);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [services]);

  const categoryServices = useMemo(
    () => services.filter((s) => (s.categoryId || s.category?.id || "") === selectedCategoryId),
    [services, selectedCategoryId]
  );

  // Password field shows only when the master service has Password Required ON.
  // (Admin sets it per service in Services tab — currently Smart Card scoped.)
  // For "Other", the generic service row isn't loaded client-side, so fall back
  // to the Smart-Card category rule.
  const showPasswordField = useMemo(() => {
    if (isOtherService) {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      return /smart/i.test(cat?.name || "");
    }
    if (!selectedService) return false;
    return Boolean(selectedService.passwordRequired);
  }, [isOtherService, selectedCategoryId, categories, selectedService]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedServiceId("");
    setSelectedCorrectionIds([]);
    setDocFiles({});
    setCustomValues({});
    setDocumentPassword("");
    setCustomPrice("");
  }, []);

  const handleServiceSelect = useCallback((serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedCorrectionIds([]);
    setDocFiles({});
    setCustomValues({});
    setDocumentPassword("");
    if (serviceId === OTHER_KEY) {
      setCustomPrice("");
      const due = new Date();
      due.setDate(due.getDate() + 3);
      setDueDate(due.toISOString().slice(0, 10));
      return;
    }
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setCustomPrice(priceFor(service).toString());

      const due = new Date();
      due.setDate(due.getDate() + (service.estimatedDays || 3));
      setDueDate(due.toISOString().slice(0, 10));
    } else {
      setCustomPrice("");
    }
  }, [services, priceFor]);

  const handleToggleCorrection = useCallback((corrId: string) => {
    setSelectedCorrectionIds((prev) =>
      prev.includes(corrId) ? prev.filter((id) => id !== corrId) : [...prev, corrId]
    );
  }, []);

  const handleDocFileChange = useCallback((docName: string, file: File | undefined) => {
    setDocFiles((prev) => {
      if (!file) {
        const next = { ...prev };
        delete next[docName];
        return next;
      }
      return { ...prev, [docName]: file };
    });
  }, []);

  // Upload pre-attached files to the freshly created work's document checklist
  const attachDocFiles = useCallback(
    (workDbId: string) => attachDocFilesToWork(workDbId, docFiles),
    [docFiles]
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const isAgentApply = isAgent;

    if (!selectedServiceId) {
      toast.error("Please select a Master Service");
      return;
    }

    // Agent one-shot flow: customer + work order together, then file attach
    if (isAgentApply) {
      if (!newCustName.trim() || newCustMobile.trim().length !== 10) {
        toast.error("Enter customer name and 10-digit mobile number");
        return;
      }
      if (isOtherService && (!docFiles["Document 1"] || !docFiles["Document 2"])) {
        toast.error("Please upload both Document 1 and Document 2 for Other service");
        return;
      }
      if (!isOtherService) {
        const customErr = validateCustomFieldValues(selectedService?.customFields, customValues);
        if (customErr) {
          toast.error(customErr);
          return;
        }
      }
      setSubmitting(true);
      try {
        const res = await fetch("/api/work/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCustName.trim(),
            mobile: newCustMobile.trim(),
            serviceId: selectedServiceId,
            categoryId: isOtherService ? selectedCategoryId : undefined,
            documentPassword: showPasswordField && documentPassword.trim() ? documentPassword.trim() : undefined,
            selectedCorrections: selectedCorrectionIds,
            customFieldValues: isOtherService
              ? []
              : toCustomFieldPayload(selectedService?.customFields, customValues),
          }),
        });
        const json = await res.json();
        if (!json.success || !json.data?.work?.id) {
          throw new Error(json.error?.message || "Failed to submit application");
        }

        let attachNote = "";
        if (Object.keys(docFiles).length > 0) {
          setUploadingDocs(true);
          try {
            const { attached, failed } = await attachDocFiles(json.data.work.id);
            if (attached > 0) attachNote = ` ${attached} document(s) attached.`;
            if (failed > 0) attachNote += ` ${failed} file(s) failed — re-attach from work details.`;
          } catch {
            attachNote = " Documents failed to attach — add them from work details.";
          } finally {
            setUploadingDocs(false);
          }
        }

        toast.success(
          `Application submitted! Customer ${json.data.customer.name} + work ${json.data.work.workId}.${attachNote} Track status in My Work Orders.`
        );
        router.push(`/work/${json.data.work.id}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to submit application");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!selectedCustomerId || !selectedServiceId) {
      toast.error("Please select both a Customer and a Master Service");
      return;
    }

    if (!isOtherService) {
      const customErr = validateCustomFieldValues(selectedService?.customFields, customValues);
      if (customErr) {
        toast.error(customErr);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          serviceId: selectedServiceId,
          selectedCorrections: selectedCorrectionIds,
          assignedUserId: assignedUserId || undefined,
          priority,
          totalAmount: customPrice ? parseFloat(customPrice) : undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          notes,
          documentPassword: showPasswordField && documentPassword.trim() ? documentPassword.trim() : undefined,
          customFieldValues: isOtherService
            ? []
            : toCustomFieldPayload(selectedService?.customFields, customValues),
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to create work order");
      }

      // One-screen submit: attach pre-selected citizen document files
      let attachNote = "";
      if (Object.keys(docFiles).length > 0) {
        setUploadingDocs(true);
        try {
          const { attached, failed } = await attachDocFiles(json.data.id);
          if (attached > 0) attachNote = ` ${attached} document(s) attached.`;
          if (failed > 0) attachNote += ` ${failed} file(s) failed — re-attach from work details.`;
        } catch (e: any) {
          attachNote = " Documents failed to attach — add them from work details.";
        } finally {
          setUploadingDocs(false);
        }
      }

      toast.success(`Work order ${json.data.workId} created successfully!${attachNote}`);
      router.push(`/work/${json.data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create work order");
    } finally {
      setSubmitting(false);
    }
  }, [
    selectedCustomerId,
    selectedServiceId,
    selectedCorrectionIds,
    assignedUserId,
    priority,
    customPrice,
    dueDate,
    notes,
    docFiles,
    attachDocFiles,
    myRole,
    newCustName,
    newCustMobile,
    selectedCategoryId,
    isOtherService,
    showPasswordField,
    documentPassword,
    customValues,
    selectedService,
    router,
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/work"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Work Orders
      </Link>

      <PageHeader
        title="Create New Work Order"
        subtitle="Initiate a citizen service application, configure dynamic options, and generate document checklist"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Customer & Master Service Selection */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">1. Customer & Master Service</CardTitle>
              <CardDescription className="text-xs">Select citizen applicant and government service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Customer (agents: always a fresh inline customer in apply flow) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700">
                    {isAgent ? "New Customer *" : "Select Customer *"}
                  </label>
                  {!isAgent && (
                    <Link href="/customers" className="text-[11px] font-semibold text-emerald-600 hover:underline">
                      + Register Customer
                    </Link>
                  )}
                </div>
                {isAgent ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      required
                      placeholder="Customer full name *"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="h-9 text-xs bg-white col-span-2"
                    />
                    <Input
                      required
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile *"
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value.replace(/\D/g, ""))}
                      className="h-9 text-xs bg-white font-mono col-span-2"
                    />
                  </div>
                ) : (
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-9 text-xs bg-white">
                      <SelectValue placeholder="Choose applicant customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.mobile}) - {c.customerId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedCustomer && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Selected: <span className="font-bold text-slate-800">{selectedCustomer.name}</span> •{" "}
                    {selectedCustomer.area || selectedCustomer.city}
                  </p>
                )}
              </div>

              {/* Master Service: staff = single dropdown; agent = Category -> Sub-service */}
              {isAgent ? (
                <div className="space-y-2.5">
                  {!categoryLocked && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="font-semibold text-slate-700">Service Category *</label>
                        <Link href="/services" className="text-[11px] font-semibold text-slate-500 hover:underline">
                          View Services
                        </Link>
                      </div>
                      <Select value={selectedCategoryId} onValueChange={handleCategorySelect}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                          <SelectValue placeholder="Choose category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedCategoryId && (
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">
                        Sub-service *
                        {categoryLocked && (
                          <span className="ml-1.5 font-normal text-slate-400">
                            ({categories.find((c) => c.id === selectedCategoryId)?.name || "Selected category"})
                          </span>
                        )}
                      </label>
                      <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                          <SelectValue placeholder="Choose sub-service..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryServices.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                          <SelectItem value={OTHER_KEY}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-700">Select Service *</label>
                    <Link href="/services" className="text-[11px] font-semibold text-slate-500 hover:underline">
                      View Services
                    </Link>
                  </div>
                  <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
                    <SelectTrigger className="h-9 text-xs bg-white">
                      <SelectValue placeholder="Choose Service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.category?.name ? `${s.category.name} — ` : ""}
                          {s.name} — {formatCurrency(s.customerPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Document password (Aadhaar/PAN-like or Correction services) */}
              {showPasswordField && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Document Password <span className="font-normal text-slate-400">(for staff to open documents)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. PDF / portal password shared by customer"
                    value={documentPassword}
                    onChange={(e) => setDocumentPassword(e.target.value)}
                    className="h-9 text-xs bg-white font-mono"
                  />
                </div>
              )}

              {/* Service Quick Info + Correction Selection + Document Checklist */}
              {selectedService && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-700 truncate">{selectedService.name}</span>
                  </div>

                  {selectedService.serviceType === "CORRECTION" &&
                    (selectedService.correctionOptions || []).filter((c: any) => c.isActive !== false).length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-200">
                        <span className="font-bold text-[11px] text-slate-700 block pt-1.5">
                          Select Correction Required:
                        </span>
                        <div className="grid grid-cols-1 gap-1">
                          {(selectedService.correctionOptions || [])
                            .filter((c: any) => c.isActive !== false)
                            .map((c: any) => {
                              const checked = selectedCorrectionIds.includes(c.id);
                              return (
                                <label
                                  key={c.id}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-[11px] cursor-pointer transition-colors ${
                                    checked
                                      ? "bg-sky-50 border-sky-300 text-sky-900 font-semibold"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleCorrection(c.id)}
                                    className="h-3.5 w-3.5 accent-sky-600"
                                  />
                                  <span className="flex-1">{c.name}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}

                  {/* Applicant custom fields (service master form, incl. Marathi) */}
                  <CustomFieldsForm
                    fields={selectedService.customFields}
                    values={customValues}
                    onChange={handleCustomChange}
                    resetKey={selectedServiceId}
                  />

                  {selectedService.requiredDocuments && selectedService.requiredDocuments.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200">
                      <span className="font-bold text-[11px] text-slate-700 block pt-1.5">
                        Required Checklist ({selectedService.requiredDocuments.length} documents):
                      </span>
                      <ul className="space-y-1.5">
                        {selectedService.requiredDocuments.map((d: any) => (
                          <li key={d.id} className="text-[11px] text-slate-600 space-y-1">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span className="flex-1 truncate" title={d.description || d.name}>{d.name}</span>
                              {d.isRequired === false && (
                                <span className="text-[10px] text-slate-400">(optional)</span>
                              )}
                            </span>
                            <label className="flex items-center gap-1.5 ml-4 cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={(e) => handleDocFileChange(d.name, e.target.files?.[0])}
                              />
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-slate-300 bg-white text-[10px] font-semibold text-slate-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
                                <UploadCloud className="h-3 w-3" />
                                {docFiles[d.name] ? docFiles[d.name].name.slice(0, 22) : "Attach file"}
                              </span>
                              {docFiles[d.name] && (
                                <button
                                  type="button"
                                  onClick={() => handleDocFileChange(d.name, undefined)}
                                  className="text-slate-400 hover:text-rose-600 text-[10px] font-bold"
                                  title="Remove file"
                                >
                                  ✕
                                </button>
                              )}
                            </label>
                          </li>
                        ))}
                      </ul>
                      {Object.keys(docFiles).length > 0 && (
                        <p className="text-[10px] text-slate-400">
                          {Object.keys(docFiles).length} file(s) will upload on submit
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Other custom requirement: same flow, 2 document upload fields */}
              {isOtherService && (
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-700">Other Service</span>
                    <span className="text-[11px] text-slate-500">
                      {categories.find((c) => c.id === selectedCategoryId)?.name || ""}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Describe the requirement in notes below and upload both documents.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["Document 1", "Document 2"].map((docName) => (
                      <label key={docName} className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => handleDocFileChange(docName, e.target.files?.[0])}
                        />
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md border border-dashed text-[11px] font-semibold transition-colors ${
                            docFiles[docName]
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                              : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400"
                          }`}
                        >
                          <UploadCloud className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {docFiles[docName] ? docFiles[docName].name.slice(0, 24) : `${docName} *`}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Pricing, Assignment & Schedule */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">2. Processing & Financial Details</CardTitle>
              <CardDescription className="text-xs">Configure rates, operator assignments, and due date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    <span>Total Billed Amount (₹) *</span>
                  </label>
                  {isAgent ? (
                    <div className="h-9 px-3 flex items-center text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md">
                      {formatCurrency(Number(customPrice) || 0)}
                    </div>
                  ) : (
                    <Input
                      required
                      type="number"
                      min={0}
                      placeholder="250"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="h-9 text-xs font-bold text-slate-900 bg-white"
                    />
                  )}
                </div>

                {!isAgent && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Priority Level</label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="h-9 text-xs bg-white">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low Priority</SelectItem>
                        <SelectItem value="MEDIUM">Normal / Medium</SelectItem>
                        <SelectItem value="HIGH">High Priority</SelectItem>
                        <SelectItem value="URGENT">Urgent (Express)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!isAgent && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Assigned Operator</label>
                    <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                      <SelectTrigger className="h-9 text-xs bg-white">
                        <SelectValue placeholder="Assign staff..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} ({emp.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Target Due Date</label>
                  {isAgent ? (
                    <div className="h-9 px-3 flex items-center text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-semibold">
                      <Clock className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                      {dueDate || "Auto (service SLA)"}
                    </div>
                  ) : (
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Application Notes / Remarks</label>
                <Input
                  placeholder="e.g. Customer requested urgent processing; physical documents received"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-xs bg-white"
                />
              </div>

              {!isAgent && selectedService && (
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-700" /> Estimated Processing SLA: {selectedService.estimatedDays || 3} days
                  </p>
                  <p className="text-emerald-700">
                    Service Rate: {formatCurrency(selectedService.customerPrice)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link href="/work">
            <Button type="button" variant="outline" className="h-9 text-xs bg-white">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting || uploadingDocs}
            className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 shadow-sm"
          >
            {submitting || uploadingDocs ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {uploadingDocs ? "Uploading documents..." : "Creating Order..."}
              </span>
            ) : (
              "Confirm & Create Work Order"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewWorkPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full max-w-4xl mx-auto rounded-lg" />}>
      <NewWorkContent />
    </Suspense>
  );
}
