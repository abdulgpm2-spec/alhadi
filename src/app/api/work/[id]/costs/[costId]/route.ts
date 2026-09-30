import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { deleteWorkCost } from "@/services/workService";
import { PERMISSIONS } from "@/lib/constants";

export async function DELETE(req: NextRequest, { params }: { params: { id: string; costId: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_UPDATE);
  if ("status" in auth) return auth;

  try {
    const result = await deleteWorkCost(params.costId, auth.user);
    return NextResponse.json({
      success: true,
      data: result,
      message: "Cost entry removed successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "COST_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
