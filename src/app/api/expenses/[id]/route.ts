import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { softDeleteExpense } from "@/services/expenseService";
import { PERMISSIONS } from "@/lib/constants";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.EXPENSES_DELETE);
  if ("status" in auth) return auth;

  try {
    await softDeleteExpense(params.id, auth.user);
    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
