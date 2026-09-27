"use client";

import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    tagline: "",
    address: "",
    mobile: "",
    email: "",
    gstin: "",
    website: "",
    receiptPrefix: "REC",
    receiptTerms: "",
    receiptFooter: "",
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/business");
      const json = await res.json();
      if (json.success && json.data) {
        setFormData({
          businessName: json.data.businessName || "AL-HADI ENTERPRISE",
          tagline: json.data.tagline || "CSC & Citizen Service Center",
          address: json.data.address || "",
          mobile: json.data.mobile || "",
          email: json.data.email || "",
          gstin: json.data.gstin || "",
          website: json.data.website || "",
          receiptPrefix: json.data.receiptPrefix || "REC",
          receiptTerms: json.data.receiptTerms || "",
          receiptFooter: json.data.receiptFooter || "",
        });
      }
    } catch (e) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to save settings");
      }

      toast.success("Business settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Center & Business Configuration"
        subtitle="Manage official enterprise branding, contact details, GSTIN, and receipt footer policies"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Identity & Contact */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800">Business Identity & Contact Details</CardTitle>
            <CardDescription className="text-xs">This information appears on invoices, receipts, and customer headers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Business / Center Name *</label>
                <Input
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Tagline / Subtitle</label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Center Helpline Mobile *</label>
                <Input
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Official Email *</label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">GSTIN Number</label>
                <Input
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Website URL</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Full Business Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Receipt & Invoicing Policy */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800">Receipt & Billing Policy</CardTitle>
            <CardDescription className="text-xs">Customize prefix, terms, and footer printed on payment receipts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5 max-w-xs">
              <label className="font-semibold text-slate-700">Receipt Number Prefix</label>
              <Input
                value={formData.receiptPrefix}
                onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value })}
                className="h-9 text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400">e.g. REC generates REC-2026-00001</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Receipt Terms & Conditions</label>
              <textarea
                rows={3}
                value={formData.receiptTerms}
                onChange={(e) => setFormData({ ...formData, receiptTerms: e.target.value })}
                className="w-full rounded-md border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Receipt Footer Text</label>
              <Input
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button type="submit" disabled={saving} className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 shadow-sm">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving..." : "Save Business Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
