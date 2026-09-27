import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getEmployees, createUser } from "@/services/userService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.EMPLOYEES_VIEW);
  if ("status" in auth) return auth;

  try {
    const employees = await getEmployees(auth.user);
    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.EMPLOYEES_CREATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Name and email are required" } },
        { status: 400 }
      );
    }

    const employee = await createUser({
      ...body,
      role: body.role || "EMPLOYEE",
      user: auth.user,
    });

    return NextResponse.json({
      success: true,
      data: employee,
      message: "Employee account created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
