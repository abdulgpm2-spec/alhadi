import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getExpenseCategories } from "@/services/expenseService";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  try {
    const categories = await getExpenseCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
