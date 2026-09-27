import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import prisma from "@/lib/db";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.WHATSAPP_VIEW);
  if ("status" in auth) return auth;

  const url = new URL(req.url);
  const mobile = url.searchParams.get("mobile") || undefined;
  const workId = url.searchParams.get("workId") || undefined;
  const customerId = url.searchParams.get("customerId") || undefined;

  const where: any = {};
  if (mobile) where.recipientMobile = { contains: mobile };
  if (workId) where.workId = workId;
  if (customerId) where.customerId = customerId;

  try {
    const messages = await prisma.whatsAppMessage.findMany({
      where,
      include: {
        sentByUser: { select: { id: true, name: true } },
        work: { select: { id: true, workId: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
