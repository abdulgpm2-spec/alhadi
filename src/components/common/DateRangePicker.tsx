"use client";

import React from "react";
import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={`flex items-center gap-1.5 bg-white border border-slate-200 rounded-md p-1 px-2 text-xs shadow-xs ${className || ""}`}>
      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="bg-transparent text-slate-700 text-xs outline-none cursor-pointer"
      />
      <span className="text-slate-400">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="bg-transparent text-slate-700 text-xs outline-none cursor-pointer"
      />
    </div>
  );
}
