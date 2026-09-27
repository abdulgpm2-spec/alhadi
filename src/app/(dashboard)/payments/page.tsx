"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, Receipt, Plus, Search, Calendar, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, ColumnDef } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PaymentStatusBadge } from "@/components/common/StatusBadge";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { toast } from "sonner";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  const fetchPayments = async (searchQuery = search, pageNum = page) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: "15",
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(methodFilter !== "ALL" ? { paymentMethod: methodFilter } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });

      const res = await fetch(`/api/payments?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch (e) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(search, page);
  }, [page, methodFilter, startDate, endDate]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchPayments(val, 1);
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Payment ID",
      cell: (p) => <span className="font-mono font-bold text-xs text-slate-900">{p.paymentId}</span>,
    },
    {
      header: "Customer",
      cell: (p) => (
        <div>
          <Link href={`/customers/${p.customer?.id}`} className="font-semibold text-slate-900 text-xs hover:underline">
            {p.customer?.name}
          </Link>
          <p className="text-[11px] text-slate-500 font-mono">{p.customer?.mobile}</p>
        </div>
      ),
    },
    {
      header: "Work Order",
      cell: (p) => (
        <div>
          <Link href={`/work/${p.work?.id}`} className="font-mono font-bold text-xs text-emerald-800 hover:underline">
            {p.work?.workId}
          </Link>
          <span className="block text-[11px] text-slate-500 truncate max-w-[150px]">
            {p.work?.service?.name}
          </span>
        </div>
      ),
    },
    {
      header: "Amount",
      cell: (p) => <span className="font-bold text-xs text-emerald-700">{formatCurrency(p.amount)}</span>,
    },
    {
      header: "Payment Mode",
      cell: (p) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
          {p.paymentMethod}
        </span>
      ),
    },
    {
      header: "Txn ID",
      cell: (p) => <span className="text-[11px] font-mono text-slate-500">{p.transactionId || "-"}</span>,
    },
    {
      header: "Date & Time",
      cell: (p) => <span className="text-[11px] text-slate-500">{formatDateTime(p.createdAt)}</span>,
    },
    {
      header: "Receipt",
      className: "text-right",
      cell: (p) => (
        p.receipt ? (
          <Link href={`/receipts/${p.receipt.id}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50">
              <Receipt className="h-3 w-3 mr-1 text-emerald-600" /> Receipt
            </Button>
          </Link>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Collections"
        subtitle="Manage financial transactions, payment modes, collections, and issued receipts"
      />

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        searchPlaceholder="Search by Payment ID, customer, transaction ID, or work ID..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        onRefresh={() => fetchPayments()}
        filters={
          <>
            <Select value={methodFilter} onValueChange={(val) => { setMethodFilter(val); setPage(1); }}>
              <SelectTrigger className="h-9 w-36 text-xs bg-white">
                <SelectValue placeholder="All Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Modes</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(d) => { setStartDate(d); setPage(1); }}
              onEndDateChange={(d) => { setEndDate(d); setPage(1); }}
            />
          </>
        }
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          totalPages: pagination.totalPages,
          onPageChange: (p) => setPage(p),
        }}
        emptyTitle="No payments recorded"
        emptySubtitle="Payments recorded for work orders will appear here"
      />
    </div>
  );
}
