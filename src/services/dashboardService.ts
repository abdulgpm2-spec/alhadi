import prisma from "@/lib/db";
import { SessionUser } from "@/types";

export async function getDashboardStats(user: SessionUser, branchId?: string) {
  const orgId = user.organizationId;
  const isAgent = user.role === "AGENT";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
  const startDate7 = new Date(startOfToday);
  startDate7.setDate(startDate7.getDate() - 6);

  // Common where clauses
  const custWhere: any = { organizationId: orgId, isDeleted: false };
  const workWhere: any = { customer: { organizationId: orgId } };
  const payWhere: any = { customer: { organizationId: orgId } };
  const expWhere: any = { branch: { organizationId: orgId }, isDeleted: false };

  if (isAgent) {
    custWhere.agentId = user.id;
    workWhere.agentId = user.id;
    payWhere.work = { agentId: user.id };
  } else if (branchId) {
    custWhere.branchId = branchId;
    workWhere.branchId = branchId;
    payWhere.branchId = branchId;
    expWhere.branchId = branchId;
  }

  // Aggregate queries in parallel
  const [
    totalCustomers,
    todayCustomers,
    pendingWorkCount,
    completedWorkCount,
    totalWorkCount,
    todayIncomeResult,
    monthlyIncomeResult,
    totalIncomeResult,
    monthlyExpenseResult,
    totalExpenseResult,
    pendingPaymentsResult,
    recentWorks,
    recentActivities,
    statusBreakdown,
    serviceRevenueRaw,
    expensesByCategoryRaw,
    paymentTrendRaw,
    expenseTrendRaw,
  ] = await Promise.all([
    // Customer counts
    prisma.customer.count({ where: custWhere }),
    prisma.customer.count({ where: { ...custWhere, createdAt: { gte: startOfToday } } }),

    // Work counts
    prisma.work.count({
      where: {
        ...workWhere,
        status: { in: ["NEW", "DOCUMENTS_REQUIRED", "DOCUMENTS_RECEIVED", "IN_PROGRESS", "SUBMITTED", "UNDER_PROCESS", "ON_HOLD"] },
      },
    }),
    prisma.work.count({
      where: {
        ...workWhere,
        status: { in: ["COMPLETED", "DELIVERED"] },
      },
    }),
    prisma.work.count({ where: workWhere }),

    // Income
    prisma.payment.aggregate({
      where: { ...payWhere, createdAt: { gte: startOfToday } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { ...payWhere, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: payWhere,
      _sum: { amount: true },
    }),

    // Expenses
    prisma.expense.aggregate({
      where: { ...expWhere, expenseDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: expWhere,
      _sum: { amount: true },
    }),

    // Pending receivable balance
    prisma.work.aggregate({
      where: {
        ...workWhere,
        status: { notIn: ["CANCELLED", "DELIVERED"] },
      },
      _sum: { pendingAmount: true },
    }),

    // Recent work items
    prisma.work.findMany({
      where: workWhere,
      include: {
        customer: { select: { name: true, mobile: true } },
        service: { select: { name: true } },
        assignedUser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),

    // Recent activity log
    prisma.activityLog.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),

    // Work status counts
    prisma.work.groupBy({
      by: ["status"],
      where: workWhere,
      _count: { id: true },
    }),

    // Top services by revenue (aggregate at DB level instead of loading all rows)
    prisma.work.groupBy({
      by: ["serviceId"],
      where: workWhere,
      _sum: { paidAmount: true },
    }),

    // Expenses by category (aggregate at DB level instead of loading all rows)
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: expWhere,
      _sum: { amount: true },
    }),

    // 7-day trend: aggregate payments by day at DB level
    prisma.payment.groupBy({
      by: ["createdAt"],
      where: {
        ...payWhere,
        createdAt: { gte: startDate7 },
      },
      _sum: { amount: true },
    }),

    // 7-day trend: aggregate expenses by day at DB level
    prisma.expense.groupBy({
      by: ["expenseDate"],
      where: {
        ...expWhere,
        expenseDate: { gte: startDate7 },
      },
      _sum: { amount: true },
    }),
  ]);

  const todayIncome = todayIncomeResult._sum.amount || 0;
  const monthlyIncome = monthlyIncomeResult._sum.amount || 0;
  const totalIncome = totalIncomeResult._sum.amount || 0;
  const monthlyExpense = monthlyExpenseResult._sum.amount || 0;
  const totalExpense = totalExpenseResult._sum.amount || 0;
  const pendingPayments = pendingPaymentsResult._sum.pendingAmount || 0;
  const monthlyNetProfit = monthlyIncome - monthlyExpense;
  const totalNetProfit = totalIncome - totalExpense;

  // Format status breakdown
  const statusCounts: Record<string, number> = {};
  statusBreakdown.forEach((item) => {
    statusCounts[item.status] = item._count.id;
  });

  // Service name lookup for revenue breakdown
  const serviceIds = serviceRevenueRaw.map((item) => item.serviceId);
  const serviceNames = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true },
  });
  const serviceNameMap = new Map(serviceNames.map((s) => [s.id, s.name]));

  // Aggregate service revenue into a chart (DB-level sums, no full table load)
  const serviceRevenueChart = serviceRevenueRaw
    .map((item) => ({
      name: serviceNameMap.get(item.serviceId) || "Other",
      value: item._sum.paidAmount || 0,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Expense category lookup for breakdown
  const categoryIds = expensesByCategoryRaw.map((item) => item.categoryId);
  const expenseCategories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryNameMap = new Map(expenseCategories.map((c) => [c.id, c.name]));

  // Aggregate expense category breakdown (DB-level sums, no full table load)
  const expenseCategoryChart = expensesByCategoryRaw
    .map((item) => ({
      name: categoryNameMap.get(item.categoryId) || "Other",
      amount: item._sum.amount || 0,
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Generate 7-day trend data from the pre-aggregated parallel queries (no sequential DB calls)
  const incomeByDay = new Map<string, number>();
  for (const item of paymentTrendRaw) {
    const day = new Date(item.createdAt);
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    incomeByDay.set(key, (incomeByDay.get(key) || 0) + (item._sum.amount || 0));
  }

  const expenseByDay = new Map<string, number>();
  for (const item of expenseTrendRaw) {
    const day = new Date(item.expenseDate);
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    expenseByDay.set(key, (expenseByDay.get(key) || 0) + (item._sum.amount || 0));
  }

  const trendDays = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(startOfToday);
    dayStart.setDate(dayStart.getDate() - i);
    const dayStr = dayStart.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
    const key = `${dayStart.getFullYear()}-${dayStart.getMonth()}-${dayStart.getDate()}`;
    const dayIncome = incomeByDay.get(key) || 0;
    const dayExpense = expenseByDay.get(key) || 0;

    trendDays.push({
      date: dayStr,
      income: dayIncome,
      expense: dayExpense,
      profit: dayIncome - dayExpense,
    });
  }

  // Agents never see profit/loss or shop expenses — operational counts only.
  // (Their income figures above are already scoped to their own works.)
  const kpis: Record<string, any> = {
    totalCustomers,
    todayCustomers,
    pendingWorkCount,
    completedWorkCount,
    totalWorkCount,
    todayIncome,
    monthlyIncome,
    totalIncome,
    pendingPayments,
  };
  const charts: Record<string, any> = {
    incomeExpenseTrend: trendDays.map((d) => ({ date: d.date, income: d.income })),
    serviceRevenue: serviceRevenueChart,
    statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
  };
  if (!isAgent) {
    kpis.monthlyExpense = monthlyExpense;
    kpis.totalExpense = totalExpense;
    kpis.monthlyNetProfit = monthlyNetProfit;
    kpis.totalNetProfit = totalNetProfit;
    charts.incomeExpenseTrend = trendDays;
    charts.expenseBreakdown = expenseCategoryChart;
  }

  return {
    kpis,
    charts,
    recentWorks,
    recentActivities,
  };
}
