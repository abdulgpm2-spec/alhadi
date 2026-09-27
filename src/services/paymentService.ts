import prisma from "@/lib/db";
import { generatePaymentId, generateReceiptNumber } from "@/lib/id-generator";
import { logActivity, createNotification } from "@/services/auditService";
import { SessionUser, PaymentMethod } from "@/types";

export interface PaymentFilterParams {
  search?: string;
  workId?: string;
  customerId?: string;
  paymentMethod?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  user: SessionUser;
}

export async function getPayments(params: PaymentFilterParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const whereClause: any = {
    customer: { organizationId: params.user.organizationId },
  };

  if (params.user.role === "AGENT") {
    whereClause.work = { agentId: params.user.id };
  } else if (params.branchId) {
    whereClause.branchId = params.branchId;
  }

  if (params.paymentMethod) whereClause.paymentMethod = params.paymentMethod;
  if (params.workId) whereClause.workId = params.workId;
  if (params.customerId) whereClause.customerId = params.customerId;

  if (params.startDate || params.endDate) {
    whereClause.createdAt = {};
    if (params.startDate) whereClause.createdAt.gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = end;
    }
  }

  if (params.search) {
    const q = params.search.trim();
    whereClause.OR = [
      { paymentId: { contains: q, mode: "insensitive" } },
      { transactionId: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { mobile: { contains: q } } },
      { work: { workId: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where: whereClause }),
    prisma.payment.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, customerId: true, name: true, mobile: true } },
        work: { select: { id: true, workId: true, totalAmount: true, paidAmount: true, pendingAmount: true, service: { select: { name: true } } } },
        collectedByUser: { select: { id: true, name: true } },
        receipt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: payments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function createPayment(data: {
  workId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  user: SessionUser;
}) {
  const numericAmount = Number(data.amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const work = await prisma.work.findFirst({
    where: {
      id: data.workId,
      customer: { organizationId: data.user.organizationId },
    },
    include: {
      customer: true,
      service: true,
    },
  });

  if (!work) {
    throw new Error("Work order not found");
  }

  if (numericAmount > work.pendingAmount && data.user.role !== "ADMIN") {
    throw new Error(`Payment of ₹${numericAmount} exceeds outstanding balance of ₹${work.pendingAmount}`);
  }

  const paymentId = await generatePaymentId();
  const receiptNumber = await generateReceiptNumber();

  const newPaidAmount = work.paidAmount + numericAmount;
  const newPendingAmount = Math.max(0, work.totalAmount - newPaidAmount);
  const paymentStatus = newPendingAmount === 0 ? "PAID" : "PARTIAL";

  // Execute database transaction to guarantee financial consistency
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Payment
    const payment = await tx.payment.create({
      data: {
        paymentId,
        workId: work.id,
        customerId: work.customerId,
        branchId: work.branchId,
        collectedByUserId: data.user.id,
        amount: numericAmount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId?.trim() || null,
        status: paymentStatus,
        notes: data.notes?.trim() || null,
      },
    });

    // 2. Update Work record
    const updatedWork = await tx.work.update({
      where: { id: work.id },
      data: {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
      },
    });

    // 3. Create Receipt
    const receipt = await tx.receipt.create({
      data: {
        receiptNumber,
        paymentId: payment.id,
        workId: work.id,
        customerId: work.customerId,
        totalAmount: work.totalAmount,
        paidAmount: numericAmount,
        pendingAmount: newPendingAmount,
        notes: data.notes?.trim() || null,
      },
    });

    return { payment, updatedWork, receipt };
  });

  // Post-transaction logging
  await logActivity({
    organizationId: data.user.organizationId,
    branchId: work.branchId,
    userId: data.user.id,
    action: "PAYMENT_CREATED",
    entity: "Payment",
    entityId: result.payment.id,
    metadata: {
      paymentId: result.payment.paymentId,
      receiptNumber: result.receipt.receiptNumber,
      amount: numericAmount,
      workId: work.workId,
      customerName: work.customer.name,
    },
  });

  await createNotification({
    branchId: work.branchId,
    title: `Payment Received: ₹${numericAmount}`,
    message: `Received ₹${numericAmount} for ${work.workId} (${work.customer.name}) via ${data.paymentMethod}`,
    type: "PAYMENT_RECEIVED",
    link: `/receipts/${result.receipt.id}`,
  });

  return result;
}
