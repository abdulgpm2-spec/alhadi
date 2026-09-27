import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { SessionUser, UserRole } from "@/types";
import { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_EMPLOYEE_PERMISSIONS, DEFAULT_AGENT_PERMISSIONS } from "@/lib/constants";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "alhadi-enterprise-super-secure-session-key-2026"
);

const SESSION_COOKIE_NAME = "alhadi_session";
const SESSION_EXPIRATION = "7d";

export async function createSessionToken(payload: SessionUser): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION)
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionUser;
  } catch (err) {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return token;
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await verifySessionToken(token);
    if (!payload || !payload.id) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { branch: true, permissions: true },
    });

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      mobile: dbUser.mobile,
      role: dbUser.role as UserRole,
      organizationId: dbUser.organizationId,
      branchId: dbUser.branchId,
      branchName: dbUser.branch?.name || null,
      permissions: dbUser.permissions.map((p) => p.permission),
      agentId: dbUser.role === "AGENT" ? dbUser.id : null,
    };
  } catch (error) {
    return null;
  }
}

export function getUserDefaultPermissions(role: UserRole): string[] {
  switch (role) {
    case "ADMIN":
      return [...DEFAULT_ADMIN_PERMISSIONS];
    case "EMPLOYEE":
      return [...DEFAULT_EMPLOYEE_PERMISSIONS];
    case "AGENT":
      return [...DEFAULT_AGENT_PERMISSIONS];
    default:
      return [];
  }
}

export async function authenticateRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload || !payload.id) return null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { branch: true, permissions: true },
    });

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      mobile: dbUser.mobile,
      role: dbUser.role as UserRole,
      organizationId: dbUser.organizationId,
      branchId: dbUser.branchId,
      branchName: dbUser.branch?.name || null,
      permissions: dbUser.permissions.map((p) => p.permission),
      agentId: dbUser.role === "AGENT" ? dbUser.id : null,
    };
  } catch (e) {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<{ user: SessionUser } | NextResponse> {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }
  return { user };
}

export async function requirePermission(
  req: NextRequest,
  permission: string
): Promise<{ user: SessionUser } | NextResponse> {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  const { user } = auth;
  if (user.role === "ADMIN") return { user };

  if (!user.permissions || !user.permissions.includes(permission)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: `Permission '${permission}' denied` } },
      { status: 403 }
    );
  }
  return { user };
}
