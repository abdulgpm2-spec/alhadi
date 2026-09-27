"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PERMISSION_GROUPS, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_EMPLOYEE_PERMISSIONS, DEFAULT_AGENT_PERMISSIONS } from "@/lib/constants";
import { toast } from "sonner";

type Props = {
  userId?: string;
  userName?: string;
  role?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export default function PermissionManagerDialog({ userId, userName, role, open, onOpenChange, onSaved }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPermissions = async () => {
    if (!open || !userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/permissions`);
      const json = await res.json();
      if (json.success) {
        setSelected(json.data?.permissions || []);
      } else {
        toast.error(json.error?.message || "Failed to load permissions");
      }
    } catch (e) {
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const allKeys = DEFAULT_ADMIN_PERMISSIONS as string[];
  const isAdminTarget = role === "ADMIN";

  const toggle = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const groupAllChecked = (groupKeys: string[]) =>
    groupKeys.length > 0 && groupKeys.every((k) => selected.includes(k));

  const toggleGroup = (groupKeys: string[]) => {
    setSelected((prev) => {
      const set = new Set(prev);
      if (groupKeys.every((k) => set.has(k))) {
        groupKeys.forEach((k) => set.delete(k));
      } else {
        groupKeys.forEach((k) => set.add(k));
      }
      return Array.from(set);
    });
  };

  const applyPreset = (permKeys: string[]) => {
    setSelected(Array.from(new Set(permKeys)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selected }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to save permissions");
      toast.success("Permissions updated");
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-5 bg-white max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Manage Permissions: <span className="text-slate-700">{userName}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{role}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 py-3 text-xs">
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelected([])}>
            None
          </Button>
          {role === "AGENT" ? (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => applyPreset(DEFAULT_AGENT_PERMISSIONS as string[])}>
              Default Agent Role
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => applyPreset(DEFAULT_EMPLOYEE_PERMISSIONS as string[])}>
              Default Employee Role
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => applyPreset(allKeys)}>
            Grant All (Full Rights)
          </Button>
        </div>

        {isAdminTarget && (
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
            This is a System Administrator account. Administrators automatically bypass permission checks and always have full
            rights. The toggles below are informational for non-admin staff only.
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-500 py-6 text-center">Loading permissions...</div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {PERMISSION_GROUPS.map((group) => {
              const groupKeys = group.items.map((i) => i.key);
              return (
                <div key={group.group} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">{group.group}</span>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={groupAllChecked(groupKeys)}
                        onChange={() => toggleGroup(groupKeys)}
                        className="h-3.5 w-3.5"
                      />
                      Select group
                    </label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-1.5">
                    {group.items.map((item) => (
                      <label key={item.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none rounded px-1.5 py-1 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selected.includes(item.key)}
                          onChange={() => toggle(item.key)}
                          className="h-3.5 w-3.5 accent-emerald-600"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 mt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{selected.length} of {allKeys.length} permissions granted</span>
        </div>

        <DialogFooter className="pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}