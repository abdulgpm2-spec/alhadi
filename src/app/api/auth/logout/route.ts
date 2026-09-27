import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
  response.cookies.delete("alhadi_session");
  return response;
}
