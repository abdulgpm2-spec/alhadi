import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getWorkById } from "@/services/workService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_VIEW);
  if ("status" in auth) return auth;

  try {
    const work = await getWorkById(params.id, auth.user);
    if (!work) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Work order not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: work });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
