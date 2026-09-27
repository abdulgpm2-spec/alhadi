import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}
