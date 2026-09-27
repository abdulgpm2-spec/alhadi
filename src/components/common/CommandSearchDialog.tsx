"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Briefcase, CreditCard, Receipt, Layers, X, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface CommandSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearchDialog({ open, onOpenChange }: CommandSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    customers: any[];
    works: any[];
    payments: any[];
    receipts: any[];
    services: any[];
  }>({
    customers: [],
    works: [],
    payments: [],
    receipts: [],
    services: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ customers: [], works: [], payments: [], receipts: [], services: [] });
    }
  }, [open]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ customers: [], works: [], payments: [], receipts: [], services: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (json.success && json.data) {
          setResults(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  const hasAnyResults =
    results.customers.length > 0 ||
    results.works.length > 0 ||
    results.payments.length > 0 ||
    results.receipts.length > 0 ||
    results.services.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden shadow-2xl border border-slate-200">
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <Search className="h-4 w-4 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by customer name, mobile, work ID (WORK-2026-...), receipt, or service..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {loading && <span className="text-[11px] text-emerald-600 font-medium ml-2 animate-pulse">Searching...</span>}
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 characters to search across all records
            </div>
          )}

          {query && !loading && !hasAnyResults && (
            <div className="py-8 text-center text-xs text-slate-400">
              No results found for &ldquo;<span className="font-semibold text-slate-600">{query}</span>&rdquo;
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Customers</span>
              <div className="mt-1.5 space-y-1">
                {results.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/customers/${c.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-100 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                        <p className="text-[11px] text-slate-500">{c.mobile} • {c.customerId}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Work Orders */}
          {results.works.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Work Orders</span>
              <div className="mt-1.5 space-y-1">
                {results.works.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleSelect(`/work/${w.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-100 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                        <Briefcase className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{w.workId}</span>
                          <Badge variant="outline" className="text-[10px] py-0">{w.status}</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500">{w.service?.name} • {w.customer?.name}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Receipts */}
          {results.receipts.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Receipts</span>
              <div className="mt-1.5 space-y-1">
                {results.receipts.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(`/receipts/${r.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-100 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                        <Receipt className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{r.receiptNumber}</p>
                        <p className="text-[11px] text-slate-500">{r.customer?.name} • {formatCurrency(r.paidAmount)}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {results.services.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">CSC Services</span>
              <div className="mt-1.5 space-y-1">
                {results.services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(`/services`)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-100 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
                        <Layers className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{s.name}</p>
                        <p className="text-[11px] text-slate-500">{s.category?.name ? `${s.category.name} • ` : ""}{formatCurrency(s.customerPrice)}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
