"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Users,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { StatCard } from "@/components/common/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("financial");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (tab = activeTab) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });

      let endpoint = "/api/reports/financial";
      if (tab === "work") endpoint = "/api/reports/work";
      if (tab === "customers") endpoint = "/api/reports/customers";

      const res = await fetch(`${endpoint}?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch (e) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, startDate, endDate]);

  const handleExportCSV = () => {
    if (!reportData) return;

    let headers: string[] = [];
    let rows: any[] = [];
    let filename = `AlHadi_${activeTab}_report.csv`;

    if (activeTab === "financial") {
      headers = ["Type", "ID", "Party / Desc", "Payment Mode", "Amount", "Date"];
      (reportData.payments || []).forEach((p: any) => {
        rows.push(["Income", p.paymentId, `"${p.customerName} (${p.serviceName})"`, p.paymentMethod, p.amount, formatDate(p.date)]);
      });
      (reportData.expenses || []).forEach((e: any) => {
        rows.push(["Expense", e.expenseId, `"${e.description} (${e.category})"`, e.paymentMethod, -e.amount, formatDate(e.date)]);
      });
    } else if (activeTab === "work") {
      headers = ["Work ID", "Customer", "Service", "Status", "Total Amount", "Paid", "Pending", "Due Date"];
      (reportData.rows || []).forEach((w: any) => {
        rows.push([w.workId, `"${w.customerName}"`, `"${w.serviceName}"`, w.status, w.totalAmount, w.paidAmount, w.pendingAmount, formatDate(w.dueDate)]);
      });
    } else if (activeTab === "customers") {
      headers = ["Customer ID", "Name", "Mobile", "Area", "Orders Count", "Total Spent", "Joined"];
      (reportData.rows || []).forEach((c: any) => {
        rows.push([c.customerId, `"${c.name}"`, c.mobile, `"${c.area}"`, c.workCount, c.totalSpent, formatDate(c.createdAt)]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report downloaded as CSV");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Financial Intelligence"
        subtitle="Business performance, profit & loss analysis, work volumes, and customer retention"
        action={
          <Button size="sm" variant="outline" onClick={handleExportCSV} className="h-8 text-xs bg-white text-slate-700">
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Export CSV Report
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Reporting Range:</span>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="h-8 text-xs text-slate-500 hover:text-slate-900"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Multi-Dimensional Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="financial" className="text-xs font-semibold flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Profit & Loss / Financials
          </TabsTrigger>
          <TabsTrigger value="work" className="text-xs font-semibold flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> Work & Applications
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Customer Intelligence
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Financial P&L Report */}
        <TabsContent value="financial" className="mt-4 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Income Collected"
                  value={reportData?.summary?.totalIncome || 0}
                  isCurrency
                  subtitle={`${reportData?.summary?.incomeTransactions || 0} receipts issued`}
                  icon={TrendingUp}
                  variant="emerald"
                />
                <StatCard
                  title="Total Operational Expenses"
                  value={reportData?.summary?.totalExpense || 0}
                  isCurrency
                  subtitle={`${reportData?.summary?.expenseTransactions || 0} expenses recorded`}
                  icon={TrendingDown}
                  variant="rose"
                />
                <StatCard
                  title="Net Operational Profit"
                  value={reportData?.summary?.netProfit || 0}
                  isCurrency
                  subtitle="Total Income minus Total Expenses"
                  icon={BarChart3}
                  variant={(reportData?.summary?.netProfit || 0) >= 0 ? "emerald" : "rose"}
                />
                <StatCard
                  title="Service Profit (billed − cost)"
                  value={reportData?.summary?.totalServiceProfit || 0}
                  isCurrency
                  subtitle="Unit economics across services"
                  icon={FileSpreadsheet}
                  variant={(reportData?.summary?.totalServiceProfit || 0) >= 0 ? "emerald" : "rose"}
                />
              </div>

              {/* Profit by Service */}
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Profit by Service (billed − govt fee − other cost)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {(reportData?.profitByService || []).length === 0 && (
                      <p className="p-4 text-[11px] text-slate-400 italic">No billed work in this period.</p>
                    )}
                    {(reportData?.profitByService || []).map((r: any) => (
                      <div key={r.serviceId} className="p-3 flex justify-between items-center hover:bg-slate-50 gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{r.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {r.category} • {r.orders} order(s) • billed {formatCurrency(r.billed)} • cost {formatCurrency(r.cost)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-bold ${r.profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                            {formatCurrency(r.profit)}
                          </span>
                          <span className="block text-[10px] text-slate-400">profit</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Transactions Breakdown Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Payments */}
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Income Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {(reportData?.payments || []).map((p: any) => (
                        <div key={p.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <p className="font-semibold text-slate-900">{p.customerName}</p>
                            <p className="text-[11px] text-slate-500">{p.serviceName} • {p.paymentMethod}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-700">{formatCurrency(p.amount)}</span>
                            <span className="block text-[10px] text-slate-400">{formatDate(p.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Expenses */}
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Expense Outflows</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {(reportData?.expenses || []).map((e: any) => (
                        <div key={e.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <p className="font-semibold text-slate-900">{e.description}</p>
                            <p className="text-[11px] text-slate-500">{e.category} • {e.paymentMethod}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-rose-600">{formatCurrency(e.amount)}</span>
                            <span className="block text-[10px] text-slate-400">{formatDate(e.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 2: Work & Applications Report */}
        <TabsContent value="work" className="mt-4 space-y-6">
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Total Orders</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{reportData?.summary?.totalWorks || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Completion Rate</span>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{reportData?.summary?.completionRate || 0}%</p>
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Total Billed</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(reportData?.summary?.totalBilled || 0)}</p>
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Outstanding Balance</span>
                  <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(reportData?.summary?.totalOutstanding || 0)}</p>
                </div>
              </div>

              {/* Work Report Table */}
              <Card className="border-slate-200">
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {(reportData?.rows || []).map((w: any) => (
                      <div key={w.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-800">{w.workId}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold">{w.status}</span>
                          </div>
                          <p className="font-semibold text-slate-800 mt-0.5">{w.serviceName} ({w.customerName})</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{formatCurrency(w.totalAmount)}</span>
                          <span className="block text-[10px] text-slate-400">Due: {formatDate(w.dueDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tab 3: Customer Intelligence */}
        <TabsContent value="customers" className="mt-4 space-y-6">
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Total Registered</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{reportData?.summary?.totalCustomers || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">New Customers</span>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{reportData?.summary?.newCustomers || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Returning Customers</span>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{reportData?.summary?.returningCustomers || 0}</p>
                </div>
              </div>

              {/* Customer List */}
              <Card className="border-slate-200">
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {(reportData?.rows || []).map((c: any) => (
                      <div key={c.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-900">{c.name} ({c.customerId})</p>
                          <p className="text-[11px] text-slate-500 font-mono">{c.mobile} • {c.area}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900">{c.workCount} orders</span>
                          <span className="block text-[10px] text-emerald-700 font-semibold">{formatCurrency(c.totalSpent)} spent</span>
                          <span className={`block text-[10px] font-bold ${(c.profit || 0) >= 0 ? "text-sky-700" : "text-rose-600"}`}>
                            {formatCurrency(c.profit || 0)} profit
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
