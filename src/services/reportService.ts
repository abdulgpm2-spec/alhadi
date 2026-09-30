import prisma from "@/lib/db";
import { SessionUser } from "@/types";

export interface ReportFilterOptions {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  serviceId?: string;
  employeeId?: string;
  agentId?: string;
  status?: string;
  paymentMethod?: string;
  user: SessionUser;
}

export async function getCustomerReport(options: ReportFilterOptions) {
  const where: any = {
    organizationId: options.user.organizationId,
    isDeleted: false,
  };

  if (options.user.role === "AGENT") {
    where.agentId = options.user.id;
  } else {
    if (options.branchId) where.branchId = options.branchId;
    if (options.agentId) where.agentId = options.agentId;
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) where.createdAt.gte = new Date(options.startDate);
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      branch: { select: { name: true } },
      agent: { select: { name: true, businessName: true } },
      works: {
        include: { service: { select: { name: true } } },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCustomers = customers.length;
  const newCustomers = customers.filter((c) => c.works.length <= 1).length;
  const returningCustomers = totalCustomers - newCustomers;

  return {
    summary: {
      totalCustomers,
      newCustomers,
      returningCustomers,
    },
    rows: customers.map((c) => ({
      id: c.id,
      customerId: c.customerId,
      name: c.name,
      mobile: c.mobile,
      area: c.area || "-",
      branch: c.branch.name,
      agent: c.agent?.name || "-",
      workCount: c.works.length,
      totalSpent: c.payments.reduce((sum, p) => sum + p.amount, 0),
      totalBilled: c.works.reduce((sum, w) => sum + (Number(w.totalAmount) || 0), 0),
      totalCost: c.works.reduce((sum, w) => sum + (Number(w.serviceCost) || 0), 0),
      profit: c.works.reduce(
        (sum, w) => sum + ((Number(w.totalAmount) || 0) - (Number(w.serviceCost) || 0)),
        0
      ),
      createdAt: c.createdAt,
    })),
  };
}

export async function getWorkReport(options: ReportFilterOptions) {
  const where: any = {
    customer: { organizationId: options.user.organizationId },
  };

  if (options.user.role === "AGENT") {
    where.agentId = options.user.id;
  } else {
    if (options.branchId) where.branchId = options.branchId;
    if (options.agentId) where.agentId = options.agentId;
    if (options.employeeId) where.assignedUserId = options.employeeId;
  }

  if (options.serviceId) where.serviceId = options.serviceId;
  if (options.status) where.status = options.status;

  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) where.createdAt.gte = new Date(options.startDate);
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const works = await prisma.work.findMany({
    where,
    include: {
      customer: { select: { customerId: true, name: true, mobile: true } },
      service: { select: { name: true } },
      assignedUser: { select: { name: true } },
      agent: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalWorks = works.length;
  const completedWorks = works.filter((w) => ["COMPLETED", "DELIVERED"].includes(w.status)).length;
  const pendingWorks = totalWorks - completedWorks;
  const totalBilled = works.reduce((sum, w) => sum + w.totalAmount, 0);
  const totalCollected = works.reduce((sum, w) => sum + w.paidAmount, 0);
  const totalOutstanding = works.reduce((sum, w) => sum + w.pendingAmount, 0);

  return {
    summary: {
      totalWorks,
      completedWorks,
      pendingWorks,
      totalBilled,
      totalCollected,
      totalOutstanding,
      completionRate: totalWorks > 0 ? Math.round((completedWorks / totalWorks) * 100) : 0,
    },
    rows: works.map((w) => ({
      id: w.id,
      workId: w.workId,
      customerName: w.customer.name,
      customerMobile: w.customer.mobile,
      serviceName: w.service.name,
      status: w.status,
      priority: w.priority,
      totalAmount: w.totalAmount,
      paidAmount: w.paidAmount,
      pendingAmount: w.pendingAmount,
      assignedTo: w.assignedUser?.name || "-",
      agent: w.agent?.name || "-",
      dueDate: w.dueDate,
      createdAt: w.createdAt,
    })),
  };
}

export async function getFinancialReport(options: ReportFilterOptions) {
  const payWhere: any = { customer: { organizationId: options.user.organizationId } };
  const expWhere: any = { branch: { organizationId: options.user.organizationId }, isDeleted: false };

  if (options.branchId) {
    payWhere.branchId = options.branchId;
    expWhere.branchId = options.branchId;
  }
  if (options.paymentMethod) {
    payWhere.paymentMethod = options.paymentMethod;
    expWhere.paymentMethod = options.paymentMethod;
  }

  if (options.startDate || options.endDate) {
    payWhere.createdAt = {};
    expWhere.expenseDate = {};
    if (options.startDate) {
      payWhere.createdAt.gte = new Date(options.startDate);
      expWhere.expenseDate.gte = new Date(options.startDate);
    }
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      payWhere.createdAt.lte = end;
      expWhere.expenseDate.lte = end;
    }
  }

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: payWhere,
      include: {
        customer: { select: { name: true, mobile: true } },
        work: { select: { workId: true, service: { select: { name: true } } } },
        collectedByUser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: expWhere,
      include: {
        category: true,
        addedByUser: { select: { name: true } },
      },
      orderBy: { expenseDate: "desc" },
    }),
  ]);

  // Unit economics per service: billed minus snapshot service cost (govt fee + other).
  // Uses work records (billed basis), independent of shop overheads above.
  const workWhere: any = { customer: { organizationId: options.user.organizationId } };
  if (options.branchId) workWhere.branchId = options.branchId;
  if (options.serviceId) workWhere.serviceId = options.serviceId;
  if (options.agentId) workWhere.agentId = options.agentId;
  if (options.startDate || options.endDate) {
    workWhere.createdAt = {};
    if (options.startDate) workWhere.createdAt.gte = new Date(options.startDate);
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      workWhere.createdAt.lte = end;
    }
  }
  const serviceGroups = await prisma.work.groupBy({
    by: ["serviceId"],
    where: workWhere,
    _sum: { totalAmount: true, paidAmount: true, pendingAmount: true, serviceCost: true },
    _count: true,
  });
  const groupedServiceIds = serviceGroups.map((g) => g.serviceId);
  const groupedServices = groupedServiceIds.length
    ? await prisma.service.findMany({
        where: { id: { in: groupedServiceIds } },
        select: { id: true, name: true, category: { select: { name: true } } },
      })
    : [];
  const serviceNameOf = (id: string) => {
    const s = groupedServices.find((x) => x.id === id);
    return s ? { name: s.name, category: s.category?.name || "General" } : { name: "Unknown", category: "-" };
  };
  const profitByService = serviceGroups
    .map((g) => {
      const billed = g._sum.totalAmount || 0;
      const cost = g._sum.serviceCost || 0;
      return {
        serviceId: g.serviceId,
        ...serviceNameOf(g.serviceId),
        orders: g._count,
        billed,
        collected: g._sum.paidAmount || 0,
        pending: g._sum.pendingAmount || 0,
        cost,
        profit: billed - cost,
      };
    })
    .sort((a, b) => b.profit - a.profit);
  const totalServiceProfit = profitByService.reduce((sum, r) => sum + r.profit, 0);

  const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Breakdown by payment method
  const incomeByMethod: Record<string, number> = {};
  payments.forEach((p) => {
    incomeByMethod[p.paymentMethod] = (incomeByMethod[p.paymentMethod] || 0) + p.amount;
  });

  return {
    summary: {
      totalIncome,
      totalExpense,
      netProfit,
      incomeTransactions: payments.length,
      expenseTransactions: expenses.length,
      incomeByMethod,
      totalServiceProfit,
    },
    payments: payments.map((p) => ({
      id: p.id,
      paymentId: p.paymentId,
      customerName: p.customer.name,
      workId: p.work.workId,
      serviceName: p.work.service.name,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId || "-",
      collectedBy: p.collectedByUser?.name || "-",
      date: p.createdAt,
    })),
    expenses: expenses.map((e) => ({
      id: e.id,
      expenseId: e.expenseId,
      category: e.category.name,
      description: e.description,
      amount: e.amount,
      paymentMethod: e.paymentMethod,
      addedBy: e.addedByUser?.name || "-",
      date: e.expenseDate,
    })),
    profitByService,
  };
}
