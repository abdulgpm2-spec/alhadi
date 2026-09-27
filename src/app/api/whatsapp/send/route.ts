import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { whatsAppService } from "@/services/whatsAppService";
import { PERMISSIONS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.WHATSAPP_SEND);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    const { mobile, message, templateCode, variables, customerId, workId } = body;

    if (!mobile) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Mobile number is required" } },
        { status: 400 }
      );
    }

    let result;
    if (templateCode && variables) {
      result = await whatsAppService.sendTemplate(mobile, templateCode, variables, {
        customerId,
        workId,
        sentByUserId: auth.user.id,
      });
    } else if (message) {
      result = await whatsAppService.sendMessage(mobile, message, {
        customerId,
        workId,
        sentByUserId: auth.user.id,
      });
    } else {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Message or Template is required" } },
        { status: 400 }
      );
    }

    const clickToChatUrl = whatsAppService.generateClickToChatUrl(
      mobile,
      (result as any).messageText || message || ""
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        clickToChatUrl,
      },
      message: "WhatsApp message dispatched successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SEND_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
