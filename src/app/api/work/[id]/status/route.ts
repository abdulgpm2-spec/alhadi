import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { updateWorkStatus } from "@/services/workService";
import { PERMISSIONS } from "@/lib/constants";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_STATUS_UPDATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "New status is required" } },
        { status: 400 }
      );
    }

    const updated = await updateWorkStatus(params.id, body.status, body.notes || "", auth.user);
    return NextResponse.json({
      success: true,
      data: updated,
      message: `Work order status changed to ${body.status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "STATUS_UPDATE_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
