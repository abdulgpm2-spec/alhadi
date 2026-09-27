import prisma from "@/lib/db";
import { SessionUser } from "@/types";

export async function getReceipts(params: {
  search?: string;
  customerId?: string;
  workId?: string;
  page?: number;
  pageSize?: number;
  user: SessionUser;
}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const whereClause: any = {
    customer: { organizationId: params.user.organizationId },
  };

  if (params.user.role === "AGENT") {
    whereClause.work = { agentId: params.user.id };
  }

  if (params.customerId) whereClause.customerId = params.customerId;
  if (params.workId) whereClause.workId = params.workId;

  if (params.search) {
    const q = params.search.trim();
    whereClause.OR = [
      { receiptNumber: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { mobile: { contains: q } } },
      { work: { workId: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, receipts] = await Promise.all([
    prisma.receipt.count({ where: whereClause }),
    prisma.receipt.findMany({
      where: whereClause,
      include: {
        customer: true,
        work: {
          include: {
            service: true,
            branch: true,
          },
        },
        payment: {
          include: {
            collectedByUser: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: receipts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getReceiptById(id: string, user: SessionUser) {
  return await prisma.receipt.findFirst({
    where: {
      id,
      customer: { organizationId: user.organizationId },
      ...(user.role === "AGENT" ? { work: { agentId: user.id } } : {}),
    },
    include: {
      customer: true,
      work: {
        include: {
          service: true,
          branch: true,
        },
      },
      payment: {
        include: {
          collectedByUser: { select: { id: true, name: true, email: true, mobile: true } },
          branch: true,
        },
      },
    },
  });
}
