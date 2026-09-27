import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getReceipts } from "@/services/receiptService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.RECEIPTS_VIEW);
  if ("status" in auth) return auth;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const customerId = url.searchParams.get("customerId") || undefined;
  const workId = url.searchParams.get("workId") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

  try {
    const result = await getReceipts({
      search,
      customerId,
      workId,
      page,
      pageSize,
      user: auth.user,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
