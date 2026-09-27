"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, ColumnDef } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { WorkStatusBadge } from "@/components/common/StatusBadge";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function WorkOrdersPage() {
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  // Role + team scope (who sees what)
  const [myRole, setMyRole] = useState("");
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [agents, setAgents] = useState<any[]>([]);
  const [operatorFilter, setOperatorFilter] = useState("ALL");
  const [operators, setOperators] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        const role = j.data?.user?.role || "";
        const uid = j.data?.user?.id || "";
        setMyRole(role);
        if (role === "ADMIN") {
          fetch("/api/agents")
            .then((r) => r.json())
            .then((a) => {
              if (a.success) setAgents(a.data || []);
            })
            .catch(() => {});
          fetch("/api/employees")
            .then((r) => r.json())
            .then((e) => {
              if (e.success) setOperators((e.data || []).filter((u: any) => u.role === "EMPLOYEE"));
            })
            .catch(() => {});
        } else if (role === "EMPLOYEE") {
          fetch("/api/agents/mine")
            .then((r) => r.json())
            .then((a) => {
              if (a.success) setAgents(a.data || []);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        summary: "true",
        ...(agentFilter !== "ALL" ? { agentId: agentFilter } : {}),
        ...(operatorFilter !== "ALL" ? { assignedUserId: operatorFilter } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
      const res = await fetch(`/api/work?${query.toString()}`);
      const json = await res.json();
      if (json.success) setSummary(json.data);
    } catch (e) {
      /* ignore */
    }
  }, [agentFilter, operatorFilter, startDate, endDate]);

  const fetchWorks = useCallback(async (searchQuery = search, pageNum = page) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: "15",
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(priorityFilter !== "ALL" ? { priority: priorityFilter } : {}),
        ...(agentFilter !== "ALL" ? { agentId: agentFilter } : {}),
        ...(operatorFilter !== "ALL" ? { assignedUserId: operatorFilter } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });

      const res = await fetch(`/api/work?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setWorks(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch (e) {
      toast.error("Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, [search, page, statusFilter, priorityFilter, agentFilter, operatorFilter, startDate, endDate]);

  useEffect(() => {
    fetchWorks(search, page);
    fetchSummary();
  }, [fetchWorks, fetchSummary, search, page]);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
    fetchWorks(val, 1);
  }, [fetchWorks]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      header: "Work ID",
      cell: (w) => (
        <Link href={`/work/${w.id}`} className="font-mono font-bold text-xs text-emerald-800 hover:underline">
          {w.workId}
        </Link>
      ),
    },
    {
      header: "Customer",
      cell: (w) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{w.customer?.name}</p>
          <p className="text-[11px] text-slate-500 font-mono">{w.customer?.mobile}</p>
        </div>
      ),
    },
    {
      header: "Source",
      cell: (w) =>
        w.agent ? (
          <div>
            <p className="font-semibold text-amber-800 text-xs truncate max-w-[130px]" title={w.agent.businessName && w.agent.businessName !== "-" ? w.agent.businessName : w.agent.name}>
              {w.agent.businessName && w.agent.businessName !== "-" ? w.agent.businessName : w.agent.name}
            </p>
            <p className="text-[10px] text-slate-400">via Agent</p>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 font-medium">Direct / Office</span>
        ),
    },
    {
      header: "Service",
      cell: (w) => (
        <div>
          <span className="font-medium text-slate-800 text-xs">{w.service?.name}</span>
          <span className="block text-[10px] text-slate-400">{w.service?.category?.name}</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (w) => <WorkStatusBadge status={w.status} />,
    },
    {
      header: "Tracking / Ref#",
      cell: (w) => (
        <span className="text-xs font-mono font-medium text-slate-700">
          {w.trackingReferenceNumber || <span className="text-slate-400 italic">—</span>}
        </span>
      ),
    },
    {
      header: "Applied Date",
      cell: (w) => <span className="text-xs text-slate-500">{formatDate(w.appliedDate)}</span>,
    },
    {
      header: "Assigned To",
      cell: (w) => (
        <span className="text-xs text-slate-600">
          {w.assignedUser ? w.assignedUser.name : <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      header: "Amount",
      cell: (w) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900">{formatCurrency(w.totalAmount)}</span>
          <span className="block text-[10px] text-slate-500">
            Pending: <span className={w.pendingAmount > 0 ? "text-rose-600 font-bold" : "text-emerald-700 font-medium"}>{formatCurrency(w.pendingAmount)}</span>
          </span>
        </div>
      ),
    },
    {
      header: "Due Date",
      cell: (w) => (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-400" /> {formatDate(w.dueDate)}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (w) => (
        <Link href={`/work/${w.id}`}>
          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 bg-white text-slate-700 hover:bg-slate-50">
            <Eye className="h-3 w-3 mr-1" /> Details
          </Button>
        </Link>
      ),
    },
  ], []);

  // Agents see their own scoped list — Source column is noise for them
  const visibleColumns = myRole === "AGENT" ? columns.filter((c) => c.header !== "Source") : columns;

  const handleRefresh = useCallback(() => {
    fetchWorks();
    fetchSummary();
  }, [fetchWorks, fetchSummary]);

  const handleStatusFilter = useCallback((val: string) => {
    setStatusFilter(val);
    setPage(1);
  }, []);

  const handlePriorityFilter = useCallback((val: string) => {
    setPriorityFilter(val);
    setPage(1);
  }, []);

  const handleAgentFilter = useCallback((val: string) => {
    setAgentFilter(val);
    setPage(1);
  }, []);

  const handleOperatorFilter = useCallback((val: string) => {
    setOperatorFilter(val);
    setPage(1);
  }, []);

  const handleStartDateFilter = useCallback((d: string) => {
    setStartDate(d);
    setPage(1);
  }, []);

  const handleEndDateFilter = useCallback((d: string) => {
    setEndDate(d);
    setPage(1);
  }, []);

  const showAllOrders = useCallback(() => {
    setStatusFilter("ALL");
    setPage(1);
  }, []);

  const showInProgress = useCallback(() => {
    setStatusFilter("IN_PROGRESS");
    setPage(1);
  }, []);

  const showCompleted = useCallback(() => {
    setStatusFilter("COMPLETED");
    setPage(1);
  }, []);

  const filtersNode = useMemo(
    () => (
      <>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="h-9 w-36 text-xs bg-white">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="DOCUMENTS_REQUIRED">Docs Required</SelectItem>
            <SelectItem value="DOCUMENTS_RECEIVED">Docs Received</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="UNDER_PROCESS">Under Process</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
          <SelectTrigger className="h-9 w-32 text-xs bg-white">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>

            {myRole !== "AGENT" && (
              <Select value={agentFilter} onValueChange={handleAgentFilter}>
                <SelectTrigger className="h-9 w-40 text-xs bg-white">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {myRole === "EMPLOYEE" ? "All My Agents + Direct" : "All Sources"}
                  </SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {(a.businessName && a.businessName !== "-" ? `${a.businessName} — ` : "") + a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {myRole === "ADMIN" && (
              <Select value={operatorFilter} onValueChange={handleOperatorFilter}>
                <SelectTrigger className="h-9 w-40 text-xs bg-white">
                  <SelectValue placeholder="All Operators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Operators</SelectItem>
                  {operators.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={handleStartDateFilter}
          onEndDateChange={handleEndDateFilter}
        />
      </>
    ),
    [
      statusFilter,
      handleStatusFilter,
      priorityFilter,
      handlePriorityFilter,
      myRole,
      agentFilter,
      handleAgentFilter,
      agents,
      operatorFilter,
      handleOperatorFilter,
      operators,
      startDate,
      endDate,
      handleStartDateFilter,
      handleEndDateFilter,
    ]
  );

  const emptyActionNode = useMemo(
    () => (
      <Link href="/work/new">
        <Button size="sm" className="bg-emerald-600 text-white text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Create Work Order
        </Button>
      </Link>
    ),
    []
  );

  const paginationProps = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: pagination.totalPages,
      onPageChange: setPage,
    }),
    [pagination]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Order Management"
        subtitle="Track customer applications, operational lifecycles, assignments, and document verification"
        action={
          <Link href="/work/new">
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Work Order
            </Button>
          </Link>
        }
      />

      {/* Team command strip — scoped summary (click a card to filter) */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={showAllOrders}
            title="Show all work orders"
            className={`p-3 rounded-lg border text-left transition-colors ${statusFilter === "ALL" ? "border-emerald-500 bg-emerald-50/60" : "bg-white border-slate-200 hover:border-slate-300"}`}
          >
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Orders</span>
            <span className="font-black text-slate-900 text-lg">{summary.total || 0}</span>
          </button>
          <button
            type="button"
            onClick={showInProgress}
            title="Show in-progress orders"
            className="p-3 rounded-lg border text-left bg-white border-slate-200 hover:border-sky-300 transition-colors"
          >
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">In Progress</span>
            <span className="font-black text-sky-700 text-lg">{summary.active || 0}</span>
          </button>
          <button
            type="button"
            onClick={showCompleted}
            title="Show completed orders"
            className="p-3 rounded-lg border text-left bg-white border-slate-200 hover:border-emerald-300 transition-colors"
          >
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Completed</span>
            <span className="font-black text-emerald-700 text-lg">{summary.done || 0}</span>
          </button>
          <div className="p-3 rounded-lg border bg-white border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Pending Collection</span>
            <span className="font-black text-rose-700 text-lg">{formatCurrency(summary.pendingAmount || 0)}</span>
            <span className="block text-[10px] text-slate-400">{summary.pendingWorks || 0} order(s) unpaid</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <DataTable
        columns={visibleColumns}
        data={works}
        loading={loading}
        searchPlaceholder="Search by Work ID, Tracking/Ref#, customer name, mobile, or service..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        onRefresh={handleRefresh}
        filters={filtersNode}
        pagination={paginationProps}
        emptyTitle="No work orders found"
        emptySubtitle="Create a work order to track application processing"
        emptyAction={emptyActionNode}
      />
    </div>
  );
}
