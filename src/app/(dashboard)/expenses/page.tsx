"use client";

import React, { useState, useEffect } from "react";
import { TrendingDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, ColumnDef } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentMethod } from "@/types";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  // Add Expense Dialog State
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    paymentMethod: "CASH" as PaymentMethod,
    description: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const fetchData = async () => {
    try {
      const catRes = await fetch("/api/expenses/categories");
      const catJson = await catRes.json();
      if (catJson.success) {
        setCategories(catJson.data || []);
        if (catJson.data?.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: catJson.data[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExpenses = async (searchQuery = search, pageNum = page) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: "15",
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(categoryFilter !== "ALL" ? { categoryId: categoryFilter } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });

      const res = await fetch(`/api/expenses?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data || []);
        setTotalExpenseAmount(json.summary?.totalAmount || 0);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch (e) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchExpenses(search, page);
  }, [page, categoryFilter, startDate, endDate]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchExpenses(val, 1);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.amount || !formData.description) {
      toast.error("Please fill all required expense fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          description: formData.description,
          expenseDate: new Date(formData.expenseDate),
          notes: formData.notes,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to record expense");
      }

      toast.success("Expense recorded successfully!");
      setAddOpen(false);
      setFormData({
        categoryId: categories[0]?.id || "",
        amount: "",
        paymentMethod: "CASH",
        description: "",
        expenseDate: new Date().toISOString().slice(0, 10),
        notes: "",
      });
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || "Failed to record expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete expense "${name}"?`)) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Expense deleted");
        fetchExpenses();
      } else {
        toast.error(json.error?.message || "Failed to delete");
      }
    } catch (e) {
      toast.error("Failed to delete expense");
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Expense ID",
      cell: (e) => <span className="font-mono font-bold text-xs text-slate-800">{e.expenseId}</span>,
    },
    {
      header: "Category",
      cell: (e) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {e.category?.name}
        </span>
      ),
    },
    {
      header: "Description",
      cell: (e) => (
        <div>
          <p className="font-medium text-slate-900 text-xs">{e.description}</p>
          {e.notes && <p className="text-[11px] text-slate-500">{e.notes}</p>}
        </div>
      ),
    },
    {
      header: "Amount",
      cell: (e) => <span className="font-bold text-xs text-rose-600">{formatCurrency(e.amount)}</span>,
    },
    {
      header: "Mode",
      cell: (e) => (
        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
          {e.paymentMethod}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (e) => <span className="text-[11px] text-slate-500">{formatDate(e.expenseDate)}</span>,
    },
    {
      header: "Added By",
      cell: (e) => <span className="text-[11px] text-slate-600">{e.addedByUser?.name || "Admin"}</span>,
    },
    {
      header: "Action",
      className: "text-right",
      cell: (e) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDeleteExpense(e.id, e.description)}
          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Management"
        subtitle="Track shop rent, electricity, paper supplies, toners, and operational center costs"
        action={
          <Button onClick={() => setAddOpen(true)} size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Center Expense
          </Button>
        }
      />

      {/* Summary Total Banner */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Expenses in Filtered Period</span>
            <p className="text-xl font-black text-rose-600">{formatCurrency(totalExpenseAmount)}</p>
          </div>
        </div>
      </div>

      {/* Expense DataTable */}
      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        searchPlaceholder="Search by description, expense ID, or category..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        onRefresh={() => fetchExpenses()}
        filters={
          <>
            <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
              <SelectTrigger className="h-9 w-40 text-xs bg-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
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
        emptyTitle="No expenses recorded"
        emptySubtitle="Record operational expenses to keep net profit calculations accurate"
        emptyAction={
          <Button size="sm" onClick={() => setAddOpen(true)} className="bg-emerald-600 text-white text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Expense
          </Button>
        }
      />

      {/* Add Expense Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Record Operational Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-3 my-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Expense Category *</label>
              <Select
                value={formData.categoryId}
                onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Amount (₹) *</label>
                <Input
                  required
                  type="number"
                  min={1}
                  placeholder="e.g. 1500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="h-8 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Mode *</label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(val: any) => setFormData({ ...formData, paymentMethod: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Payment Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash in Hand</SelectItem>
                    <SelectItem value="UPI">UPI Transfer</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Expense Description *</label>
              <Input
                required
                placeholder="e.g. 5 Reams of JK A4 Copier Paper"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Expense Date</label>
              <Input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes / Invoice Ref</label>
              <Input
                placeholder="Optional invoice number or vendor name"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? "Recording..." : "Record Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
