import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getFinancialReport } from "@/services/reportService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.REPORTS_VIEW);
  if ("status" in auth) return auth;

  const url = new URL(req.url);
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  const branchId = url.searchParams.get("branchId") || undefined;
  const paymentMethod = url.searchParams.get("paymentMethod") || undefined;

  try {
    const report = await getFinancialReport({
      startDate,
      endDate,
      branchId,
      paymentMethod,
      user: auth.user,
    });
    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "REPORT_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
