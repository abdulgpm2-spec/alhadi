"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, RefreshCw, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  onRefresh?: () => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: React.ReactNode;
  renderMobileCard?: (item: T) => React.ReactNode;
}

function DataTableInner<T extends { id?: string }>({
  columns,
  data,
  loading = false,
  searchPlaceholder = "Search records...",
  searchValue,
  onSearchChange,
  filters,
  pagination,
  onRefresh,
  emptyTitle = "No records found",
  emptySubtitle = "Try adjusting your search terms or filters",
  emptyAction,
  renderMobileCard,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState(searchValue || "");

  useEffect(() => {
    if (searchValue !== undefined) {
      setInternalSearch(searchValue);
    }
  }, [searchValue]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          {onSearchChange && (
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder={searchPlaceholder}
                value={internalSearch}
                onChange={handleSearch}
                className="pl-9 h-9 text-xs bg-white"
              />
            </div>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              className="h-9 w-9 shrink-0 bg-white"
              title="Refresh table"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center p-6 text-slate-500">
                    <Inbox className="h-10 w-10 text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-sm text-slate-800">{emptyTitle}</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">{emptySubtitle}</p>
                    {emptyAction && <div className="mt-4">{emptyAction}</div>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIdx) => (
                <TableRow key={item.id || rowIdx} className="hover:bg-slate-50/70 transition-colors">
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx} className={col.className}>
                      {col.cell
                        ? col.cell(item)
                        : (item as any)[col.accessorKey as string] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card-Based View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-white border border-slate-200">
            <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm text-slate-800">{emptyTitle}</p>
            <p className="text-xs text-slate-400 mt-1">{emptySubtitle}</p>
            {emptyAction && <div className="mt-3">{emptyAction}</div>}
          </div>
        ) : (
          data.map((item, idx) => (
            <div key={item.id || idx}>
              {renderMobileCard ? (
                renderMobileCard(item)
              ) : (
                <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1 text-xs">
                  {columns.map((col, cIdx) => (
                    <div key={cIdx} className="flex justify-between py-0.5 border-b border-slate-50">
                      <span className="font-medium text-slate-500">{col.header}:</span>
                      <span className="text-slate-900">
                        {col.cell
                          ? col.cell(item)
                          : (item as any)[col.accessorKey as string] || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-xs text-slate-500">
          <span>
            Showing page <span className="font-semibold text-slate-800">{pagination.page}</span> of{" "}
            <span className="font-semibold text-slate-800">{pagination.totalPages}</span> (
            <span className="font-semibold text-slate-800">{pagination.total}</span> total records)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="h-8 px-2.5 bg-white"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="h-8 px-2.5 bg-white"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoized: parent pages pass stable columns/callbacks (useMemo/useCallback),
// so table body doesn't re-render on unrelated parent state changes.
export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;
