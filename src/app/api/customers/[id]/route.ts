import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getCustomerById, updateCustomer, softDeleteCustomer } from "@/services/customerService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.CUSTOMERS_VIEW);
  if ("status" in auth) return auth;

  try {
    const customer = await getCustomerById(params.id, auth.user);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Customer not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.CUSTOMERS_UPDATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const updated = await updateCustomer(params.id, body, auth.user);
    return NextResponse.json({ success: true, data: updated, message: "Customer updated successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.CUSTOMERS_DELETE);
  if ("status" in auth) return auth;

  try {
    await softDeleteCustomer(params.id, auth.user);
    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
