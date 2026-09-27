"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  UserPlus,
  FileSpreadsheet,
  Eye,
  Phone,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, ColumnDef } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  // Current user role (drives assignment selectors)
  const [myRole, setMyRole] = useState("");
  const [myId, setMyId] = useState("");
  const [myName, setMyName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.user) {
          setMyRole(j.data.user.role || "");
          setMyId(j.data.user.id || "");
          setMyName(j.data.user.name || "");
        }
      })
      .catch(() => {});
  }, []);

  // Assignment: admin picks whose customer (agent OR staff); employee picks own agent (optional)
  const [staffEmployees, setStaffEmployees] = useState<any[]>([]);
  const [assignAgents, setAssignAgents] = useState<any[]>([]);
  const [assignAgentId, setAssignAgentId] = useState("");
  const [assignOwner, setAssignOwner] = useState("");

  // Services catalog for enrollment during Registration (DB-driven, multi-select)
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedCorrections, setSelectedCorrections] = useState<Record<string, string[]>>({});
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  // Advance collection at registration
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceMethod, setAdvanceMethod] = useState<"CASH" | "UPI">("CASH");
  const [totalOverride, setTotalOverride] = useState("");

  // Totals: auto-sum of master prices unless operator overrides Total
  const autoTotal = selectedServiceIds.reduce((sum, id) => {
    const s = availableServices.find((x) => x.id === id);
    return sum + (Number(s?.customerPrice) || 0);
  }, 0);
  const selectedTotal = totalOverride.trim() !== "" ? parseFloat(totalOverride) || 0 : autoTotal;
  const advanceNum = parseFloat(advanceAmount) || 0;
  const pendingNum = Math.max(0, selectedTotal - advanceNum);

  // Create Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    state: "Maharashtra",
    pincode: "",
  });

  const fetchCustomers = useCallback(
    async (searchQuery = search, pageNum = page) => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          page: pageNum.toString(),
          pageSize: "15",
          ...(searchQuery ? { search: searchQuery } : {}),
        });

        const res = await fetch(`/api/customers?${query.toString()}`);
        const json = await res.json();
        if (json.success) {
          setCustomers(json.data || []);
          if (json.pagination) {
            setPagination(json.pagination);
          }
        }
      } catch (e) {
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    },
    [search, page]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search, page);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, page, fetchCustomers]);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const fetchAvailableServices = useCallback(async () => {
    try {
      const res = await fetch("/api/services?activeOnly=true");
      const json = await res.json();
      if (json.success) {
        setAvailableServices(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load services for customer registration", e);
    }
  }, []);

  // Toggle service selection (multi-select); closes dropdown, clears its corrections on deselect
  const handleToggleService = useCallback((srvId: string) => {
    setServicesDropdownOpen(false);
    setTotalOverride("");
    setSelectedServiceIds((prev) =>
      prev.includes(srvId) ? prev.filter((id) => id !== srvId) : [...prev, srvId]
    );
    setSelectedCorrections((prev) => {
      if (!prev[srvId]) return prev;
      const next = { ...prev };
      delete next[srvId];
      return next;
    });
  }, []);

  // Toggle a correction checkbox nested under a selected correction-type service
  const handleToggleServiceCorrection = useCallback((srvId: string, corrId: string) => {
    setSelectedCorrections((prev) => {
      const current = prev[srvId] || [];
      return {
        ...prev,
        [srvId]: current.includes(corrId)
          ? current.filter((id) => id !== corrId)
          : [...current, corrId],
      };
    });
  }, []);

  const handleOpenCreate = useCallback(() => {
    setSelectedServiceIds([]);
    setSelectedCorrections({});
    setServicesDropdownOpen(false);
    setServiceSearch("");
    setAdvanceAmount("");
    setAdvanceMethod("CASH");
    setTotalOverride("");
    setAssignAgentId("");
    setAssignOwner("");
    fetchAvailableServices();

    // Assignment lists per role
    if (myRole === "ADMIN") {
      fetch("/api/employees")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setStaffEmployees((j.data || []).filter((u: any) => u.role === "EMPLOYEE"));
        })
        .catch(() => {});
      fetch("/api/agents")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setAssignAgents(j.data || []);
        })
        .catch(() => {});
    } else if (myRole === "EMPLOYEE") {
      fetch("/api/agents/mine")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setAssignAgents(j.data || []);
        })
        .catch(() => {});
    }
    setFormData({
      name: "",
      mobile: "",
      email: "",
      address: "",
      state: "Maharashtra",
      pincode: "",
    });
    setCreateOpen(true);
  }, [myRole, fetchAvailableServices]);

  const handleCreateCustomer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      toast.error("Customer name and mobile number are required");
      return;
    }

    if (formData.mobile.trim().length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }

    if (advanceNum > 0 && selectedServiceIds.length === 0) {
      toast.error("Advance payment needs at least one selected service");
      return;
    }

    if (selectedServiceIds.length > 0 && !(selectedTotal > 0)) {
      toast.error("Total payment must be greater than zero");
      return;
    }

    if (advanceNum > selectedTotal) {
      toast.error(
        `Advance (₹${advanceNum}) cannot exceed total payable (${formatCurrency(selectedTotal)})`
      );
      return;
    }

  const ownerParts = (myRole === "ADMIN" ? assignOwner : "").split(":");
  const ownerAgentId = ownerParts[0] === "agent" ? ownerParts[1] : undefined;
  const ownerEmployeeId = ownerParts[0] === "emp" ? ownerParts[1] : undefined;

    setCreating(true);
    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        serviceIds: selectedServiceIds,
        serviceCorrections: selectedCorrections,
        totalAmount: selectedServiceIds.length > 0 ? selectedTotal : undefined,
        advanceAmount: advanceNum,
        advanceMethod,
        ...(myRole === "ADMIN"
          ? { agentId: ownerAgentId, employeeId: ownerEmployeeId }
          : myRole === "EMPLOYEE"
            ? { agentId: assignAgentId || undefined }
            : {}),
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to create customer");
      }

      toast.success(
        selectedServiceIds.length > 0
          ? `Customer ${json.data.name} (${json.data.customerId}) registered with ${selectedServiceIds.length} initial work order(s)!`
          : `Customer ${json.data.name} (${json.data.customerId}) registered successfully!`
      );
      setCreateOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || "Failed to register customer");
    } finally {
      setCreating(false);
    }
  }, [
    formData,
    advanceNum,
    selectedServiceIds,
    selectedTotal,
    myRole,
    assignAgentId,
    assignOwner,
    selectedCorrections,
    advanceMethod,
    fetchCustomers,
  ]);

  const handleExportCSV = useCallback(() => {
    if (customers.length === 0) {
      toast.error("No customer records to export");
      return;
    }
    const headers = [
      "Customer ID",
      "Name",
      "Mobile",
      "Email",
      "Gender",
      "Area",
      "City",
      "Total Works",
      "Created Date",
    ];
    const rows = customers.map((c) => [
      c.customerId,
      `"${c.name}"`,
      c.mobile,
      c.email || "",
      c.gender || "",
      `"${c.area || ""}"`,
      `"${c.city || ""}"`,
      c._count?.works || 0,
      formatDate(c.createdAt),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AlHadi_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Customer list exported to CSV");
  }, [customers]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      header: "Customer ID",
      cell: (c) => <span className="font-mono font-bold text-xs text-emerald-800">{c.customerId}</span>,
    },
    {
      header: "Customer Name",
      cell: (c) => (
        <div className="font-medium text-slate-900">
          <Link href={`/customers/${c.id}`} className="font-semibold hover:text-emerald-700 hover:underline">
            {c.name}
          </Link>
          {c.agent && (
            <span className="block text-[10px] text-amber-700 font-medium">Ref: {c.agent.name}</span>
          )}
        </div>
      ),
    },
    {
      header: "Mobile Number",
      cell: (c) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
          <Phone className="h-3 w-3 text-slate-400" />
          <span>{c.mobile}</span>
        </div>
      ),
    },
    {
      header: "Recent Services",
      cell: (c) => {
        const worksList = c.works || [];
        if (worksList.length === 0) {
          return <span className="text-[11px] text-slate-400 italic">No services</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {worksList.slice(0, 2).map((w: any) => (
              <span
                key={w.id}
                className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200"
              >
                {w.service?.name || "Service"}
              </span>
            ))}
            {worksList.length > 2 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-medium">
                +{worksList.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Area / City",
      cell: (c) => (
        <span className="text-xs text-slate-600 truncate max-w-[140px] block">
          {c.area ? `${c.area}, ${c.city}` : c.city || "-"}
        </span>
      ),
    },
    {
      header: "Works",
      cell: (c) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {c._count?.works || 0} orders
        </span>
      ),
    },
    {
      header: "Registered",
      cell: (c) => <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1.5">
          <Link href={`/customers/${c.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-3 w-3 mr-1" /> View Profile
            </Button>
          </Link>
        </div>
      ),
    },
  ], []);

  const emptyActionNode = useMemo(
    () => (
      <Button size="sm" onClick={handleOpenCreate} className="bg-emerald-600 text-white text-xs font-semibold">
        <UserPlus className="h-3.5 w-3.5 mr-1" /> Register Customer
      </Button>
    ),
    [handleOpenCreate]
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
        title="Customer Directory"
        subtitle="Manage citizen customer profiles, contact records, history, and applications"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="h-8 text-xs bg-white text-slate-700 border-slate-300"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Export CSV
            </Button>
            {myRole !== "AGENT" && (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Register Customer
              </Button>
            )}
          </div>
        }
      />

      {/* Customer DataTable */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search customer by name, 10-digit mobile, or customer ID..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        onRefresh={fetchCustomers}
        pagination={paginationProps}
        emptyTitle="No customers found"
        emptySubtitle={
          myRole === "AGENT"
            ? "Your customers will appear here once you apply services for them"
            : "Register a new citizen customer to start creating CSC work orders"
        }
        emptyAction={myRole === "AGENT" ? undefined : emptyActionNode}
      />

      {/* Register Customer Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" /> Register New Customer
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-5 my-2">
            {/* Section 1: Citizen Personal Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                <span>Personal & Contact Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Mohammad Farhan Shaikh"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">10-Digit Mobile *</label>
                  <Input
                    required
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9820112233"
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <Input
                    type="email"
                    placeholder="e.g. farhan@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Address</label>
                  <Input
                    placeholder="House No., Street, Landmark"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Assignment: whose customer is this? (role-based) */}
            {myRole === "ADMIN" && (
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-slate-700">
                  Customer Of <span className="font-normal text-slate-400">(kis agent ya staff ka customer?)</span>
                </label>
                <Select value={assignOwner || "DIRECT"} onValueChange={(val) => setAssignOwner(val === "DIRECT" ? "" : val)}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Select owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRECT">— Direct / Office customer —</SelectItem>
                    {assignAgents.map((a) => (
                      <SelectItem key={`agent:${a.id}`} value={`agent:${a.id}`}>
                        [Agent] {(a.businessName && a.businessName !== "-" ? `${a.businessName} — ` : "") + a.name}
                        {(a.supervisorName || a.supervisor?.name)
                          ? ` (under ${a.supervisorName || a.supervisor?.name})`
                          : ""}
                      </SelectItem>
                    ))}
                    {staffEmployees.map((e) => (
                      <SelectItem key={`emp:${e.id}`} value={`emp:${e.id}`}>
                        [Staff] {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {myRole === "EMPLOYEE" && (
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-slate-700">
                  My Agent <span className="font-normal text-slate-400">(optional — leave empty for your own direct customer)</span>
                </label>
                {assignAgents.length === 0 ? (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
                    No agents work under you yet. Ask Admin to map agents to you (Agents tab → Reports To) before
                    registering customers.
                  </p>
                ) : (
                  <Select value={assignAgentId || ""} onValueChange={(val) => setAssignAgentId(val)}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Select one of your agents..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignAgents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {(a.businessName && a.businessName !== "-" ? `${a.businessName} — ` : "") + a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {myRole === "AGENT" && (
              <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-2">
                This customer will be tagged to you{myName ? ` (${myName})` : ""} automatically.
              </p>
            )}

            {/* Section 2: Services Enrollment (multi-select, DB-driven) */}
            <div className="space-y-3 pt-2">
              {availableServices.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  No active services in catalog. Add services in the Services tab first.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Multi-select dropdown */}
                  <div className="relative">
                    {servicesDropdownOpen && (
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setServicesDropdownOpen(false)}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                      className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-700 flex items-center justify-between gap-2 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <span className={selectedServiceIds.length > 0 ? "font-semibold text-slate-900" : "text-slate-400"}>
                        {selectedServiceIds.length > 0
                          ? `${selectedServiceIds.length} service(s) selected`
                          : "Select services from catalog..."}
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${servicesDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {servicesDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                        <div className="p-2 border-b border-slate-100">
                          <Input
                            placeholder="Search services..."
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                          {availableServices
                            .filter((srv) => {
                              if (!serviceSearch.trim()) return true;
                              const q = serviceSearch.toLowerCase().trim();
                              return (
                                srv.name?.toLowerCase().includes(q) ||
                                srv.category?.name?.toLowerCase().includes(q)
                              );
                            })
                            .map((srv) => {
                              const isSelected = selectedServiceIds.includes(srv.id);
                              return (
                                <label
                                  key={srv.id}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                                    isSelected ? "bg-emerald-50 text-emerald-950 font-semibold" : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleService(srv.id)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                                  />
                                  <span className="flex-1 truncate">{srv.name}</span>
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {srv.category?.name || "General"}
                                  </span>
                                  <span className="font-bold text-emerald-800 text-[11px] shrink-0">
                                    {formatCurrency(srv.customerPrice)}
                                  </span>
                                </label>
                              );
                            })}
                          {availableServices.filter((srv) => {
                            if (!serviceSearch.trim()) return true;
                            const q = serviceSearch.toLowerCase().trim();
                            return (
                              srv.name?.toLowerCase().includes(q) ||
                              srv.category?.name?.toLowerCase().includes(q)
                            );
                          }).length === 0 && (
                            <p className="text-[11px] text-slate-400 italic text-center py-3">
                              No services match “{serviceSearch}”
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected service chips */}
                  {selectedServiceIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedServiceIds.map((srvId) => {
                        const srv = availableServices.find((s) => s.id === srvId);
                        if (!srv) return null;
                        return (
                          <span
                            key={srvId}
                            className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-semibold"
                          >
                            {srv.name}
                            <button
                              type="button"
                              onClick={() => handleToggleService(srvId)}
                              className="p-0.5 rounded-full hover:bg-emerald-200 text-emerald-700 transition-colors"
                              title={`Remove ${srv.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Nested correction checkboxes for selected correction-type services */}
                  {selectedServiceIds.map((srvId) => {
                    const srv = availableServices.find((s) => s.id === srvId);
                    if (!srv) return null;
                    const activeCorrections = (srv.correctionOptions || []).filter(
                      (c: any) => c.isActive !== false
                    );
                    if (srv.serviceType !== "CORRECTION" || activeCorrections.length === 0) return null;
                    return (
                      <div key={srvId} className="p-2 rounded-md bg-white border border-sky-200 space-y-1">
                        <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wide block">
                          {srv.name} — What to correct?
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {activeCorrections.map((c: any) => {
                            const checked = (selectedCorrections[srv.id] || []).includes(c.id);
                            return (
                              <label
                                key={c.id}
                                className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] cursor-pointer ${
                                  checked ? "bg-sky-50 text-sky-900 font-semibold" : "text-slate-600"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleToggleServiceCorrection(srv.id, c.id)}
                                  className="h-3 w-3 rounded border-slate-300 text-sky-600 focus:ring-sky-500 shrink-0"
                                />
                                <span className="flex-1 truncate" title={c.note || c.name}>
                                  {c.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment summary — Total editable, Advance + method, Pending auto */}
            {selectedServiceIds.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <label className="text-[10px] text-slate-400 font-semibold block uppercase whitespace-nowrap">
                    Total Payment
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={totalOverride.trim() !== "" ? totalOverride : autoTotal}
                    onChange={(e) => setTotalOverride(e.target.value.replace(/[^0-9.]/g, ""))}
                    onBlur={() => {
                      if (totalOverride.trim() !== "" && !(parseFloat(totalOverride) > 0)) {
                        setTotalOverride("");
                      }
                    }}
                    className="w-full bg-transparent font-black text-slate-900 text-sm focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-emerald-700 font-semibold uppercase whitespace-nowrap">
                      Advance
                    </label>
                    <div className="flex rounded overflow-hidden border border-emerald-300 shrink-0">
                      {(["CASH", "UPI"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAdvanceMethod(m)}
                          className={`px-1.5 py-px text-[10px] font-bold transition-colors ${
                            advanceMethod === m
                              ? "bg-emerald-600 text-white"
                              : "bg-white text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {m === "CASH" ? "Cash" : "UPI"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={selectedTotal}
                    placeholder="0"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-full bg-transparent font-black text-slate-900 text-sm focus:outline-none placeholder:text-slate-300 placeholder:font-normal"
                  />
                </div>
                <div
                  className={`p-2.5 rounded-lg border ${
                    pendingNum > 0 ? "bg-amber-50/60 border-amber-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase whitespace-nowrap">
                    Pending Payment
                  </span>
                  <span
                    className={`font-black text-sm whitespace-nowrap ${pendingNum > 0 ? "text-amber-700" : "text-slate-900"}`}
                  >
                    {formatCurrency(pendingNum)}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {creating ? "Registering..." : "Register Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
