import React from "react";
import { Badge } from "@/components/ui/badge";
import { WorkStatus, PaymentStatus, DocumentState } from "@/types";
import { WORK_STATUS_LABELS } from "@/lib/constants";

interface WorkStatusBadgeProps {
  status: string;
}

export const WorkStatusBadge = React.memo(function WorkStatusBadge({ status }: WorkStatusBadgeProps) {
  const config = WORK_STATUS_LABELS[status as WorkStatus] || {
    label: status,
    variant: "secondary",
  };

  return (
    <Badge variant={config.variant} className="text-[11px] font-semibold px-2 py-0.5 whitespace-nowrap">
      {config.label}
    </Badge>
  );
});

export const PaymentStatusBadge = React.memo(function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "PAID") {
    return <Badge variant="success" className="text-[11px] font-semibold">Fully Paid</Badge>;
  }
  if (status === "PARTIAL") {
    return <Badge variant="warning" className="text-[11px] font-semibold">Partial</Badge>;
  }
  if (status === "REFUNDED") {
    return <Badge variant="destructive" className="text-[11px] font-semibold">Refunded</Badge>;
  }
  return <Badge variant="outline" className="text-[11px]">{status}</Badge>;
});

export const DocumentStateBadge = React.memo(function DocumentStateBadge({ state }: { state: string }) {
  switch (state) {
    case "REQUIRED":
      return <Badge variant="warning" className="text-[11px]">Required</Badge>;
    case "UPLOADED":
      return <Badge variant="info" className="text-[11px]">Uploaded</Badge>;
    case "VERIFIED":
      return <Badge variant="success" className="text-[11px]">Verified ✓</Badge>;
    case "REJECTED":
      return <Badge variant="destructive" className="text-[11px]">Rejected ✕</Badge>;
    default:
      return <Badge variant="outline" className="text-[11px]">{state}</Badge>;
  }
});
