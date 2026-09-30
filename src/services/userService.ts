import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { logActivity } from "@/services/auditService";
import { SessionUser, UserRole } from "@/types";
import { getUserDefaultPermissions } from "@/lib/auth";

export async function getEmployees(user: SessionUser) {
  const employees = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      role: "EMPLOYEE",
    },
    include: {
      branch: true,
      permissions: { select: { permission: true } },
      subordinates: { select: { id: true, name: true, businessName: true }, orderBy: { name: "asc" } },
      assignedWorks: {
        select: { id: true, status: true, totalAmount: true, paidAmount: true },
      },
      collectedPayments: {
        select: { id: true, amount: true },
      },
      _count: {
        select: { assignedWorks: true, collectedPayments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return employees.map((emp) => {
    const assignedCount = emp.assignedWorks.length;
    const completedCount = emp.assignedWorks.filter((w) => ["COMPLETED", "DELIVERED"].includes(w.status)).length;
    const pendingCount = assignedCount - completedCount;
    const totalCollected = emp.collectedPayments.reduce((acc, p) => acc + p.amount, 0);

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      mobile: emp.mobile,
      role: emp.role,
      isActive: emp.isActive,
      branch: emp.branch,
      permissions: emp.permissions.map((p) => p.permission),
      agentCount: emp.subordinates.length,
      agentNames: emp.subordinates.map((s) => s.businessName && s.businessName !== "-" ? s.businessName : s.name),
      assignedCount,
      completedCount,
      pendingCount,
      totalCollected,
      createdAt: emp.createdAt,
    };
  });
}

export async function getAgents(user: SessionUser) {
  const agents = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      role: "AGENT",
    },
    include: {
      branch: true,
      permissions: { select: { permission: true } },
      supervisor: { select: { id: true, name: true } },
      agentCustomers: { where: { isDeleted: false }, select: { id: true } },
      agentWorks: {
        select: { id: true, status: true, totalAmount: true, paidAmount: true, serviceCost: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return agents.map((ag) => {
    const customerCount = ag.agentCustomers.length;
    const workCount = ag.agentWorks.length;
    const completedCount = ag.agentWorks.filter((w) => ["COMPLETED", "DELIVERED"].includes(w.status)).length;
    const pendingCount = workCount - completedCount;
    const totalRevenue = ag.agentWorks.reduce((acc, w) => acc + w.paidAmount, 0);
    const totalCost = ag.agentWorks.reduce((acc, w) => acc + (Number(w.serviceCost) || 0), 0);
    const totalBilled = ag.agentWorks.reduce((acc, w) => acc + w.totalAmount, 0);

    return {
      id: ag.id,
      name: ag.name,
      email: ag.email,
      mobile: ag.mobile,
      businessName: ag.businessName || "-",
      supervisorId: ag.supervisorId || null,
      supervisorName: ag.supervisor?.name || null,
      isActive: ag.isActive,
      role: ag.role,
      branch: ag.branch,
      permissions: ag.permissions.map((p) => p.permission),
      customerCount,
      workCount,
      completedCount,
      pendingCount,
      totalRevenue,
      totalCost,
      totalBilled,
      profit: totalBilled - totalCost,
      createdAt: ag.createdAt,
    };
  });
}

/**
 * Minimal agent list for assignment dropdowns, strictly scoped:
 * ADMIN → all agents; EMPLOYEE → only agents reporting to them; AGENT → self.
 * No revenue/commission data — directory fields only.
 */
export async function getSupervisedAgents(user: SessionUser) {
  const where: any = { organizationId: user.organizationId, role: "AGENT", isActive: true };
  if (user.role === "EMPLOYEE") {
    where.supervisorId = user.id;
  } else if (user.role === "AGENT") {
    where.id = user.id;
  } else if (user.role !== "ADMIN") {
    return [];
  }

  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      businessName: true,
      mobile: true,
      supervisorId: true,
      supervisor: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  mobile?: string;
  password?: string;
  role: UserRole;
  branchId?: string;
  businessName?: string;
  supervisorId?: string | null;
  user: SessionUser;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existing) {
    throw new Error("A user with this email address already exists");
  }

  const defaultPassword = data.password || (data.role === "ADMIN" ? "Admin@123456" : data.role === "EMPLOYEE" ? "Employee@123456" : "Agent@123456");
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const branchId = data.branchId || data.user.branchId || (await prisma.branch.findFirst({ where: { organizationId: data.user.organizationId } }))?.id;

  // Supervisor chain: only AGENTs work under an Employee. Validate target.
  let supervisorId: string | null = null;
  if (data.role === "AGENT" && data.supervisorId) {
    const sup = await prisma.user.findFirst({
      where: { id: data.supervisorId, organizationId: data.user.organizationId, role: "EMPLOYEE", isActive: true },
      select: { id: true },
    });
    if (!sup) throw new Error("Selected supervisor must be an active Employee.");
    supervisorId = sup.id;
  }

  const newUser = await prisma.user.create({
    data: {
      organizationId: data.user.organizationId,
      branchId,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      mobile: data.mobile?.trim() || null,
      passwordHash,
      role: data.role,
      businessName: data.businessName?.trim() || null,
      supervisorId,
      isActive: true,
    },
  });

  // Assign default permissions based on role
  const permissions = getUserDefaultPermissions(data.role);
  for (const perm of permissions) {
    await prisma.userPermission.create({
      data: {
        userId: newUser.id,
        permission: perm,
      },
    });
  }

  await logActivity({
    organizationId: data.user.organizationId,
    branchId,
    userId: data.user.id,
    action: `${data.role}_CREATED`,
    entity: "User",
    entityId: newUser.id,
    metadata: { name: newUser.name, email: newUser.email, role: newUser.role },
  });

  return newUser;
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    mobile: string;
    isActive: boolean;
    branchId: string;
    businessName: string;
    supervisorId: string | null;
    password?: string;
  }>,
  currentUser: SessionUser
) {
  const existing = await prisma.user.findFirst({
    where: { id, organizationId: currentUser.organizationId },
  });

  if (!existing) {
    throw new Error("User not found");
  }

  let passwordHash = undefined;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  // Supervisor mapping is Admin-only and only meaningful for AGENTs.
  let supervisorId: string | null | undefined = undefined;
  if (data.supervisorId !== undefined) {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Only an administrator can change agent supervisor mapping.");
    }
    if (existing.role !== "AGENT") {
      throw new Error("Supervisor mapping applies to Agent accounts only.");
    }
    if (data.supervisorId) {
      const sup = await prisma.user.findFirst({
        where: { id: data.supervisorId, organizationId: currentUser.organizationId, role: "EMPLOYEE", isActive: true },
        select: { id: true },
      });
      if (!sup) throw new Error("Selected supervisor must be an active Employee.");
      supervisorId = sup.id;
    } else {
      supervisorId = null;
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      email: data.email !== undefined ? data.email.toLowerCase().trim() : undefined,
      mobile: data.mobile !== undefined ? data.mobile.trim() : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
      branchId: data.branchId !== undefined ? data.branchId : undefined,
      businessName: data.businessName !== undefined ? data.businessName.trim() : undefined,
      supervisorId,
      passwordHash,
    },
  });

  await logActivity({
    organizationId: currentUser.organizationId,
    userId: currentUser.id,
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    previousValue: { name: existing.name, role: existing.role, isActive: existing.isActive },
    newValue: { name: updated.name, role: updated.role, isActive: updated.isActive },
  });

  return updated;
}

/**
 * Permanently removes a user (Admin only). Blocked when business records
 * reference the user — deactivate instead in that case.
 */
export async function deleteUser(id: string, currentUser: SessionUser) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Only an administrator can remove users.");
  }
  if (id === currentUser.id) {
    throw new Error("You cannot remove your own account.");
  }

  const existing = await prisma.user.findFirst({
    where: { id, organizationId: currentUser.organizationId },
    include: {
      _count: {
        select: {
          assignedWorks: true,
          agentWorks: true,
          agentCustomers: true,
          createdCustomers: true,
          expenses: true,
          subordinates: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("User not found.");
  }
  if (existing.role === "ADMIN") {
    throw new Error("Administrator accounts cannot be removed. Deactivate instead if needed.");
  }

  const c = existing._count;
  const blockers: string[] = [];
  if (c.assignedWorks > 0) blockers.push(`${c.assignedWorks} assigned work order(s)`);
  if (c.agentWorks > 0) blockers.push(`${c.agentWorks} agent work order(s)`);
  if (c.agentCustomers > 0) blockers.push(`${c.agentCustomers} agent customer(s)`);
  if (c.createdCustomers > 0) blockers.push(`${c.createdCustomers} created customer(s)`);
  if (c.expenses > 0) blockers.push(`${c.expenses} expense record(s)`);
  if (c.subordinates > 0) blockers.push(`${c.subordinates} reporting agent(s)`);
  if (blockers.length > 0) {
    throw new Error(
      `Cannot remove "${existing.name}" — linked to ${blockers.join(", ")}. Deactivate the account instead to preserve history.`
    );
  }

  await prisma.$transaction([
    prisma.userPermission.deleteMany({ where: { userId: id } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  await logActivity({
    organizationId: currentUser.organizationId,
    userId: currentUser.id,
    action: "USER_DELETED",
    entity: "User",
    entityId: id,
    metadata: { name: existing.name, role: existing.role, email: existing.email },
  });

  return { id, name: existing.name };
}

/**
 * Lists every user in the organization (across all roles) together with their
 * current permissions. Used by the Admin Permission Management module.
 */
export async function getAllUsersForPermissions(currentUser: SessionUser) {
  const users = await prisma.user.findMany({
    where: { organizationId: currentUser.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      isActive: true,
      businessName: true,
      createdAt: true,
      permissions: { select: { permission: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    mobile: u.mobile,
    role: u.role,
    isActive: u.isActive,
    businessName: u.businessName,
    createdAt: u.createdAt,
    permissions: u.permissions.map((p) => p.permission),
  }));
}

export async function getUserPermissions(id: string, currentUser: SessionUser) {
  const target = await prisma.user.findFirst({
    where: { id, organizationId: currentUser.organizationId },
    include: { permissions: { select: { permission: true } } },
  });

  if (!target) {
    throw new Error("User not found");
  }

  return {
    id: target.id,
    name: target.name,
    email: target.email,
    role: target.role,
    isActive: target.isActive,
    permissions: target.permissions.map((p) => p.permission),
  };
}

/**
 * Replaces the full permission set for a user. Admin actor required.
 * The ADMIN user's own record is always kept at full rights (role bypass),
 * so this is primarily for EMPLOYEE / AGENT accounts.
 */
export async function setUserPermissions(
  id: string,
  permissions: string[],
  currentUser: SessionUser
) {
  const target = await prisma.user.findFirst({
    where: { id, organizationId: currentUser.organizationId },
  });

  if (!target) {
    throw new Error("User not found");
  }

  if (currentUser.role !== "ADMIN") {
    throw new Error("Only an administrator can change user permissions");
  }

  const deduped = Array.from(new Set(permissions));

  await prisma.$transaction([
    prisma.userPermission.deleteMany({ where: { userId: id } }),
    ...deduped.map((permission) =>
      prisma.userPermission.create({
        data: { userId: id, permission },
      })
    ),
  ]);

  await logActivity({
    organizationId: currentUser.organizationId,
    userId: currentUser.id,
    action: "USER_PERMISSIONS_UPDATED",
    entity: "User",
    entityId: id,
    previousValue: { name: target.name, role: target.role },
    newValue: { name: target.name, role: target.role, permissionCount: deduped.length },
    metadata: { permissions: deduped },
  });

  return {
    id,
    name: target.name,
    role: target.role,
    permissions: deduped,
  };
}
