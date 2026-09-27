import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";
import { SessionUser, UserRole } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email and password are required" } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        branch: true,
        permissions: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    const permissions = user.permissions.map((p) => p.permission);

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role as UserRole,
      organizationId: user.organizationId,
      branchId: user.branchId,
      branchName: user.branch?.name || null,
      permissions,
      agentId: user.role === "AGENT" ? user.id : null,
    };

    const token = await setSessionCookie(sessionUser);

    const response = NextResponse.json({
      success: true,
      data: { user: sessionUser, token },
      message: "Login successful",
    });

    response.cookies.set("alhadi_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message || "Failed to login" } },
      { status: 500 }
    );
  }
}
