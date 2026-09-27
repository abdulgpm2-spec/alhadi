import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { getCustomers, createCustomer } from "@/services/customerService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CUSTOMERS_VIEW);
  if ("status" in auth) return auth;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const branchId = url.searchParams.get("branchId") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
  const gender = url.searchParams.get("gender") || undefined;
  const city = url.searchParams.get("city") || undefined;

  try {
    const result = await getCustomers({
      search,
      branchId,
      page,
      pageSize,
      gender,
      city,
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
  const auth = await requirePermission(req, PERMISSIONS.CUSTOMERS_CREATE);
  if ("status" in auth) return auth;

  // Agents cannot register customers directly — they use the service-apply flow
  // (POST /api/work/apply) which creates the customer together with the work order.
  if (auth.user.role === "AGENT") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Agents cannot register customers directly. Please apply through a service.",
        },
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    if (!body.name || !body.mobile) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Name and mobile number are required" } },
        { status: 400 }
      );
    }

    const customer = await createCustomer({
      name: body.name,
      mobile: body.mobile,
      email: body.email,
      address: body.address,
      state: body.state,
      pincode: body.pincode,
      branchId: body.branchId,
      agentId: body.agentId,
      employeeId: body.employeeId,
      serviceIds: body.serviceIds,
      serviceCorrections: body.serviceCorrections,
      customFieldValues: body.customFieldValues,
      advanceAmount: body.advanceAmount !== undefined ? Number(body.advanceAmount) : undefined,
      advanceMethod: body.advanceMethod === "UPI" ? "UPI" : "CASH",
      totalAmount: body.totalAmount !== undefined ? Number(body.totalAmount) : undefined,
      user: auth.user,
    });

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Customer created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
