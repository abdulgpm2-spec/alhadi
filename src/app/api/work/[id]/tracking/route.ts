import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { updateWorkTracking } from "@/services/workService";
import { PERMISSIONS } from "@/lib/constants";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_TRACKING_UPDATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const trackingReferenceNumber =
      typeof body.trackingReferenceNumber === "string" ? body.trackingReferenceNumber.trim() : "";
    const updated = await updateWorkTracking(params.id, trackingReferenceNumber, auth.user);
    return NextResponse.json({
      success: true,
      data: updated,
      message: "Tracking / Reference Number updated",
    });
  } catch (error: any) {
    const isNotFound = error.message === "Work order not found";
    return NextResponse.json(
      { success: false, error: { code: isNotFound ? "NOT_FOUND" : "UPDATE_ERROR", message: error.message } },
      { status: isNotFound ? 404 : 500 }
    );
  }
}