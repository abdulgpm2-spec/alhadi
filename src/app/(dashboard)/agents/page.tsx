"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Mail, Phone, Users, Edit, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import PermissionManagerDialog from "@/components/common/PermissionManagerDialog";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Permissions dialog state
  const [permTarget, setPermTarget] = useState<any>(null);

  // Add / Edit Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    mobile: "",
    supervisorId: "",
    password: "",
  });

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/agents");
      const json = await res.json();
      if (json.success) {
        setAgents(json.data || []);
      }
    } catch (e) {
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    fetch("/api/employees")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          const list = j.data || [];
          setEmployees(list.filter((u: any) => u.role === "EMPLOYEE" && u.isActive !== false));
        }
      })
      .catch(() => {});
  }, [fetchAgents]);

  const handleOpenCreate = useCallback(() => {
    setEditingAgent(null);
    setFormData({
      name: "",
      businessName: "",
      email: "",
      mobile: "",
      supervisorId: "",
      password: "",
    });
    setOpenDialog(true);
  }, []);

  const handleOpenEdit = useCallback((ag: any) => {
    setEditingAgent(ag);
    setFormData({
      name: ag.name,
      businessName: ag.businessName,
      email: ag.email,
      mobile: ag.mobile || "",
      supervisorId: ag.supervisorId || "",
      password: "",
    });
    setOpenDialog(true);
  }, []);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }

    setSaving(true);
    try {
      const url = editingAgent ? `/api/users/${editingAgent.id}` : "/api/agents";
      const method = editingAgent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Operation failed");
      }

      toast.success(editingAgent ? "Agent updated" : "Agent account created!");
      setOpenDialog(false);
      fetchAgents();
    } catch (err: any) {
      toast.error(err.message || "Failed to save agent");
    } finally {
      setSaving(false);
    }
  }, [formData, editingAgent, fetchAgents]);

  const handleToggleActive = useCallback(async (ag: any) => {
    const action = ag.isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} agent "${ag.businessName || ag.name}"?${ag.isActive ? " They will no longer be able to login." : ""}`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${ag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ag.isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Operation failed");
      toast.success(`Agent ${action}d successfully`);
      fetchAgents();
    } catch (err: any) {
      toast.error(err.message || "Failed to update agent status");
    }
  }, [fetchAgents]);

  const handleRemoveAgent = useCallback(async (ag: any) => {
    if (!confirm(`Permanently remove agent "${ag.businessName || ag.name}"? This works only if no work orders, customers or expenses link to them — otherwise deactivate instead.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${ag.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Remove failed");
      toast.success("Agent removed successfully");
      fetchAgents();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove agent");
    }
  }, [fetchAgents]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Agents"
        subtitle="External referral agents and their shops — NOT office staff. Map each agent to an employee (Reports To) so their customers and work stay linked."
        action={
          <Button onClick={handleOpenCreate} size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> Register Partner Agent
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((ag) => (
            <Card key={ag.id} className="border-slate-200 hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      Partner Agent
                    </span>{" "}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        ag.isActive !== false
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}
                    >
                      {ag.isActive !== false ? "Active" : "Inactive"}
                    </span>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">{ag.businessName}</CardTitle>
                    <p className="text-xs text-slate-500 font-medium">Owner: {ag.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Users className="h-3 w-3 text-slate-400" />
                      Reports to:{" "}
                      <span className="font-semibold text-slate-700">{ag.supervisorName || "— Unassigned —"}</span>
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(ag)} className="h-7 w-7 p-0 text-slate-500">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs pt-0">
                <div className="space-y-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{ag.email}</span>
                  </div>
                  {ag.mobile && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{ag.mobile}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Box */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Customers</span>
                    <span className="font-bold text-slate-800">{ag.customerCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Total Orders</span>
                    <span className="font-bold text-slate-800">{ag.workCount}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-100">
                  <span>Revenue: {formatCurrency(ag.totalRevenue)}</span>
                  <span>Registered {formatDate(ag.createdAt)}</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  <button
                    onClick={() => handleToggleActive(ag)}
                    className={`flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-md border transition-colors ${
                      ag.isActive !== false
                        ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {ag.isActive !== false ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleRemoveAgent(ag)}
                    className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
                <button
                  onClick={() => setPermTarget(ag)}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Manage Permissions
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Agent Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingAgent ? "Edit Agent Partner" : "Register Partner Agent"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 my-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Business / Center Name *</label>
              <Input
                required
                placeholder="e.g. Al-Barakah Digital Point"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Agent Contact Person Name *</label>
              <Input
                required
                placeholder="e.g. Irfan Merchant"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Address *</label>
                <Input
                  required
                  type="email"
                  placeholder="agent@alhadi.local"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mobile Number</label>
                <Input
                  placeholder="9823456793"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                {editingAgent ? "Reset Password (leave empty to keep current)" : "Initial Password"}
              </label>
              <Select
                value={formData.supervisorId || "NONE"}
                onValueChange={(val) => setFormData({ ...formData, supervisorId: val === "NONE" ? "" : val })}
              >
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="Select supervising employee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— No supervisor —</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                {editingAgent ? "Reset Password (leave empty to keep current)" : "Initial Password"}
              </label>
              <Input
                type="password"
                placeholder={editingAgent ? "••••••••" : "Agent@123456"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? "Saving..." : "Save Agent"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Manager */}
      <PermissionManagerDialog
        userId={permTarget?.id}
        userName={permTarget?.businessName || permTarget?.name}
        role={permTarget?.role}
        open={!!permTarget}
        onOpenChange={(open) => { if (!open) setPermTarget(null); }}
        onSaved={fetchAgents}
      />
    </div>
  );
}
