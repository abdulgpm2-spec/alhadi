import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { performGlobalSearch } from "@/services/searchService";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  try {
    const results = await performGlobalSearch(q, auth.user);
    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SEARCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
