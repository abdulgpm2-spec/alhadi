import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  isCurrency?: boolean;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: "default" | "emerald" | "amber" | "blue" | "purple" | "rose";
}

export function StatCard({
  title,
  value,
  isCurrency = false,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const formattedValue = isCurrency ? formatCurrency(value) : value;

  const iconBgMap = {
    default: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    rose: "bg-rose-100 text-rose-700",
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className={cn("p-2 rounded-lg", iconBgMap[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {formattedValue}
          </span>
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded",
                trend.isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
