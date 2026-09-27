import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getAgents, createUser } from "@/services/userService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.AGENTS_VIEW);
  if ("status" in auth) return auth;

  try {
    const agents = await getAgents(auth.user);
    return NextResponse.json({ success: true, data: agents });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.AGENTS_CREATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Name and email are required" } },
        { status: 400 }
      );
    }

    const agent = await createUser({
      ...body,
      role: "AGENT",
      user: auth.user,
    });

    return NextResponse.json({
      success: true,
      data: agent,
      message: "Agent account created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
