"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReceiptPrintView } from "@/components/common/ReceiptPrintView";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ReceiptDetailPage() {
  const params = useParams();
  const receiptId = params.id as string;

  const [receipt, setReceipt] = useState<any>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/receipts/${receiptId}`);
        const json = await res.json();

        const sRes = await fetch("/api/settings/business");
        const sJson = await sRes.json();

        if (json.success) {
          setReceipt(json.data);
        } else {
          toast.error("Receipt not found");
        }

        if (sJson.success) {
          setBusinessSettings(sJson.data);
        }
      } catch (e) {
        toast.error("Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    if (receiptId) {
      fetchReceipt();
    }
  }, [receiptId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
        <p className="font-bold text-slate-800">Receipt not found</p>
        <Link href="/receipts" className="mt-4 inline-block text-emerald-600 font-semibold text-xs">
          ← Back to Receipts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="no-print">
        <Link href="/receipts" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Receipts
        </Link>
      </div>

      <ReceiptPrintView receipt={receipt} businessSettings={businessSettings} />
    </div>
  );
}
