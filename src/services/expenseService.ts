import prisma from "@/lib/db";
import { generateExpenseId } from "@/lib/id-generator";
import { logActivity } from "@/services/auditService";
import { SessionUser, PaymentMethod } from "@/types";

export interface ExpenseFilterParams {
  search?: string;
  categoryId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  user: SessionUser;
}

export async function getExpenses(params: ExpenseFilterParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const whereClause: any = {
    isDeleted: false,
    branch: { organizationId: params.user.organizationId },
  };

  if (params.branchId) whereClause.branchId = params.branchId;
  if (params.categoryId) whereClause.categoryId = params.categoryId;

  if (params.startDate || params.endDate) {
    whereClause.expenseDate = {};
    if (params.startDate) whereClause.expenseDate.gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.expenseDate.lte = end;
    }
  }

  if (params.search) {
    const q = params.search.trim();
    whereClause.OR = [
      { expenseId: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, expenses, totalAmountResult] = await Promise.all([
    prisma.expense.count({ where: whereClause }),
    prisma.expense.findMany({
      where: whereClause,
      include: {
        category: true,
        branch: { select: { id: true, name: true } },
        addedByUser: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.expense.aggregate({
      where: whereClause,
      _sum: { amount: true },
    }),
  ]);

  return {
    data: expenses,
    summary: {
      totalAmount: totalAmountResult._sum.amount || 0,
    },
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getExpenseCategories() {
  return await prisma.expenseCategory.findMany({
    include: {
      _count: { select: { expenses: { where: { isDeleted: false } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createExpense(data: {
  categoryId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  expenseDate?: string | Date;
  notes?: string;
  branchId?: string;
  user: SessionUser;
}) {
  const numericAmount = Number(data.amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Expense amount must be positive");
  }

  const expenseId = await generateExpenseId();
  const branchId = data.branchId || data.user.branchId || (await prisma.branch.findFirst({ where: { organizationId: data.user.organizationId } }))?.id;

  if (!branchId) {
    throw new Error("Branch required for expense");
  }

  const expense = await prisma.expense.create({
    data: {
      expenseId,
      categoryId: data.categoryId,
      branchId,
      addedByUserId: data.user.id,
      amount: numericAmount,
      paymentMethod: data.paymentMethod,
      description: data.description.trim(),
      notes: data.notes?.trim() || null,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
    },
    include: { category: true },
  });

  await logActivity({
    organizationId: data.user.organizationId,
    branchId,
    userId: data.user.id,
    action: "EXPENSE_CREATED",
    entity: "Expense",
    entityId: expense.id,
    metadata: { expenseId: expense.expenseId, category: expense.category.name, amount: numericAmount },
  });

  return expense;
}

export async function softDeleteExpense(id: string, user: SessionUser) {
  const existing = await prisma.expense.findFirst({
    where: {
      id,
      branch: { organizationId: user.organizationId },
      isDeleted: false,
    },
  });

  if (!existing) {
    throw new Error("Expense not found");
  }

  const deleted = await prisma.expense.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await logActivity({
    organizationId: user.organizationId,
    branchId: existing.branchId,
    userId: user.id,
    action: "EXPENSE_DELETED",
    entity: "Expense",
    entityId: id,
    previousValue: existing,
  });

  return deleted;
}
