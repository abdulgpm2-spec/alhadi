import prisma from "@/lib/db";
import { NotificationType } from "@/types";

export async function logActivity(params: {
  organizationId: string;
  branchId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  previousValue?: any;
  newValue?: any;
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        organizationId: params.organizationId,
        branchId: params.branchId || null,
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        previousValue: params.previousValue ? JSON.stringify(params.previousValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}

export async function createNotification(params: {
  userId?: string | null;
  branchId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) {
  try {
    // If specific user not provided, send to all admins and managers of the branch
    if (!params.userId) {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: "ADMIN",
          isActive: true,
        },
      });
      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            branchId: params.branchId || null,
            title: params.title,
            message: params.message,
            type: params.type,
            link: params.link || null,
          },
        });
      }
      return true;
    }

    return await prisma.notification.create({
      data: {
        userId: params.userId,
        branchId: params.branchId || null,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link || null,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Notify the full office team (all active Admins + Employees of the organization).
 * Used for agent submissions/uploads so nothing waits unseen.
 */
export async function notifyOfficeTeam(params: {
  organizationId: string;
  branchId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) {
  try {
    const staff = await prisma.user.findMany({
      where: {
        organizationId: params.organizationId,
        role: { in: ["ADMIN", "EMPLOYEE"] },
        isActive: true,
      },
      select: { id: true },
    });
    for (const member of staff) {
      await prisma.notification.create({
        data: {
          userId: member.id,
          branchId: params.branchId || null,
          title: params.title,
          message: params.message,
          type: params.type,
          link: params.link || null,
        },
      });
    }
    return true;
  } catch (error) {
    console.error("Failed to notify office team:", error);
    return null;
  }
}
