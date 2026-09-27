import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getWorks, getWorkSummary, createWork } from "@/services/workService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_VIEW);
  if ("status" in auth) return auth;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const priority = url.searchParams.get("priority") || undefined;
  const serviceId = url.searchParams.get("serviceId") || undefined;
  const customerId = url.searchParams.get("customerId") || undefined;
  const assignedUserId = url.searchParams.get("assignedUserId") || undefined;
  const agentId = url.searchParams.get("agentId") || undefined;
  const branchId = url.searchParams.get("branchId") || undefined;
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
  const summaryOnly = url.searchParams.get("summary") === "true";

  try {
    if (summaryOnly) {
      const summary = await getWorkSummary({ agentId, assignedUserId, startDate, endDate, user: auth.user });
      return NextResponse.json({ success: true, data: summary });
    }

    const result = await getWorks({
      search,
      status,
      priority,
      serviceId,
      customerId,
      assignedUserId,
      agentId,
      branchId,
      startDate,
      endDate,
      page,
      pageSize,
      user: auth.user,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_CREATE);
  if ("status" in auth) return auth;

  // Agents must use the one-shot apply flow (POST /api/work/apply) —
  // direct work creation for existing customers is staff-only.
  if (auth.user.role === "AGENT") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Agents must apply through a service (customer is created together).",
        },
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    if (!body.customerId || !body.serviceId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Customer and Service are required" } },
        { status: 400 }
      );
    }

    const work = await createWork({
      ...body,
      user: auth.user,
    });

    return NextResponse.json({
      success: true,
      data: work,
      message: "Work order created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
