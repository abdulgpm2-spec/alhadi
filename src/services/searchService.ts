import prisma from "@/lib/db";
import { SessionUser } from "@/types";

export async function performGlobalSearch(query: string, user: SessionUser) {
  if (!query || query.trim().length < 2) {
    return {
      customers: [],
      works: [],
      payments: [],
      receipts: [],
      services: [],
    };
  }

  const q = query.trim();
  const orgId = user.organizationId;
  const isAgent = user.role === "AGENT";

  const [customers, works, payments, receipts, services] = await Promise.all([
    // Customers
    prisma.customer.findMany({
      where: {
        organizationId: orgId,
        isDeleted: false,
        ...(isAgent ? { agentId: user.id } : {}),
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { mobile: { contains: q } },
          { customerId: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, customerId: true, name: true, mobile: true, area: true },
      take: 6,
    }),

    // Work Orders
    prisma.work.findMany({
      where: {
        customer: { organizationId: orgId },
        ...(isAgent ? { agentId: user.id } : {}),
        OR: [
          { workId: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { service: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        workId: true,
        status: true,
        customer: { select: { name: true, mobile: true } },
        service: { select: { name: true } },
      },
      take: 6,
    }),

    // Payments
    prisma.payment.findMany({
      where: {
        customer: { organizationId: orgId },
        ...(isAgent ? { work: { agentId: user.id } } : {}),
        OR: [
          { paymentId: { contains: q, mode: "insensitive" } },
          { transactionId: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        paymentId: true,
        amount: true,
        paymentMethod: true,
        customer: { select: { name: true } },
      },
      take: 5,
    }),

    // Receipts
    prisma.receipt.findMany({
      where: {
        customer: { organizationId: orgId },
        ...(isAgent ? { work: { agentId: user.id } } : {}),
        OR: [
          { receiptNumber: { contains: q } },
          { customer: { name: { contains: q } } },
        ],
      },
      select: {
        id: true,
        receiptNumber: true,
        paidAmount: true,
        customer: { select: { name: true } },
      },
      take: 5,
    }),

    // Services
    prisma.service.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        name: true,
        customerPrice: true,
        category: { select: { name: true } },
      },
      take: 5,
    }),
  ]);

  return {
    customers,
    works,
    payments,
    receipts,
    services,
  };
}
