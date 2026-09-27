"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Mail, Phone, ShieldCheck, Edit, Users, Trash2 } from "lucide-react";
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Permissions dialog state
  const [permTarget, setPermTarget] = useState<any>(null);

  // Add/Edit Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "EMPLOYEE",
    password: "",
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data || []);
      }
    } catch (e) {
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleOpenCreate = useCallback(() => {
    setEditingEmp(null);
    setFormData({
      name: "",
      email: "",
      mobile: "",
      role: "EMPLOYEE",
      password: "",
    });
    setOpenDialog(true);
  }, []);

  const handleOpenEdit = useCallback((emp: any) => {
    setEditingEmp(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      mobile: emp.mobile || "",
      role: emp.role,
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
      const url = editingEmp ? `/api/users/${editingEmp.id}` : "/api/employees";
      const method = editingEmp ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Operation failed");
      }

      toast.success(editingEmp ? "Employee updated" : "Employee account created!");
      setOpenDialog(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  }, [formData, editingEmp, fetchEmployees]);

  const handleToggleActive = useCallback(async (emp: any) => {
    const action = emp.isActive !== false ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} "${emp.name}"?${emp.isActive !== false ? " They will no longer be able to login." : ""}`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${emp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: emp.isActive === false }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Operation failed");
      toast.success(`Staff member ${action}d successfully`);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  }, [fetchEmployees]);

  const handleRemoveStaff = useCallback(async (emp: any) => {
    if (!confirm(`Permanently remove "${emp.name}"? This works only if no work orders, customers or expenses link to them — otherwise deactivate instead.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${emp.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Remove failed");
      toast.success("Staff member removed successfully");
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove staff member");
    }
  }, [fetchEmployees]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Office Team"
        subtitle="Your office employees (internal staff) — work allocation, agent mapping, collections. External partners live under Partner Agents."
        action={
          <Button onClick={handleOpenCreate} size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Staff Member
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <Card key={emp.id} className="border-slate-200 hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-sm">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">{emp.name}</CardTitle>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
                        Office Staff
                      </span>{" "}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          emp.isActive !== false
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-rose-700 bg-rose-50 border-rose-200"
                        }`}
                      >
                        {emp.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(emp)} className="h-7 w-7 p-0 text-slate-500">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs pt-0">
                <div className="space-y-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{emp.email}</span>
                  </div>
                  {emp.mobile && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{emp.mobile}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2" title={(emp.agentNames || []).join(", ")}>
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      My Agents ({emp.agentCount || 0})
                      {(emp.agentNames || []).length > 0 ? `: ${emp.agentNames.slice(0, 2).join(", ")}${emp.agentNames.length > 2 ? ` +${emp.agentNames.length - 2}` : ""}` : ""}
                    </span>
                  </div>
                </div>

                {/* Performance Metrics Box */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Assigned</span>
                    <span className="font-bold text-slate-800">{emp.assignedCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Completed</span>
                    <span className="font-bold text-emerald-700">{emp.completedCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Collections</span>
                    <span className="font-bold text-slate-900">{formatCurrency(emp.totalCollected)}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-100">
                  <span>Branch: {emp.branch?.name || "Main Branch"}</span>
                  <span>Joined {formatDate(emp.createdAt)}</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  <button
                    onClick={() => handleToggleActive(emp)}
                    className={`flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-md border transition-colors ${
                      emp.isActive !== false
                        ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {emp.isActive !== false ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleRemoveStaff(emp)}
                    className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
                <button
                  onClick={() => setPermTarget(emp)}
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

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingEmp ? "Edit Staff Member" : "Add Staff Operator"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 my-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Full Name *</label>
              <Input
                required
                placeholder="e.g. Tariq Siddiqui"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Email Address *</label>
              <Input
                required
                type="email"
                placeholder="operator@alhadi.local"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mobile Number</label>
              <Input
                placeholder="9823456791"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Role</label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Office Staff / Operator</SelectItem>
                  <SelectItem value="ADMIN">System Administrator (hidden from this list)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                {editingEmp ? "Reset Password (leave empty to keep current)" : "Initial Password"}
              </label>
              <Input
                type="password"
                placeholder={editingEmp ? "••••••••" : "Employee@123456"}
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
                {saving ? "Saving..." : "Save Staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Manager */}
      <PermissionManagerDialog
        userId={permTarget?.id}
        userName={permTarget?.name}
        role={permTarget?.role}
        open={!!permTarget}
        onOpenChange={(open) => { if (!open) setPermTarget(null); }}
        onSaved={fetchEmployees}
      />
    </div>
  );
}
