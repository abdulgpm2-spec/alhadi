import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: auth.user.id, isRead: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: auth.user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (body.id) {
      await prisma.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true, message: "Notifications updated" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
