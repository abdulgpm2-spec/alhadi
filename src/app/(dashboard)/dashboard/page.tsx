"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Layers,
  Activity,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/common/StatCard";
import { PageHeader } from "@/components/common/PageHeader";
import { WorkStatusBadge } from "@/components/common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatRelativeTime, formatDate } from "@/lib/utils";

// Load recharts heavy bundle only when the dashboard charts render
const DashboardCharts = dynamic(() => import("@/components/common/DashboardCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="h-80 rounded-lg" />
    </div>
  ),
});

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const recentWorks = data?.recentWorks || [];
  const recentActivities = data?.recentActivities || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <PageHeader
        title="Dashboard"
        subtitle="Real-time citizen service, activity, workflows, and financials"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/customers">
              <Button size="sm" variant="outline" className="h-8 text-xs bg-white">
                <Users className="h-3.5 w-3.5 mr-1" /> New Customer
              </Button>
            </Link>
            <Link href="/work/new">
              <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" /> New Work Order
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={kpis.totalCustomers || 0}
          subtitle={`+${kpis.todayCustomers || 0} registered today`}
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Pending Work"
          value={kpis.pendingWorkCount || 0}
          subtitle={`${kpis.completedWorkCount || 0} applications completed`}
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Monthly Income"
          value={kpis.monthlyIncome || 0}
          isCurrency
          subtitle={`Today: ${formatCurrency(kpis.todayIncome || 0)}`}
          icon={CreditCard}
          variant="emerald"
        />
        <StatCard
          title="Monthly Net Profit"
          value={kpis.monthlyNetProfit || 0}
          isCurrency
          subtitle={`Total Expenses: ${formatCurrency(kpis.monthlyExpense || 0)}`}
          icon={TrendingUp}
          variant={kpis.monthlyNetProfit >= 0 ? "emerald" : "rose"}
        />
      </div>

      {/* Secondary Financial Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Pending Receivable</span>
            <p className="text-lg font-bold text-rose-600 mt-0.5">{formatCurrency(kpis.pendingPayments || 0)}</p>
          </div>
          <div className="p-2 bg-rose-50 text-rose-600 rounded-md">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Lifetime Income</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(kpis.totalIncome || 0)}</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Work Applications</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{kpis.totalWorkCount || 0}</p>
          </div>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-md">
            <Layers className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Charts Grid (lazily loaded to trim initial JS bundle) */}
      <DashboardCharts
        incomeExpenseTrend={charts.incomeExpenseTrend || []}
        serviceRevenue={charts.serviceRevenue || []}
      />

      {/* Tables Row: Recent Works & Live Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Work Orders (2 Cols) */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Recent Work Orders</CardTitle>
                <CardDescription className="text-xs">Latest customer service applications</CardDescription>
              </div>
              <Link href="/work" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentWorks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No work orders recorded</div>
                ) : (
                  recentWorks.map((work: any) => (
                    <Link
                      key={work.id}
                      href={`/work/${work.id}`}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 font-mono">{work.workId}</span>
                          <WorkStatusBadge status={work.status} />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">{work.service?.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {work.customer?.name} • {work.customer?.mobile}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">
                          {formatCurrency(work.totalAmount)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(work.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Audit Stream (1 Col) */}
        <div>
          <Card className="border-slate-200 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-sm font-bold text-slate-800">Live Activity Feed</CardTitle>
              </div>
              <CardDescription className="text-xs">Real-time system audit logs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {recentActivities.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No recent activity</div>
                ) : (
                  recentActivities.map((act: any) => (
                    <div key={act.id} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800 px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                          {act.action}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {formatRelativeTime(act.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {act.entity} #{act.entityId.slice(0, 8)} modified by{" "}
                        <span className="font-medium text-slate-900">{act.user?.name || "System"}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
