"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { toast } from "sonner";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function ReceiptsListPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  const fetchReceipts = async (searchQuery = search, pageNum = page) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: "15",
        ...(searchQuery ? { search: searchQuery } : {}),
      });

      const res = await fetch(`/api/receipts?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReceipts(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch (e) {
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts(search, page);
  }, [page]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchReceipts(val, 1);
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Receipt No.",
      cell: (r) => (
        <Link href={`/receipts/${r.id}`} className="font-mono font-bold text-xs text-emerald-800 hover:underline">
          {r.receiptNumber}
        </Link>
      ),
    },
    {
      header: "Customer",
      cell: (r) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{r.customer?.name}</p>
          <p className="text-[11px] text-slate-500 font-mono">{r.customer?.mobile}</p>
        </div>
      ),
    },
    {
      header: "Work / Service",
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs font-mono">{r.work?.workId}</span>
          <span className="block text-[11px] text-slate-500 truncate max-w-[160px]">
            {r.work?.service?.name}
          </span>
        </div>
      ),
    },
    {
      header: "Amount Paid",
      cell: (r) => <span className="font-bold text-xs text-emerald-700">{formatCurrency(r.paidAmount)}</span>,
    },
    {
      header: "Pending Balance",
      cell: (r) => (
        <span className={`text-xs font-semibold ${r.pendingAmount > 0 ? "text-rose-600" : "text-slate-400"}`}>
          {formatCurrency(r.pendingAmount)}
        </span>
      ),
    },
    {
      header: "Issued Date",
      cell: (r) => <span className="text-[11px] text-slate-500">{formatDateTime(r.createdAt)}</span>,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (r) => (
        <Link href={`/receipts/${r.id}`}>
          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 bg-white text-slate-800 hover:bg-slate-50">
            <Printer className="h-3 w-3 mr-1 text-slate-500" /> Print / View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Receipts"
        subtitle="Official citizen payment acknowledgements, thermal slips, and invoice records"
      />

      <DataTable
        columns={columns}
        data={receipts}
        loading={loading}
        searchPlaceholder="Search receipt number (REC-2026-...), customer name, mobile..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        onRefresh={() => fetchReceipts()}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          totalPages: pagination.totalPages,
          onPageChange: (p) => setPage(p),
        }}
        emptyTitle="No receipts issued yet"
        emptySubtitle="Receipts are generated automatically whenever a customer payment is recorded"
      />
    </div>
  );
}
