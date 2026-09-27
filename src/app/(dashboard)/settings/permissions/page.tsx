"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PermissionManagerDialog from "@/components/common/PermissionManagerDialog";

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  EMPLOYEE: "bg-blue-50 text-blue-700 border-blue-200",
  AGENT: "bg-amber-50 text-amber-700 border-amber-200",
};

interface PermissionUser {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  role: string;
  isActive: boolean;
  businessName: string | null;
  createdAt: string;
  permissions: string[];
}

export default function PermissionManagementPage() {
  const [users, setUsers] = useState<PermissionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Permission dialog state
  const [permTarget, setPermTarget] = useState<PermissionUser | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
      } else {
        toast.error(json.error?.message || "Failed to load users");
      }
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Management"
        subtitle="Manage user access and permissions."
      />

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-900">
                Users &amp; Access Control
              </CardTitle>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {users.length} users
              </span>
            </div>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Select a user to grant or revoke module permissions. Admin accounts always have full access.
          </CardDescription>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="AGENT">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-md" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No users found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] uppercase text-slate-400">Name</TableHead>
                  <TableHead className="text-[11px] uppercase text-slate-400">Email</TableHead>
                  <TableHead className="text-[11px] uppercase text-slate-400">Role</TableHead>
                  <TableHead className="text-[11px] uppercase text-slate-400">Status</TableHead>
                  <TableHead className="text-[11px] uppercase text-slate-400">Permissions</TableHead>
                  <TableHead className="text-[11px] uppercase text-slate-400 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50">
                    <TableCell className="text-xs font-semibold text-slate-800">
                      {u.name}
                      {u.businessName ? (
                        <span className="block text-[10px] font-normal text-slate-400">{u.businessName}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{u.email}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        ROLE_STYLES[u.role] || "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                      )}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {u.role === "ADMIN" ? (
                        <span className="font-semibold text-slate-800">Full Access</span>
                      ) : (
                        <span>{u.permissions.length} Permissions</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPermTarget(u)}
                        className="h-7 text-xs text-slate-700"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manage Permissions Dialog */}
      <PermissionManagerDialog
        userId={permTarget?.id}
        userName={permTarget?.businessName || permTarget?.name}
        role={permTarget?.role}
        open={!!permTarget}
        onOpenChange={(open) => { if (!open) setPermTarget(null); }}
        onSaved={fetchUsers}
      />
    </div>
  );
}