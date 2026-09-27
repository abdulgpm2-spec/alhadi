import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { getBusinessSettings, updateBusinessSettings } from "@/services/settingService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  try {
    const settings = await getBusinessSettings(auth.user);
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.SETTINGS_UPDATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const updated = await updateBusinessSettings(body, auth.user);
    return NextResponse.json({
      success: true,
      data: updated,
      message: "Business settings saved successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
