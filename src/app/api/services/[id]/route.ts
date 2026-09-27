import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { getServiceById, updateService, deleteService } from "@/services/serviceCatalogService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  try {
    const service = await getServiceById(params.id, auth.user);
    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Service not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: service });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.SERVICES_UPDATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const updated = await updateService(params.id, body, auth.user);
    return NextResponse.json({ success: true, data: updated, message: "Service updated successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.SERVICES_DELETE);
  if ("status" in auth) return auth;

  try {
    const result = await deleteService(params.id, auth.user);
    return NextResponse.json({
      success: true,
      data: result,
      message: "Service deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
