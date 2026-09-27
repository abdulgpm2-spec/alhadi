import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { updateCategory, deleteCategory } from "@/services/serviceCatalogService";
import { PERMISSIONS } from "@/lib/constants";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.SERVICES_UPDATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const updated = await updateCategory(params.id, body, auth.user);
    return NextResponse.json({ success: true, data: updated, message: "Category updated successfully" });
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
    const result = await deleteCategory(params.id, auth.user);
    return NextResponse.json({
      success: true,
      data: result,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
