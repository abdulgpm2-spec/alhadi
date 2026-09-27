"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile Form
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  // Password Form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.success && json.data?.user) {
        setUser(json.data.user);
        setName(json.data.user.name || "");
        setMobile(json.data.user.mobile || "");
      }
    } catch (e) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to update profile");
      }

      toast.success("Profile details updated successfully!");
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="User Profile & Security"
        subtitle="Manage your personal staff identity, security credentials, and view active role permissions"
      />

      {/* Profile Info */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-800">Personal Details</CardTitle>
          <CardDescription className="text-xs">Update your name and primary contact mobile number</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Full Name</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Contact Mobile</label>
                <Input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Email Address (Read-only)</label>
                <Input
                  disabled
                  value={user?.email || ""}
                  className="h-9 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Assigned Role</label>
                <Input
                  disabled
                  value={user?.role || ""}
                  className="h-9 text-xs bg-slate-50 text-slate-500 font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={savingProfile} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {savingProfile ? "Saving..." : "Save Details"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-800">Change Password</CardTitle>
          <CardDescription className="text-xs">Update your secure login password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">New Password *</label>
                <Input
                  required
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Confirm New Password *</label>
                <Input
                  required
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={savingPassword} className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                {savingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Permissions Transparency View */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-800">Active Permissions & Access Scope</CardTitle>
          <CardDescription className="text-xs">Role capabilities granted to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {(user?.permissions || []).map((p: string) => (
              <span key={p} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {p}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
