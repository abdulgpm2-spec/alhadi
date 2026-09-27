import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { user },
  });
}
