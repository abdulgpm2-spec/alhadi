import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getReceiptById } from "@/services/receiptService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.RECEIPTS_VIEW);
  if ("status" in auth) return auth;

  try {
    const receipt = await getReceiptById(params.id, auth.user);
    if (!receipt) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Receipt not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: receipt });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
