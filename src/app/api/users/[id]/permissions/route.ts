import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserPermissions, setUserPermissions } from "@/services/userService";
import { PERMISSIONS } from "@/lib/constants";

const VALID_PERMISSIONS: Set<string> = new Set(Object.values(PERMISSIONS));

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  if (auth.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only administrators can manage permissions" } },
      { status: 403 }
    );
  }

  try {
    const data = await getUserPermissions(params.id, auth.user);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  if (auth.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only administrators can manage permissions" } },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const permissions: unknown = body.permissions;

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "permissions must be an array" } },
        { status: 400 }
      );
    }

    for (const perm of permissions) {
      if (typeof perm !== "string" || !VALID_PERMISSIONS.has(perm)) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: `Invalid permission: ${perm}` } },
          { status: 400 }
        );
      }
    }

    const data = await setUserPermissions(params.id, permissions as string[], auth.user);
    return NextResponse.json({
      success: true,
      data,
      message: "Permissions updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}