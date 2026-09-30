"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CreditCard,
  Receipt,
  Activity,
  Plus,
  MessageCircle,
  Edit,
  Trash2,
  ArrowLeft,
  Eye,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileUploadDropzone } from "@/components/common/FileUploadDropzone";
import { WorkStatusBadge, PaymentStatusBadge, DocumentStateBadge } from "@/components/common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PERMISSIONS } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [me, setMe] = useState<any>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${customerId}`);
      const json = await res.json();
      if (json.success) {
        setCustomer(json.data);
        setFormData({
          name: json.data.name || "",
          mobile: json.data.mobile || "",
          alternateMobile: json.data.alternateMobile || "",
          email: json.data.email || "",
          gender: json.data.gender || "Male",
          dob: json.data.dob ? new Date(json.data.dob).toISOString().slice(0, 10) : "",
          address: json.data.address || "",
          area: json.data.area || "",
          city: json.data.city || "",
          state: json.data.state || "",
          pincode: json.data.pincode || "",
          notes: json.data.notes || "",
        });
      } else {
        toast.error("Customer not found");
      }
    } catch (e) {
      toast.error("Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
      fetchMe();
    }
  }, [customerId, fetchCustomer]);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.success) setMe(json.data?.user || null);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const hasPermission = useCallback(
    (perm: string) => me?.role === "ADMIN" || (me?.permissions || []).includes(perm),
    [me]
  );

  const canManagePhoto =
    (me?.role === "EMPLOYEE" || me?.role === "AGENT") && hasPermission(PERMISSIONS.CUSTOMERS_UPDATE);

  // Agents view profiles but never edit them or spawn direct work orders
  // (their only entry point is Services → Apply).
  const canEditProfile = hasPermission(PERMISSIONS.CUSTOMERS_UPDATE);

  const handlePhotoAttach = useCallback(async (fileData: any) => {
    setPhotoBusy(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: fileData.key,
          url: fileData.url,
          fileName: fileData.fileName,
          fileSize: Number(fileData.fileSize) || 0,
          mimeType: fileData.mimeType,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to set photo");
      toast.success("Profile photo updated");
      setPhotoOpen(false);
      setPhotoBusy(false);
      fetchCustomer();
    } catch (e: any) {
      setPhotoBusy(false);
      toast.error(e.message || "Failed to set profile photo");
    }
  }, [customerId, fetchCustomer]);

  const handlePhotoRemove = useCallback(async () => {
    if (!confirm("Remove this customer's profile photo?")) return;
    setPhotoBusy(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/photo`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to remove photo");
      toast.success("Profile photo removed");
      setPhotoOpen(false);
      setPhotoBusy(false);
      fetchCustomer();
    } catch (e: any) {
      setPhotoBusy(false);
      toast.error(e.message || "Failed to remove profile photo");
    }
  }, [customer, customerId, fetchCustomer]);

  const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setEditing(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to update customer");
      }

      toast.success("Customer profile updated successfully");
      setEditOpen(false);
      fetchCustomer();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setEditing(false);
    }
  }, [customerId, formData, fetchCustomer]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete customer ${customer.name}?`)) return;
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Customer soft-deleted successfully");
        router.push("/customers");
      } else {
        toast.error(json.error?.message || "Delete failed");
      }
    } catch (e) {
      toast.error("Failed to delete customer");
    }
  }, [customer, customerId, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
        <p className="font-bold text-slate-800">Customer not found</p>
        <Link href="/customers" className="mt-4 inline-block text-emerald-600 font-semibold text-xs">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  // Calculate Aggregates
  const totalBilled = (customer.works || []).reduce((acc: number, w: any) => acc + w.totalAmount, 0);
  const totalPaid = (customer.payments || []).reduce((acc: number, p: any) => acc + p.amount, 0);
  const totalPending = Math.max(0, totalBilled - totalPaid);
  const totalProfit = (customer.works || []).reduce(
    (acc: number, w: any) => acc + ((Number(w.totalAmount) || 0) - (Number(w.serviceCost) || 0)),
    0
  );

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
      </Link>

      {/* Customer Header Card */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              {customer.fileAssets && customer.fileAssets.length > 0 ? (
                <img
                  src={`/uploads/${customer.fileAssets[0].storageKey}`}
                  alt={`${customer.name} profile photo`}
                  className="h-14 w-14 rounded-full object-cover border-2 border-white bg-slate-100 shrink-0 shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-black text-xl border-2 border-white shadow-sm shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
              )}
              {canManagePhoto && (
                <button
                  type="button"
                  onClick={() => setPhotoOpen(true)}
                  className="absolute -bottom-1 -right-1 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-emerald-600 text-white border-2 border-white shadow-sm hover:bg-emerald-700 transition-colors"
                  title="Change profile photo"
                >
                  <Camera className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {customer.customerId}
                </span>
                {customer.agent && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                    Referred by {customer.agent.name}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {customer.mobile}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {customer.email}
                  </span>
                )}
                {customer.area && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {customer.area}, {customer.city}
                  </span>
                )}
                <span className="text-slate-400">Joined {formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://wa.me/91${customer.mobile}?text=${encodeURIComponent(
                `Hello ${customer.name}, greetings from AL-HADI ENTERPRISE.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 bg-white"
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" /> WhatsApp
              </Button>
            </a>
            {canEditProfile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="h-8 text-xs bg-white text-slate-700"
              >
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            )}
            {me?.role !== "AGENT" && (
              <Link href={`/work/new?customerId=${customer.id}`}>
                <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Work
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Financial Summary Bar (profit hidden from agents) */}
        <div className={`grid grid-cols-2 ${me?.role === "AGENT" ? "sm:grid-cols-3" : "sm:grid-cols-4"} gap-3 mt-6 pt-5 border-t border-slate-100 text-center`}>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Work Orders</span>
            <span className="text-base font-bold text-slate-900">{customer.works?.length || 0}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-700 block">Total Paid</span>
            <span className="text-base font-bold text-emerald-800">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100">
            <span className="text-[11px] font-medium text-rose-700 block">Pending Outstanding</span>
            <span className="text-base font-bold text-rose-800">{formatCurrency(totalPending)}</span>
          </div>
          {me?.role !== "AGENT" && (
            <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-100" title="Billed minus service cost across all orders">
              <span className="text-[11px] font-medium text-sky-700 block">Profit / Loss</span>
              <span className={`text-base font-bold ${totalProfit >= 0 ? "text-sky-800" : "text-rose-800"}`}>
                {formatCurrency(totalProfit)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Container */}
      <Tabs defaultValue="works" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg w-full sm:w-auto flex flex-wrap justify-start">
          <TabsTrigger value="works" className="text-xs font-semibold flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> Work Orders ({customer.works?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs font-semibold flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> Personal Profile
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs font-semibold flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Payments & Receipts ({customer.payments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs font-semibold flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Activity Timeline
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Work Orders */}
        <TabsContent value="works" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Customer Work Orders</CardTitle>
                <CardDescription className="text-xs">All CSC applications requested by this customer</CardDescription>
              </div>
              <Link href={`/work/new?customerId=${customer.id}`}>
                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-3 w-3 mr-1" /> New Application
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {!customer.works || customer.works.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No work orders recorded yet</div>
                ) : (
                  customer.works.map((w: any) => (
                    <div
                      key={w.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/work/${w.id}`}
                            className="font-mono font-bold text-xs text-emerald-800 hover:underline"
                          >
                            {w.workId}
                          </Link>
                          <WorkStatusBadge status={w.status} />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{w.service?.name}</span>
                          {w.service?.serviceId && (
                            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {w.service.serviceId}
                            </span>
                          )}
                          {w.service?.category?.name && (
                            <span className="text-[10px] text-slate-500">
                              • {w.service.category.name}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Due: {formatDate(w.dueDate)} • Assigned: {w.assignedUser?.name || "Unassigned"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">{formatCurrency(w.totalAmount)}</span>
                          <p className="text-[11px] text-slate-500">
                            Paid: {formatCurrency(w.paidAmount)} | Pending:{" "}
                            <span className="font-bold text-rose-600">{formatCurrency(w.pendingAmount)}</span>
                          </p>
                        </div>
                        <Link href={`/work/${w.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 bg-white">
                            View <Eye className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Overview / Personal Info */}
        <TabsContent value="overview" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">Customer Identity & Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{customer.name}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">Primary Mobile</span>
                  <span className="font-bold text-slate-900 font-mono">{customer.mobile}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">Alternate Mobile</span>
                  <span className="font-medium text-slate-700 font-mono">{customer.alternateMobile || "-"}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">Email</span>
                  <span className="font-medium text-slate-700">{customer.email || "-"}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">Gender / DOB</span>
                  <span className="font-medium text-slate-700">
                    {customer.gender || "Male"} • {formatDate(customer.dob)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">Branch</span>
                  <span className="font-medium text-slate-700">{customer.branch?.name}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-medium">Address</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {customer.address || `${customer.area || ""}, ${customer.city}, ${customer.state}`}
                </p>
              </div>

              {customer.notes && (
                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                  <span className="text-[11px] text-amber-800 block font-medium">Special Notes</span>
                  <p className="text-slate-700 mt-0.5">{customer.notes}</p>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button size="sm" variant="destructive" onClick={handleDelete} className="h-8 text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Customer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Payments & Receipts */}
        <TabsContent value="payments" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">Financial History</CardTitle>
              <CardDescription className="text-xs">All payments recorded and receipts generated</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {!customer.payments || customer.payments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No payment transactions recorded</div>
                ) : (
                  customer.payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{p.paymentId}</span>
                          <PaymentStatusBadge status={p.status} />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">
                          {p.work?.service?.name} (Work: {p.work?.workId})
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Method: {p.paymentMethod} • {formatDateTime(p.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-700">{formatCurrency(p.amount)}</span>
                        </div>
                        {p.receipt && (
                          <Link href={`/receipts/${p.receipt.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-white">
                              <Receipt className="h-3 w-3 mr-1 text-emerald-600" /> Receipt
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
        </TabsContent>

        {/* Tab 5: Activity Log */}
        <TabsContent value="activity" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">Customer Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {!customer.activityLogs || customer.activityLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No audit logs</div>
                ) : (
                  customer.activityLogs.map((log: any) => (
                    <div key={log.id} className="p-3.5 text-xs flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">By {log.user?.name || "System"}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Edit Customer Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-3 my-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mobile</label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Alternate Mobile</label>
                <Input
                  value={formData.alternateMobile}
                  onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Area</label>
                <Input
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Full Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editing}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {editing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
