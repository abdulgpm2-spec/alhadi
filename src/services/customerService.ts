import prisma from "@/lib/db";
import { generateCustomerId, generateWorkId } from "@/lib/id-generator";
import { logActivity } from "@/services/auditService";
import { createPayment } from "@/services/paymentService";
import { agentRateOf } from "@/services/serviceCatalogService";
import { resolveCustomFieldValues } from "@/services/workService";
import { SessionUser } from "@/types";

export interface CustomerFilterParams {
  search?: string;
  branchId?: string;
  page?: number;
  pageSize?: number;
  gender?: string;
  city?: string;
  user: SessionUser;
}

export async function getCustomers(params: CustomerFilterParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const whereClause: any = {
    isDeleted: false,
    organizationId: params.user.organizationId,
  };

  // AGENT isolation: Agent can only see their own customers
  if (params.user.role === "AGENT") {
    whereClause.agentId = params.user.id;
  } else if (params.branchId) {
    whereClause.branchId = params.branchId;
  }

  if (params.gender) {
    whereClause.gender = params.gender;
  }
  if (params.city) {
    whereClause.city = { contains: params.city, mode: "insensitive" };
  }

  if (params.search) {
    const q = params.search.trim();
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q } },
      { customerId: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where: whereClause }),
    prisma.customer.findMany({
      where: whereClause,
      include: {
        agent: { select: { id: true, name: true, businessName: true } },
        branch: { select: { id: true, name: true } },
        works: {
          include: {
            service: { select: { id: true, name: true, category: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            works: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: customers,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getCustomerById(id: string, user: SessionUser) {
  const customer = await prisma.customer.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      isDeleted: false,
      ...(user.role === "AGENT" ? { agentId: user.id } : {}),
    },
    include: {
      branch: true,
      agent: { select: { id: true, name: true, businessName: true, mobile: true } },
      createdBy: { select: { id: true, name: true } },
      works: {
        include: {
          service: {
            include: {
              requiredDocuments: true,
            },
          },
          assignedUser: { select: { id: true, name: true } },
          documents: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: {
          work: { include: { service: { select: { id: true, name: true, category: { select: { name: true } } } } } },
          receipt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      receipts: {
        include: {
          work: { include: { service: { select: { id: true, name: true, category: { select: { name: true } } } } } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      },
      fileAssets: {
        where: { documentType: "CUSTOMER_PHOTO", isCurrent: true },
        include: {
          uploader: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) return null;

  // Retrieve activity logs for this customer
  const activityLogs = await prisma.activityLog.findMany({
    where: {
      entity: "Customer",
      entityId: customer.id,
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { ...customer, activityLogs };
}

export async function createCustomer(data: {
  name: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  dob?: string | Date;
  gender?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
  branchId?: string;
  agentId?: string;
  employeeId?: string;
  serviceIds?: string[];
  serviceCorrections?: Record<string, string[]>;
  advanceAmount?: number;
  advanceMethod?: string;
  totalAmount?: number;
  documentPassword?: string;
  customFieldValues?: Array<{ fieldKey: string; value?: string; valueMr?: string }>;
  user: SessionUser;
}) {
  const customerId = await generateCustomerId();

  // Resolve valid organization
  let organizationId: string = data.user.organizationId;
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    const fallbackOrg = await prisma.organization.findFirst();
    if (!fallbackOrg) throw new Error("Organization not found in database");
    organizationId = fallbackOrg.id;
  }

  // Resolve valid branch
  let validBranchId: string;
  const requestedBranchId = data.branchId || data.user.branchId;
  const br = requestedBranchId ? await prisma.branch.findUnique({ where: { id: requestedBranchId } }) : null;
  if (br) {
    validBranchId = br.id;
  } else {
    const fallbackBranch = await prisma.branch.findFirst({ where: { organizationId } });
    if (!fallbackBranch) throw new Error("Branch not found in database");
    validBranchId = fallbackBranch.id;
  }

  // ---- Ownership assignment (role-based, server-enforced) ----
  // AGENT: own customers only (tagged to self + own supervisor).
  // EMPLOYEE: only customers of agents working under them (supervisorId == self).
  // ADMIN: any agent + any employee; agent's supervisor shown/auto-filled in UI.
  let resolvedAgentId: string | null = null;
  let resolvedEmployeeId: string | null = null;
  const myRole = data.user.role;

  if (myRole === "AGENT") {
    resolvedAgentId = data.user.id;
    const meRow = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { supervisorId: true },
    });
    resolvedEmployeeId = meRow?.supervisorId || null;
  } else if (myRole === "EMPLOYEE") {
    // Agent optional: staff adds own direct customers AND their agents' customers.
    if (data.agentId) {
      const owned = await prisma.user.findFirst({
        where: {
          id: data.agentId,
          organizationId,
          role: "AGENT",
          isActive: true,
          supervisorId: data.user.id,
        },
        select: { id: true },
      });
      if (!owned) {
        throw new Error("Selected agent does not work under you. Only your agents' customers can be tagged to them.");
      }
      resolvedAgentId = owned.id;
    } else {
      resolvedAgentId = null;
    }
    resolvedEmployeeId = data.user.id;
  } else {
    // ADMIN
    if (data.agentId) {
      const ag = await prisma.user.findFirst({
        where: { id: data.agentId, organizationId, role: "AGENT", isActive: true },
        select: { id: true, supervisorId: true },
      });
      if (!ag) throw new Error("Selected agent is invalid.");
      resolvedAgentId = ag.id;
      resolvedEmployeeId = ag.supervisorId || null;
    }
    if (data.employeeId) {
      const emp = await prisma.user.findFirst({
        where: { id: data.employeeId, organizationId, role: "EMPLOYEE", isActive: true },
        select: { id: true },
      });
      if (!emp) throw new Error("Selected employee is invalid.");
      resolvedEmployeeId = emp.id;
    }
  }

  const customer = await prisma.customer.create({
    data: {
      customerId,
      organizationId,
      branchId: validBranchId,
      createdById: data.user.id,
      agentId: resolvedAgentId,
      employeeId: resolvedEmployeeId,
      name: data.name.trim(),
      mobile: data.mobile.trim(),
      alternateMobile: data.alternateMobile?.trim() || null,
      email: data.email?.trim() || null,
      dob: data.dob ? new Date(data.dob) : null,
      gender: data.gender || "Male",
      address: data.address?.trim() || null,
      area: data.area?.trim() || null,
      city: data.city?.trim() || "Center City",
      state: data.state?.trim() || "Maharashtra",
      pincode: data.pincode?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });

  // Fetch selected services in order (master prices = source of truth)
  const serviceIds = Array.isArray(data.serviceIds) ? data.serviceIds : [];
  const correctionsByService: Record<string, string[]> =
    data.serviceCorrections && typeof data.serviceCorrections === "object" ? data.serviceCorrections : {};
  const createdWorks: Array<{ id: string; totalAmount: number }> = [];
  const advanceMethod = data.advanceMethod === "UPI" ? "UPI" : "CASH";
  const enrollments: Array<{
    id: string;
    name: string;
    customerPrice: number;
    govtFee: number;
    otherCost: number;
    estimatedDays: number;
    requiredDocuments: Array<{ name: string }>;
    correctionOptions: Array<{ id: string; name: string; isActive: boolean }>;
  }> = [];
  for (const sId of serviceIds) {
    const srv = await prisma.service.findFirst({
      where: { id: sId, organizationId },
      include: { requiredDocuments: true, correctionOptions: true, customFields: true },
    });
    if (srv) enrollments.push(srv);
  }

  // Custom total (operator-edited) is split proportionally by master price.
  // Falls back to master prices when not provided. Rounding fixed on last work.
  const customTotalRaw = data.totalAmount !== undefined ? Number(data.totalAmount) : NaN;
  const useCustomTotal = enrollments.length > 0 && !isNaN(customTotalRaw) && customTotalRaw > 0;
  if (enrollments.length > 0 && data.totalAmount !== undefined && !(customTotalRaw > 0)) {
    throw new Error("Total payment must be greater than zero when services are selected.");
  }
  const masterSum = enrollments.reduce(
    (sum, s) => sum + (data.user.role === "AGENT" ? agentRateOf(s) : Number(s.customerPrice) || 0),
    0
  );
  const effectiveTotal = useCustomTotal
    ? Math.round(customTotalRaw * 100) / 100
    : Math.round(masterSum * 100) / 100;

  const round2 = (n: number) => Math.round(n * 100) / 100;
  let assigned = 0;
  const shares = enrollments.map((srv, i) => {
    const unitPrice = data.user.role === "AGENT" ? agentRateOf(srv) : Number(srv.customerPrice) || 0;
    if (!useCustomTotal) return unitPrice;
    if (i < enrollments.length - 1) {
      const share =
        masterSum > 0
          ? round2((unitPrice / masterSum) * effectiveTotal)
          : round2(effectiveTotal / enrollments.length);
      assigned = round2(assigned + share);
      return share;
    }
    return round2(effectiveTotal - assigned);
  });

  for (let i = 0; i < enrollments.length; i++) {
    const srv = enrollments[i];
    {
      const workId = await generateWorkId();
      const price = shares[i];
      const cost = (Number(srv.govtFee) || 0) + (Number(srv.otherCost) || 0);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (srv.estimatedDays || 3));

      // Snapshot of customer-selected corrections (validated against master, master untouched)
      let selectedOptionsSnapshot: string | null = null;
      const wantedIds = Array.isArray(correctionsByService[srv.id]) ? correctionsByService[srv.id] : [];
      if (wantedIds.length > 0) {
        const activeOpts = (srv.correctionOptions || []).filter((o) => o.isActive);
        const picked = activeOpts
          .filter((o) => wantedIds.includes(o.id))
          .map((o) => ({ id: o.id, name: o.name }));
        if (picked.length > 0) {
          selectedOptionsSnapshot = JSON.stringify({ type: "CORRECTIONS", items: picked });
        }
      }

      const work = await prisma.work.create({
        data: {
          workId,
          customerId: customer.id,
          serviceId: srv.id,
          selectedOptions: selectedOptionsSnapshot,
          branchId: validBranchId,
          assignedUserId: data.user.role !== "AGENT" ? data.user.id : null,
          agentId: resolvedAgentId,
          status: "NEW",
          priority: "MEDIUM",
          dueDate,
          totalAmount: price,
          paidAmount: 0,
          pendingAmount: price,
          serviceCost: cost,
          notes: `Application for Master Service: ${srv.name}`,
          documentPassword: data.documentPassword?.trim() || null,
        },
      });

      // Seed cost entries from master so staff sees the breakdown and can add more later
      if ((Number(srv.govtFee) || 0) > 0) {
        await prisma.workCostEntry.create({
          data: { workId: work.id, label: "Government fee", amount: Math.round((Number(srv.govtFee) || 0) * 100) / 100, createdByUserId: data.user.id },
        });
      }
      if ((Number(srv.otherCost) || 0) > 0) {
        await prisma.workCostEntry.create({
          data: { workId: work.id, label: "Other cost", amount: Math.round((Number(srv.otherCost) || 0) * 100) / 100, createdByUserId: data.user.id },
        });
      }

      // Populate required document checklist
      for (const reqDoc of srv.requiredDocuments) {
        await prisma.workDocument.create({
          data: {
            workId: work.id,
            documentName: reqDoc.name,
            state: "REQUIRED",
          },
        });
      }

      // Store validated custom applicant field values (snapshot, master untouched).
      // Enforced only when the caller sends the key (apply flows); the legacy
      // multi-service register grid doesn't collect them and stays compatible.
      const customRows =
        data.customFieldValues !== undefined
          ? resolveCustomFieldValues(srv as any, data.customFieldValues)
          : [];
      for (const row of customRows) {
        await prisma.workCustomFieldValue.create({
          data: {
            workId: work.id,
            fieldKey: row.fieldKey,
            label: row.label,
            value: row.value,
            valueMr: row.valueMr || null,
          },
        });
      }

      await prisma.workStatusHistory.create({
        data: {
          workId: work.id,
          previousStatus: "NONE",
          newStatus: "NEW",
          changedByUserId: data.user.id,
          notes: "Work order created via Customer Registration",
        },
      });

      createdWorks.push({ id: work.id, totalAmount: price });
    }
  }

  // Distribute Advance collected at registration across created works (in order).
  // Each chunk goes through createPayment → Payment + Work update + Receipt + logs.
  const advance = Math.round((Number(data.advanceAmount) || 0) * 100) / 100;
  if (advance > 0) {
    if (createdWorks.length === 0) {
      throw new Error("Advance payment requires at least one selected service.");
    }
    if (advance > effectiveTotal) {
      throw new Error(
        `Advance of ₹${advance} exceeds total payable of ₹${effectiveTotal}.`
      );
    }
    let remaining = advance;
    for (const w of createdWorks) {
      if (remaining <= 0) break;
      const chunk = Math.min(remaining, w.totalAmount);
      if (chunk <= 0) continue;
      await createPayment({
        workId: w.id,
        amount: chunk,
        paymentMethod: advanceMethod,
        notes: `Advance collected at customer registration (${advanceMethod})`,
        user: data.user,
      });
      remaining = Math.round((remaining - chunk) * 100) / 100;
    }
  }

  await logActivity({
    organizationId,
    branchId: validBranchId,
    userId: data.user.id,
    action: "CUSTOMER_CREATED",
    entity: "Customer",
    entityId: customer.id,
    metadata: {
      customerId: customer.customerId,
      name: customer.name,
      mobile: customer.mobile,
      enrolledServicesCount: serviceIds.length,
      enrolledCorrectionsCount: Object.values(correctionsByService).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      ),
      advanceCollected: advance,
      advanceMethod,
      effectiveTotal,
      assignedAgentId: resolvedAgentId,
      assignedEmployeeId: resolvedEmployeeId,
    },
    newValue: customer,
  });

  return customer;
}

export async function updateCustomer(
  id: string,
  data: Partial<{
    name: string;
    mobile: string;
    alternateMobile: string;
    email: string;
    dob: string | Date;
    gender: string;
    address: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    notes: string;
    agentId: string;
    branchId: string;
  }>,
  user: SessionUser
) {
  const existing = await prisma.customer.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      isDeleted: false,
      ...(user.role === "AGENT" ? { agentId: user.id } : {}),
    },
  });

  if (!existing) {
    throw new Error("Customer not found or unauthorized");
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      mobile: data.mobile !== undefined ? data.mobile.trim() : undefined,
      alternateMobile: data.alternateMobile !== undefined ? data.alternateMobile?.trim() || null : undefined,
      email: data.email !== undefined ? data.email?.trim() || null : undefined,
      dob: data.dob !== undefined ? (data.dob ? new Date(data.dob) : null) : undefined,
      gender: data.gender !== undefined ? data.gender : undefined,
      address: data.address !== undefined ? data.address?.trim() || null : undefined,
      area: data.area !== undefined ? data.area?.trim() || null : undefined,
      city: data.city !== undefined ? data.city?.trim() || null : undefined,
      state: data.state !== undefined ? data.state?.trim() || null : undefined,
      pincode: data.pincode !== undefined ? data.pincode?.trim() || null : undefined,
      notes: data.notes !== undefined ? data.notes?.trim() || null : undefined,
      agentId: user.role === "ADMIN" && data.agentId !== undefined ? data.agentId || null : undefined,
    },
  });

  await logActivity({
    organizationId: user.organizationId,
    branchId: existing.branchId,
    userId: user.id,
    action: "CUSTOMER_UPDATED",
    entity: "Customer",
    entityId: id,
    previousValue: existing,
    newValue: updated,
  });

  return updated;
}

export async function softDeleteCustomer(id: string, user: SessionUser) {
  const existing = await prisma.customer.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      isDeleted: false,
    },
  });

  if (!existing) {
    throw new Error("Customer not found");
  }

  const deleted = await prisma.customer.update({
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
    action: "CUSTOMER_DELETED",
    entity: "Customer",
    entityId: id,
    previousValue: existing,
  });

  return deleted;
}

export async function attachCustomerPhoto(
  customerId: string,
  fileData: { key: string; fileName: string; fileSize: number; mimeType: string; url: string },
  user: SessionUser
) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId: user.organizationId,
      isDeleted: false,
    },
  });

  if (!customer) {
    throw new Error("Customer not found or unauthorized");
  }

  const asset = await prisma.fileAsset.findFirst({ where: { storageKey: fileData.key } });
  if (!asset) throw new Error("Uploaded file not found");

  await prisma.fileAsset.updateMany({
    where: { customerId: customer.id, documentType: "CUSTOMER_PHOTO", isCurrent: true },
    data: { isCurrent: false },
  });

  const attached = await prisma.fileAsset.update({
    where: { id: asset.id },
    data: {
      customerId: customer.id,
      documentType: "CUSTOMER_PHOTO",
      isCurrent: true,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
    },
    include: { uploader: { select: { id: true, name: true, email: true } } },
  });

  await logActivity({
    organizationId: user.organizationId,
    branchId: customer.branchId,
    userId: user.id,
    action: "CUSTOMER_PHOTO_UPLOADED",
    entity: "Customer",
    entityId: customer.id,
    metadata: { customerId: customer.customerId, fileName: fileData.fileName },
  });

  return attached;
}

export async function deleteCustomerPhoto(customerId: string, user: SessionUser) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId: user.organizationId,
      isDeleted: false,
    },
  });

  if (!customer) {
    throw new Error("Customer not found or unauthorized");
  }

  const asset = await prisma.fileAsset.findFirst({
    where: { customerId: customer.id, documentType: "CUSTOMER_PHOTO", isCurrent: true },
  });

  if (!asset) {
    throw new Error("No customer photo found to delete");
  }

  await prisma.fileAsset.deleteMany({ where: { id: asset.id } });

  await logActivity({
    organizationId: user.organizationId,
    branchId: customer.branchId,
    userId: user.id,
    action: "CUSTOMER_PHOTO_DELETED",
    entity: "Customer",
    entityId: customer.id,
    metadata: { customerId: customer.customerId, fileName: asset.fileName },
  });

  return { id: asset.id, fileName: asset.fileName };
}
