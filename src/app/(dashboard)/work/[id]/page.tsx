"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Receipt as ReceiptIcon,
  CheckCircle2,
  UploadCloud,
  Eye,
  EyeOff,
  Plus,
  Clock,
  FileText,
  Tag,
  Download,
  Trash2,
  PencilLine,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkStatusBadge, PaymentStatusBadge, DocumentStateBadge } from "@/components/common/StatusBadge";
import { WorkTimeline } from "@/components/common/WorkTimeline";
import { FileUploadDropzone } from "@/components/common/FileUploadDropzone";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { WORK_STATUS_FLOW, PERMISSIONS } from "@/lib/constants";
import { WorkStatus, PaymentMethod } from "@/types";

export default function WorkDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workId = params.id as string;

  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  // Application & Tracking (tracking number + service dates)
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [trackingValue, setTrackingValue] = useState("");
  const [datesForm, setDatesForm] = useState({ documentsReceivedDate: "", appliedDate: "", deliveryDate: "" });
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingDates, setSavingDates] = useState(false);

  // Service Documents (service receipt + certificate) upload/replace/delete
  const [receiptUploadOpen, setReceiptUploadOpen] = useState(false);
  const [certificateUploadOpen, setCertificateUploadOpen] = useState(false);
  const [receiptDeleteOpen, setReceiptDeleteOpen] = useState(false);
  const [certificateDeleteOpen, setCertificateDeleteOpen] = useState(false);
  const [docBusy, setDocBusy] = useState(false);

  // Status Change Dialog
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Payment Collection Dialog
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Document Upload / Verify / Reject Dialogs
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showDocPassword, setShowDocPassword] = useState(false);

  const fetchWork = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/work/${workId}`);
      const json = await res.json();
      if (json.success) {
        setWork(json.data);
      } else {
        toast.error("Work order not found");
      }
    } catch (e) {
      toast.error("Failed to load work details");
    } finally {
      setLoading(false);
    }
  }, [workId]);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.success) setMe(json.data?.user || null);
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (workId) {
      fetchWork();
      fetchMe();
    }
  }, [workId, fetchWork, fetchMe]);

  const handleStatusUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewStatus) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/work/${workId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedNewStatus,
          notes: statusNotes,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to update status");
      }

      toast.success(`Status updated to ${selectedNewStatus}`);
      setStatusOpen(false);
      setStatusNotes("");
      fetchWork();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }, [workId, selectedNewStatus, statusNotes, fetchWork]);

  const handleCollectPayment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid positive payment amount");
      return;
    }

    if (amountNum > work.pendingAmount) {
      toast.error(`Amount ₹${amountNum} exceeds pending balance of ₹${work.pendingAmount}`);
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId: work.id,
          amount: amountNum,
          paymentMethod,
          transactionId: transactionId.trim() || undefined,
          notes: paymentNotes,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Payment recording failed");
      }

      toast.success(`Payment of ₹${amountNum} recorded! Receipt: ${json.data.receipt?.receiptNumber}`);
      setPaymentOpen(false);
      setPaymentAmount("");
      setTransactionId("");
      setPaymentNotes("");
      fetchWork();
    } catch (err: any) {
      toast.error(err.message || "Payment recording failed");
    } finally {
      setProcessingPayment(false);
    }
  }, [workId, work, paymentAmount, paymentMethod, transactionId, paymentNotes, fetchWork]);

  const handleDocumentUploaded = useCallback(async (fileData: any) => {
    if (!uploadDocId) return;
    try {
      const res = await fetch(`/api/work/${work.id}/documents/${uploadDocId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: "UPLOADED",
          fileUrl: fileData.url,
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Document uploaded!");
        setUploadDocId(null);
        fetchWork();
      }
    } catch (e) {
      toast.error("Failed to link document");
    }
  }, [uploadDocId, work, fetchWork]);

  const handleVerifyDocument = useCallback(async (docId: string) => {
    try {
      const res = await fetch(`/api/work/${work.id}/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "VERIFIED" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Document verified!");
        fetchWork();
      }
    } catch (e) {
      toast.error("Failed to verify document");
    }
  }, [work, fetchWork]);

  const handleRejectDocument = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectDocId) return;

    try {
      const res = await fetch(`/api/work/${work.id}/documents/${rejectDocId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: "REJECTED",
          rejectionReason: rejectionReason || "Document copy is blurred or incomplete",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Document rejected with note");
        setRejectDocId(null);
        setRejectionReason("");
        fetchWork();
      }
    } catch (e) {
      toast.error("Failed to reject document");
    }
  }, [rejectDocId, rejectionReason, work, fetchWork]);

  const hasPermission = useCallback(
    (perm: string) => me?.role === "ADMIN" || (me?.permissions || []).includes(perm),
    [me]
  );

  const openTrackingEdit = useCallback(() => {
    setTrackingValue(work?.trackingReferenceNumber || "");
    setTrackingOpen(true);
  }, [work]);

  const openDatesEdit = useCallback(() => {
    setDatesForm({
      documentsReceivedDate: work?.documentsReceivedDate ? String(work.documentsReceivedDate).slice(0, 10) : "",
      appliedDate: work?.appliedDate ? String(work.appliedDate).slice(0, 10) : "",
      deliveryDate: work?.deliveryDate ? String(work.deliveryDate).slice(0, 10) : "",
    });
    setDatesOpen(true);
  }, [work]);

  const handleSaveTracking = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTracking(true);
    try {
      const res = await fetch(`/api/work/${work.id}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingReferenceNumber: trackingValue }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to update tracking number");
      toast.success("Tracking / Reference Number updated");
      setTrackingOpen(false);
      fetchWork();
    } catch (err: any) {
      toast.error(err.message || "Failed to update tracking number");
    } finally {
      setSavingTracking(false);
    }
  }, [work, trackingValue, fetchWork]);

  const handleSaveDates = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDates(true);
    try {
      const res = await fetch(`/api/work/${work.id}/dates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datesForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to update service dates");
      toast.success("Service dates updated");
      setDatesOpen(false);
      fetchWork();
    } catch (err: any) {
      toast.error(err.message || "Failed to update service dates");
    } finally {
      setSavingDates(false);
    }
  }, [work, datesForm, fetchWork]);

  const handleUploadFile = useCallback(async (type: "SERVICE_RECEIPT" | "CERTIFICATE", fileData: any) => {
    setDocBusy(true);
    try {
      const res = await fetch(`/api/work/${work.id}/${type === "SERVICE_RECEIPT" ? "service-receipt" : "certificate"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: fileData.url,
          key: fileData.key,
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Upload failed");
      toast.success(type === "SERVICE_RECEIPT" ? "Service Receipt uploaded!" : "Certificate uploaded!");
      setReceiptUploadOpen(false);
      setCertificateUploadOpen(false);
      fetchWork();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setDocBusy(false);
    }
  }, [work, fetchWork]);

  const handleDeleteFile = useCallback(async (type: "SERVICE_RECEIPT" | "CERTIFICATE") => {
    setDocBusy(true);
    try {
      const res = await fetch(`/api/work/${work.id}/${type === "SERVICE_RECEIPT" ? "service-receipt" : "certificate"}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Delete failed");
      toast.success(type === "SERVICE_RECEIPT" ? "Service Receipt removed" : "Certificate removed");
      setReceiptDeleteOpen(false);
      setCertificateDeleteOpen(false);
      fetchWork();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDocBusy(false);
    }
  }, [work, fetchWork]);

  const parsedOptions: Array<{ id: string; name: string; priceModifier: number }> = React.useMemo(() => {
    if (!work?.selectedOptions) return [];
    try {
      if (typeof work.selectedOptions === "string") {
        return JSON.parse(work.selectedOptions);
      }
      if (Array.isArray(work.selectedOptions)) {
        return work.selectedOptions;
      }
    } catch (e) {
      return [];
    }
    return [];
  }, [work?.selectedOptions]);

  const serviceReceipt = (work?.fileAssets || []).find((f: any) => f.documentType === "SERVICE_RECEIPT");
  const certificate = (work?.fileAssets || []).find((f: any) => f.documentType === "CERTIFICATE");
  const canEditTracking = hasPermission(PERMISSIONS.WORK_TRACKING_UPDATE);
  const canEditDates = hasPermission(PERMISSIONS.WORK_DATES_UPDATE);
  const canUpdateStatus = hasPermission(PERMISSIONS.WORK_STATUS_UPDATE);
  const canCollectPayment = hasPermission(PERMISSIONS.PAYMENTS_CREATE);
  const canVerifyDocs = hasPermission(PERMISSIONS.DOCUMENTS_VERIFY);
  const canRejectDocs = hasPermission(PERMISSIONS.DOCUMENTS_REJECT);
  // Document upload is Employee/Agent only — Admins can view/download but never upload.
  const canUploadFiles = me?.role === "EMPLOYEE" || me?.role === "AGENT";
  const canUploadReceipt = canUploadFiles && hasPermission(PERMISSIONS.WORK_SERVICE_RECEIPTS_UPLOAD);
  const canDeleteReceipt = hasPermission(PERMISSIONS.WORK_SERVICE_RECEIPTS_DELETE);
  const canUploadCertificate = canUploadFiles && hasPermission(PERMISSIONS.WORK_CERTIFICATES_UPLOAD);
  const canDeleteCertificate = hasPermission(PERMISSIONS.WORK_CERTIFICATES_DELETE);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
        <p className="font-bold text-slate-800">Work order not found</p>
        <Link href="/work" className="mt-4 inline-block text-emerald-600 font-semibold text-xs">
          ← Back to Work Orders
        </Link>
      </div>
    );
  }

  const allowedTransitions = WORK_STATUS_FLOW[work.status as WorkStatus] || [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <Link href="/work" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Work Orders
      </Link>

      {/* Main Work Header Card */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-lg font-black text-slate-900">{work.workId}</span>
              <WorkStatusBadge status={work.status} />
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Priority: {work.priority}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{work.service?.name}</h2>
              {work.service?.category?.name && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {work.service.category.name}
                </span>
              )}
            </div>
            {parsedOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pb-1">
                <span className="text-[11px] font-semibold text-slate-500">Selected Options:</span>
                {parsedOptions.map((opt, idx) => (
                  <span
                    key={idx}
                    className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                      opt.priceModifier > 0
                        ? "bg-amber-50 text-amber-900 border-amber-200 font-semibold"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {opt.name}{" "}
                    <span className="text-[10px] opacity-80">
                      ({opt.priceModifier > 0 ? `+${formatCurrency(opt.priceModifier)}` : "₹0"})
                    </span>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Customer: <Link href={`/customers/${work.customer?.id}`} className="font-semibold text-emerald-700 hover:underline">{work.customer?.name}</Link> ({work.customer?.mobile}) • Assigned to: <span className="font-medium text-slate-800">{work.assignedUser?.name || "Unassigned"}</span>
            </p>
          </div>

          {/* Action Buttons (staff-only: agents track status, never change it) */}
          <div className="flex flex-wrap items-center gap-2">
            {canUpdateStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setSelectedNewStatus(allowedTransitions[0] || ""); setStatusOpen(true); }}
                className="h-8 text-xs bg-white text-slate-800 border-slate-300 shadow-xs"
              >
                Update Status
              </Button>
            )}
            {canCollectPayment && work.pendingAmount > 0 && (
              <Button
                size="sm"
                onClick={() => { setPaymentAmount(work.pendingAmount.toString()); setPaymentOpen(true); }}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1" /> Collect Payment
              </Button>
            )}
          </div>
        </div>

        {/* Milestone Meta Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Created Date</span>
            <span className="font-bold text-slate-800">{formatDate(work.createdAt)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Target Due Date</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" /> {formatDate(work.dueDate)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Billed</span>
            <span className="font-bold text-slate-900">{formatCurrency(work.totalAmount)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Pending Balance</span>
            <span className={work.pendingAmount > 0 ? "font-bold text-rose-600" : "font-bold text-emerald-700"}>
              {formatCurrency(work.pendingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Documents & Payments) - Right (Timeline & Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application & Tracking */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" /> Application & Tracking
                </CardTitle>
                <CardDescription className="text-xs">
                  Tracking / reference number and key application dates
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                {canEditTracking && (
                  <Button size="sm" variant="outline" onClick={openTrackingEdit} className="h-7 text-xs px-2 bg-white text-slate-700">
                    <PencilLine className="h-3 w-3 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-slate-400 block text-[11px]">Tracking / Reference Number</span>
                  <span className="font-mono font-bold text-slate-900 block mt-0.5 break-all">
                    {work.trackingReferenceNumber || <span className="text-slate-400 font-normal italic">Not set</span>}
                  </span>
                </div>
                {work.documentPassword && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                    <span className="text-slate-400 block text-[11px]">Document Password (staff only)</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      {showDocPassword ? work.documentPassword : "••••••••"}
                      <button
                        type="button"
                        onClick={() => setShowDocPassword(!showDocPassword)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title={showDocPassword ? "Hide password" : "Show password"}
                      >
                        {showDocPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </span>
                  </div>
                )}
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Documents Received Date</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{formatDate(work.documentsReceivedDate)}</span>
                  </div>
                  {canEditDates && (
                    <Button size="sm" variant="outline" onClick={openDatesEdit} className="h-6 w-6 p-0 bg-white text-slate-500">
                      <PencilLine className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Applied Date</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{formatDate(work.appliedDate)}</span>
                  </div>
                  {canEditDates && (
                    <Button size="sm" variant="outline" onClick={openDatesEdit} className="h-6 w-6 p-0 bg-white text-slate-500">
                      <PencilLine className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Delivery Date</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{formatDate(work.deliveryDate)}</span>
                  </div>
                  {canEditDates && (
                    <Button size="sm" variant="outline" onClick={openDatesEdit} className="h-6 w-6 p-0 bg-white text-slate-500">
                      <PencilLine className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Tracking numbers are optional — some government services do not provide one and it may be left blank.
              </p>
            </CardContent>
          </Card>

          {/* Applicant Details (service master custom fields, incl. Marathi) */}
          {work.customFieldValues && work.customFieldValues.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Applicant Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Details collected at apply time from the service form
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {work.customFieldValues.map((f: any) => (
                    <div key={f.id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                      <span className="text-slate-400 block text-[11px]">{f.label}</span>
                      <span className="font-bold text-slate-900 block mt-0.5 break-words">{f.value || "—"}</span>
                      {f.valueMr && (
                        <span className="text-slate-600 block mt-0.5 break-words">{f.valueMr}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Documents */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5 text-slate-400" /> Service Documents
              </CardTitle>
              <CardDescription className="text-xs">
                Payment receipt, uploaded service receipt, and the final certificate for downloading / handing to the customer
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100">
              {/* Payment Receipts */}
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900">Payment Receipt</span>
                    <p className="text-[11px] text-slate-500">
                      {work.receipts?.length ? `${work.receipts.length} receipt(s) generated against payments` : "No payment receipt yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {work.receipts?.map((r: any) => (
                      <Link key={r.id} href={`/receipts/${r.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 bg-white">
                          <ReceiptIcon className="h-3 w-3 mr-1 text-emerald-600" /> View
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Receipt */}
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-slate-900">Service Receipt</span>
                    {serviceReceipt ? (
                      <p className="text-[11px] text-slate-500 font-mono truncate max-w-[260px]">
                        {serviceReceipt.fileName} • {serviceReceipt.uploader?.name || "Uploaded"} • {formatDateTime(serviceReceipt.createdAt)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">Not uploaded yet</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {serviceReceipt && (
                      <a href={serviceReceipt.url || `/uploads/${serviceReceipt.storageKey}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white">
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </a>
                    )}
                    {serviceReceipt && (
                      <a href={serviceReceipt.url || `/uploads/${serviceReceipt.storageKey}`} download>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white">
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      </a>
                    )}
                    {canUploadReceipt && (
                      <Button size="sm" variant="outline" onClick={() => setReceiptUploadOpen(true)} className="h-7 text-xs px-2 bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                        <UploadCloud className="h-3 w-3 mr-1" /> {serviceReceipt ? "Replace" : "Upload"}
                      </Button>
                    )}
                    {serviceReceipt && canDeleteReceipt && (
                      <Button size="sm" variant="outline" onClick={() => setReceiptDeleteOpen(true)} className="h-7 text-xs px-2 bg-white text-rose-600 border-rose-200 hover:bg-rose-50">
                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Certificate */}
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-slate-900">Certificate / Final Document</span>
                    {certificate ? (
                      <p className="text-[11px] text-slate-500 font-mono truncate max-w-[260px]">
                        {certificate.fileName} • {certificate.uploader?.name || "Uploaded"} • {formatDateTime(certificate.createdAt)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">Not uploaded yet</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {certificate && (
                      <a href={certificate.url || `/uploads/${certificate.storageKey}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white">
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </a>
                    )}
                    {certificate && (
                      <a href={certificate.url || `/uploads/${certificate.storageKey}`} download>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white">
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      </a>
                    )}
                    {canUploadCertificate && (
                      <Button size="sm" variant="outline" onClick={() => setCertificateUploadOpen(true)} className="h-7 text-xs px-2 bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                        <UploadCloud className="h-3 w-3 mr-1" /> {certificate ? "Replace" : "Upload"}
                      </Button>
                    )}
                    {certificate && canDeleteCertificate && (
                      <Button size="sm" variant="outline" onClick={() => setCertificateDeleteOpen(true)} className="h-7 text-xs px-2 bg-white text-rose-600 border-rose-200 hover:bg-rose-50">
                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 1: Required Documents Checklist */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">Required Documents Checklist</CardTitle>
              <CardDescription className="text-xs">
                Upload, verify, and inspect citizen documents required for portal submission
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {work.documents.map((doc: any) => (
                  <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{doc.documentName}</span>
                        <DocumentStateBadge state={doc.state} />
                      </div>
                      {doc.fileName && (
                        <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <FileText className="h-3 w-3 text-slate-400" /> {doc.fileName}
                        </p>
                      )}
                      {doc.rejectionReason && (
                        <p className="text-[11px] text-rose-600 font-medium">
                          Rejection note: {doc.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* Document Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.fileUrl ? (
                        <>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white">
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                          </a>
                          {doc.state !== "VERIFIED" && canVerifyDocs && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDocument(doc.id)}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                            </Button>
                          )}
                          {doc.state !== "REJECTED" && canRejectDocs && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectDocId(doc.id)}
                              className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 bg-white"
                            >
                              Reject
                            </Button>
                          )}
                        </>
                      ) : (
                        canUploadFiles && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUploadDocId(doc.id)}
                            className="h-7 text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          >
                            <UploadCloud className="h-3 w-3 mr-1" /> Upload
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Payments & Receipts */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Financial Records & Receipts</CardTitle>
                <CardDescription className="text-xs">All payment receipts linked to this work order</CardDescription>
              </div>
              {canCollectPayment && work.pendingAmount > 0 && (
                <Button
                  size="sm"
                  onClick={() => { setPaymentAmount(work.pendingAmount.toString()); setPaymentOpen(true); }}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-3 w-3 mr-1" /> Collect Payment
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {work.payments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No payments recorded for this order</div>
                ) : (
                  work.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{p.paymentId}</span>
                          <PaymentStatusBadge status={p.status} />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {p.paymentMethod} • Txn: {p.transactionId || "N/A"} • Collected by {p.collectedByUser?.name || "Staff"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-800">{formatCurrency(p.amount)}</span>
                        {p.receipt && (
                          <Link href={`/receipts/${p.receipt.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 bg-white">
                              <ReceiptIcon className="h-3 w-3 mr-1 text-emerald-600" /> Receipt
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Work Timeline & Notes (1 Col) */}
        <div className="space-y-6">
          {/* Notes Card */}
          {work.notes && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes & Remarks</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-700 leading-relaxed">
                {work.notes}
              </CardContent>
            </Card>
          )}

          {/* Timeline Card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-800">Application Lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkTimeline currentStatus={work.status} history={work.statusHistories} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Advance Work Order Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStatusUpdate} className="space-y-4 my-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Select New Status *</label>
              <Select value={selectedNewStatus} onValueChange={setSelectedNewStatus}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose status..." />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                  {/* Additional transitions for exceptional states */}
                  <SelectItem value="ON_HOLD">ON_HOLD</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Transition Notes / Remark</label>
              <Input
                placeholder="e.g. Application submitted on portal; Ack No. ACK998234"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setStatusOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={updatingStatus || !selectedNewStatus} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                {updatingStatus ? "Updating..." : "Update Status"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collect Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Record Payment & Issue Receipt</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCollectPayment} className="space-y-3 my-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Work Price</span>
                <span className="font-bold text-slate-900 text-sm">{formatCurrency(work.totalAmount)}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Balance Pending</span>
                <span className="font-bold text-rose-600 text-sm">{formatCurrency(work.pendingAmount)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Payment Amount (₹) *</label>
              <Input
                required
                type="number"
                min={1}
                max={work.pendingAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="h-9 text-sm font-bold text-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Payment Mode *</label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI (GooglePay / PhonePe / Paytm)</SelectItem>
                  <SelectItem value="CASH">Cash in Hand</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank IMPS / NEFT Transfer</SelectItem>
                  <SelectItem value="CARD">Debit / Credit Card</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">UPI / Reference Transaction ID</label>
              <Input
                placeholder="e.g. UPI482938491823"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Payment Notes</label>
              <Input
                placeholder="e.g. Received full final settlement"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={processingPayment} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                {processingPayment ? "Recording..." : "Confirm & Generate Receipt"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog open={!!uploadDocId} onOpenChange={() => setUploadDocId(null)}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Upload Citizen Document</DialogTitle>
          </DialogHeader>
          <div className="my-2">
            <FileUploadDropzone onUploadSuccess={handleDocumentUploaded} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Document Modal */}
      <Dialog open={!!rejectDocId} onOpenChange={() => setRejectDocId(null)}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Reject Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRejectDocument} className="space-y-3 my-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Rejection Reason *</label>
              <Input
                required
                placeholder="e.g. Scan is unclear, photo is cut, or signature missing"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setRejectDocId(null)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="destructive" className="h-8 text-xs">
                Confirm Rejection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Tracking Number Dialog */}
      <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Tracking / Reference Number</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTracking} className="space-y-3 my-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Tracking / Reference Number</label>
              <Input
                autoFocus
                placeholder="e.g. ABCDE123456 (optional)"
                value={trackingValue}
                onChange={(e) => setTrackingValue(e.target.value)}
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400">
                May be left blank if the government service does not provide a tracking number.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setTrackingOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={savingTracking} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                {savingTracking ? "Saving..." : "Save Tracking Number"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dates Dialog */}
      <Dialog open={datesOpen} onOpenChange={setDatesOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Edit Service Dates</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDates} className="space-y-3 my-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Documents Received Date</label>
              <Input
                type="date"
                value={datesForm.documentsReceivedDate}
                onChange={(e) => setDatesForm({ ...datesForm, documentsReceivedDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Applied Date</label>
              <Input
                type="date"
                value={datesForm.appliedDate}
                onChange={(e) => setDatesForm({ ...datesForm, appliedDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Delivery Date</label>
              <Input
                type="date"
                value={datesForm.deliveryDate}
                onChange={(e) => setDatesForm({ ...datesForm, deliveryDate: e.target.value })}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Delivery Date may stay empty until the service is completed / delivered.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDatesOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={savingDates} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                {savingDates ? "Saving..." : "Save Dates"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Service Receipt Dialog */}
      <Dialog open={receiptUploadOpen} onOpenChange={setReceiptUploadOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {serviceReceipt ? "Replace Service Receipt" : "Upload Service Receipt"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload the service receipt document for {work.service?.name}. This replaces any existing service receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2">
            <FileUploadDropzone
              onUploadSuccess={(fd) => handleUploadFile("SERVICE_RECEIPT", fd)}
              label="Upload service receipt (PDF, JPG, PNG up to 10MB)"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Certificate Dialog */}
      <Dialog open={certificateUploadOpen} onOpenChange={setCertificateUploadOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {certificate ? "Replace Certificate / Final Document" : "Upload Certificate / Final Document"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload the final certificate / document so it can be downloaded and handed to the customer later.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2">
            <FileUploadDropzone
              onUploadSuccess={(fd) => handleUploadFile("CERTIFICATE", fd)}
              label="Upload certificate (PDF, JPG, PNG up to 10MB)"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Service Receipt Confirmation */}
      <Dialog open={receiptDeleteOpen} onOpenChange={setReceiptDeleteOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Remove Service Receipt</DialogTitle>
          </DialogHeader>
          <div className="my-2 text-xs text-slate-600 space-y-3">
            <p>Are you sure you want to remove this service receipt?</p>
            {serviceReceipt && <p className="text-slate-500 font-mono">File: {serviceReceipt.fileName}</p>}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setReceiptDeleteOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={docBusy} onClick={() => handleDeleteFile("SERVICE_RECEIPT")} className="h-8 text-xs">
              {docBusy ? "Removing..." : "Remove Service Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Certificate Confirmation */}
      <Dialog open={certificateDeleteOpen} onOpenChange={setCertificateDeleteOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Remove Certificate</DialogTitle>
          </DialogHeader>
          <div className="my-2 text-xs text-slate-600 space-y-3">
            <p>Are you sure you want to remove this certificate / final document?</p>
            {certificate && <p className="text-slate-500 font-mono">File: {certificate.fileName}</p>}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setCertificateDeleteOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={docBusy} onClick={() => handleDeleteFile("CERTIFICATE")} className="h-8 text-xs">
              {docBusy ? "Removing..." : "Remove Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
