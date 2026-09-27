import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { WorkStatus } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface WorkTimelineProps {
  currentStatus: WorkStatus;
  history: Array<{
    id: string;
    previousStatus: string;
    newStatus: string;
    notes?: string | null;
    createdAt: string | Date;
    changedByUser?: { name: string; role: string } | null;
  }>;
}

const PRIMARY_STEPS: WorkStatus[] = [
  "NEW",
  "DOCUMENTS_REQUIRED",
  "DOCUMENTS_RECEIVED",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_PROCESS",
  "COMPLETED",
  "DELIVERED",
];

const STEP_LABELS: Record<string, string> = {
  NEW: "Initiated",
  DOCUMENTS_REQUIRED: "Docs Req",
  DOCUMENTS_RECEIVED: "Docs Recvd",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  UNDER_PROCESS: "Under Process",
  COMPLETED: "Completed",
  DELIVERED: "Delivered",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export function WorkTimeline({ currentStatus, history }: WorkTimelineProps) {
  const currentIndex = PRIMARY_STEPS.indexOf(currentStatus);
  const isSpecialState = currentStatus === "ON_HOLD" || currentStatus === "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Horizontal Step Progress (Desktop) */}
      {!isSpecialState ? (
        <div className="hidden md:block p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between relative">
            {PRIMARY_STEPS.map((step, idx) => {
              const isPast = currentIndex >= 0 && idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isCurrent
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs"
                        : isPast
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                      isCurrent ? "font-bold text-emerald-800" : isPast ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
          currentStatus === "CANCELLED"
            ? "bg-rose-50 border-rose-200 text-rose-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <AlertCircle className="h-4 w-4" />
          <span>Work order is currently in &ldquo;{currentStatus}&rdquo; state.</span>
        </div>
      )}

      {/* Vertical Detailed Chronological History */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Status History Log</h4>
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
          {history.map((h, idx) => (
            <div key={h.id || idx} className="relative group">
              <div className="absolute -left-6 top-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white" />
              <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Status: {h.newStatus}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDateTime(h.createdAt)}
                  </span>
                </div>
                {h.notes && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{h.notes}</p>
                )}
                {h.changedByUser && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Updated by: <span className="font-medium text-slate-600">{h.changedByUser.name}</span> ({h.changedByUser.role})
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
