import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { addWorkCost } from "@/services/workService";
import { PERMISSIONS } from "@/lib/constants";

// Add an actual cost entry to a work order (e.g. postman delivery paid later).
// Staff-only: agents are rejected in the service layer as well.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_UPDATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const result = await addWorkCost(
      params.id,
      { label: body.label, amount: Number(body.amount) },
      auth.user
    );
    return NextResponse.json({
      success: true,
      data: result,
      message: "Cost entry added successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "COST_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
