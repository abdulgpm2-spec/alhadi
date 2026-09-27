import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getPayments, createPayment } from "@/services/paymentService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.PAYMENTS_VIEW);
  if ("status" in auth) return auth;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const paymentMethod = url.searchParams.get("paymentMethod") || undefined;
  const workId = url.searchParams.get("workId") || undefined;
  const customerId = url.searchParams.get("customerId") || undefined;
  const branchId = url.searchParams.get("branchId") || undefined;
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

  try {
    const result = await getPayments({
      search,
      paymentMethod,
      workId,
      customerId,
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
  const auth = await requirePermission(req, PERMISSIONS.PAYMENTS_CREATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    if (!body.workId || body.amount === undefined || !body.paymentMethod) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Work ID, amount, and payment method are required" } },
        { status: 400 }
      );
    }

    const result = await createPayment({
      ...body,
      user: auth.user,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Payment processed and receipt generated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "PAYMENT_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
