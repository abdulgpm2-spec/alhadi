import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateUser, deleteUser } from "@/services/userService";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  // Allow self-update or admin update
  if (auth.user.role !== "ADMIN" && auth.user.id !== params.id) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Cannot edit other users" } },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const updated = await updateUser(params.id, body, auth.user);
    return NextResponse.json({
      success: true,
      data: updated,
      message: "User details updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  if (auth.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only an administrator can remove users" } },
      { status: 403 }
    );
  }

  try {
    const result = await deleteUser(params.id, auth.user);
    return NextResponse.json({
      success: true,
      data: result,
      message: "User removed successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
