import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { updateWorkDates } from "@/services/workService";
import { PERMISSIONS } from "@/lib/constants";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_DATES_UPDATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const updated = await updateWorkDates(
      params.id,
      {
        documentsReceivedDate: body.documentsReceivedDate,
        appliedDate: body.appliedDate,
        deliveryDate: body.deliveryDate,
      },
      auth.user
    );
    return NextResponse.json({
      success: true,
      data: updated,
      message: "Service dates updated",
    });
  } catch (error: any) {
    const isNotFound = error.message === "Work order not found";
    const isValidation =
      error.message === "Applied Date cannot be before Documents Received Date" ||
      error.message === "Delivery Date cannot be before Applied Date" ||
      error.message === "Invalid date provided";
    const status = isNotFound ? 404 : isValidation ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { code: isValidation ? "VALIDATION_ERROR" : status === 500 ? "UPDATE_ERROR" : "NOT_FOUND", message: error.message } },
      { status }
    );
  }
}