import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getExpenses, createExpense } from "@/services/expenseService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.EXPENSES_VIEW);
  if ("status" in auth) return auth;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const branchId = url.searchParams.get("branchId") || undefined;
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

  try {
    const result = await getExpenses({
      search,
      categoryId,
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
  const auth = await requirePermission(req, PERMISSIONS.EXPENSES_CREATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    if (!body.categoryId || !body.amount || !body.description || !body.paymentMethod) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Category, amount, description, and payment method are required" } },
        { status: 400 }
      );
    }

    const expense = await createExpense({
      ...body,
      user: auth.user,
    });

    return NextResponse.json({
      success: true,
      data: expense,
      message: "Expense recorded successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
