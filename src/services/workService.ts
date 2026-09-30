import prisma from "@/lib/db";
import { generateWorkId } from "@/lib/id-generator";
import { logActivity, createNotification, notifyOfficeTeam } from "@/services/auditService";
import { agentRateOf } from "@/services/serviceCatalogService";
import { fileStorageService } from "@/services/fileStorageService";
import { SessionUser, WorkStatus, WorkPriority } from "@/types";
import { WORK_STATUS_FLOW } from "@/lib/constants";

export interface WorkFilterParams {
  search?: string;
  status?: string;
  priority?: string;
  serviceId?: string;
  assignedUserId?: string;
  agentId?: string;
  branchId?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  user: SessionUser;
}

export async function getWorks(params: WorkFilterParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const whereClause: any = {
    customer: { organizationId: params.user.organizationId },
  };

  // AGENT data isolation: Agents can ONLY see their assigned works
  if (params.user.role === "AGENT") {
    whereClause.agentId = params.user.id;
  } else {
    if (params.agentId) whereClause.agentId = params.agentId;
    if (params.assignedUserId) whereClause.assignedUserId = params.assignedUserId;
    if (params.branchId) whereClause.branchId = params.branchId;
  }

  if (params.status) whereClause.status = params.status;
  if (params.priority) whereClause.priority = params.priority;
  if (params.serviceId) whereClause.serviceId = params.serviceId;
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
      { workId: { contains: q, mode: "insensitive" } },
      { trackingReferenceNumber: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { mobile: { contains: q } } },
      { service: { name: { contains: q, mode: "insensitive" } } },
      { service: { category: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [total, works] = await Promise.all([
    prisma.work.count({ where: whereClause }),
    prisma.work.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, customerId: true, name: true, mobile: true, email: true } },
        service: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        assignedUser: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, businessName: true, mobile: true } },
        branch: { select: { id: true, name: true } },
        _count: {
          select: {
            documents: true,
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
    data: works,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Scoped work summary for the team command strip.
 * Same data-isolation as getWorks (agents see only their own).
 * Respects agentId + date filters; ignores status so the strip shows distribution.
 */
export async function getWorkSummary(params: {
  agentId?: string;
  assignedUserId?: string;
  startDate?: string;
  endDate?: string;
  user: SessionUser;
}) {
  const whereClause: any = {
    customer: { organizationId: params.user.organizationId },
  };

  if (params.user.role === "AGENT") {
    whereClause.agentId = params.user.id;
  } else {
    if (params.agentId) whereClause.agentId = params.agentId;
    if (params.assignedUserId) whereClause.assignedUserId = params.assignedUserId;
  }

  if (params.startDate || params.endDate) {
    whereClause.createdAt = {};
    if (params.startDate) whereClause.createdAt.gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = end;
    }
  }

  const [byStatus, pendingAgg, total] = await Promise.all([
    prisma.work.groupBy({
      by: ["status"],
      where: whereClause,
      _count: { status: true },
    }),
    prisma.work.aggregate({
      where: { ...whereClause, pendingAmount: { gt: 0 } },
      _sum: { pendingAmount: true, totalAmount: true, paidAmount: true },
      _count: true,
    }),
    prisma.work.count({ where: whereClause }),
  ]);

  const counts: Record<string, number> = {};
  for (const row of byStatus) counts[row.status] = row._count.status;

  const active =
    (counts.NEW || 0) +
    (counts.DOCUMENTS_REQUIRED || 0) +
    (counts.DOCUMENTS_RECEIVED || 0) +
    (counts.IN_PROGRESS || 0) +
    (counts.SUBMITTED || 0) +
    (counts.UNDER_PROCESS || 0);
  const done = (counts.COMPLETED || 0) + (counts.DELIVERED || 0);

  // Profit internals stay server-side for agents (they track status, never margins)
  if (params.user.role === "AGENT") {
    return {
      total,
      active,
      done,
      onHold: counts.ON_HOLD || 0,
      byStatus: counts,
      pendingWorks: pendingAgg._count,
      pendingAmount: pendingAgg._sum.pendingAmount || 0,
    };
  }

  const moneyAgg = await prisma.work.aggregate({
    where: whereClause,
    _sum: { totalAmount: true, serviceCost: true },
  });
  const billed = moneyAgg._sum.totalAmount || 0;
  const cost = moneyAgg._sum.serviceCost || 0;

  return {
    total,
    active,
    done,
    onHold: counts.ON_HOLD || 0,
    byStatus: counts,
    pendingWorks: pendingAgg._count,
    pendingAmount: pendingAgg._sum.pendingAmount || 0,
    billedAmount: pendingAgg._sum.totalAmount || 0,
    collectedAmount: pendingAgg._sum.paidAmount || 0,
    billed,
    cost,
    profit: billed - cost,
  };
}

export async function getWorkById(id: string, user: SessionUser) {
  const work = await prisma.work.findFirst({
    where: {
      id,
      customer: { organizationId: user.organizationId },
      ...(user.role === "AGENT" ? { agentId: user.id } : {}),
    },
    include: {
      customer: true,
      service: {
        include: {
          requiredDocuments: true,
        },
      },
      assignedUser: { select: { id: true, name: true, email: true, mobile: true } },
      agent: { select: { id: true, name: true, businessName: true, mobile: true } },
      branch: true,
      documents: {
        orderBy: { createdAt: "asc" },
      },
      customFieldValues: {
        orderBy: { createdAt: "asc" },
      },
      costEntries: {
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      statusHistories: {
        include: {
          changedByUser: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: {
          collectedByUser: { select: { id: true, name: true } },
          receipt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      receipts: {
        orderBy: { createdAt: "desc" },
      },
      fileAssets: {
        where: {
          documentType: { in: ["SERVICE_RECEIPT", "CERTIFICATE"] },
          isCurrent: true,
        },
        include: {
          uploader: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!work) return null;

  // Agents track status, never margins: strip cost breakdown server-side
  if (user.role === "AGENT") {
    work.costEntries = [];
  }

  return work;
}

export interface WorkCustomFieldValueInput {
  fieldKey: string;
  value?: string;
  valueMr?: string;
}

/**
 * Validates submitted custom-field values against the service master and
 * returns clean rows ready to store. Master record untouched.
 */
export function resolveCustomFieldValues(
  service: { customFields?: Array<any> },
  input: unknown
): Array<{ fieldKey: string; label: string; value: string; valueMr?: string }> {
  const fields = Array.isArray(service.customFields)
    ? service.customFields.filter((f: any) => f.isActive !== false)
    : [];
  if (fields.length === 0) return [];
  const byKey = new Map<string, any>();
  for (const item of Array.isArray(input) ? input : []) {
    if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      if (typeof rec.fieldKey === "string" && rec.fieldKey) byKey.set(rec.fieldKey, rec);
    }
  }
  const rows: Array<{ fieldKey: string; label: string; value: string; valueMr?: string }> = [];
  for (const f of fields) {
    const rec = byKey.get(f.fieldKey);
    const value = rec && typeof rec.value === "string" ? rec.value.trim() : "";
    const valueMr = rec && typeof rec.valueMr === "string" ? rec.valueMr.trim() : "";
    if (f.isRequired && !value) {
      throw new Error(`"${f.label}" is required.`);
    }
    if (f.isRequired && f.marathiEnabled && !valueMr) {
      throw new Error(`"${f.label}" Marathi value is required.`);
    }
    if (f.fieldType === "PHONE" && value && !/^\d{10}$/.test(value.replace(/\D/g, ""))) {
      throw new Error(`"${f.label}" must be a 10-digit number.`);
    }
    if (f.fieldType === "SELECT" && value) {
      let options: string[] = [];
      try {
        const parsed = typeof f.options === "string" ? JSON.parse(f.options) : f.options;
        if (Array.isArray(parsed)) options = parsed.filter((o) => typeof o === "string");
      } catch {
        options = [];
      }
      if (options.length > 0 && !options.includes(value)) {
        throw new Error(`"${f.label}" has an invalid selection.`);
      }
    }
    if (value || valueMr) {
      rows.push({ fieldKey: f.fieldKey, label: f.label, value, valueMr: valueMr || undefined });
    }
  }
  return rows;
}

export async function createWork(data: {
  customerId: string;
  serviceId: string;
  selectedCorrections?: Array<string | { id?: string; name?: string }>;
  assignedUserId?: string;
  agentId?: string;
  branchId?: string;
  priority?: WorkPriority;
  dueDate?: string | Date;
  totalAmount?: number;
  notes?: string;
  documentPassword?: string;
  customFieldValues?: WorkCustomFieldValueInput[];
  user: SessionUser;
}) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: data.customerId,
      isDeleted: false,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
    include: { requiredDocuments: true, correctionOptions: true, customFields: true },
  });

  if (!service) {
    throw new Error("Master Service not found in Catalog");
  }

  // Validate custom applicant fields against master (throws on missing/invalid).
  // Enforced only when the caller sends the key (apply flows send it).
  const customRows =
    data.customFieldValues !== undefined
      ? resolveCustomFieldValues(service as any, data.customFieldValues)
      : [];

  // Snapshot of customer-selected correction options (master record untouched).
  // Only active correction options defined on the master service are accepted.
  let selectedOptionsSnapshot: string | null = null;
  if (Array.isArray(data.selectedCorrections) && data.selectedCorrections.length > 0) {
    const activeOpts = (service.correctionOptions || []).filter((o) => o.isActive);
    const picked: Array<{ id: string; name: string }> = [];
    for (const item of data.selectedCorrections) {
      const rawId = typeof item === "string" ? item : item?.id;
      const rawName = typeof item === "string" ? undefined : item?.name;
      const match =
        (rawId && activeOpts.find((o) => o.id === rawId)) ||
        (rawName && activeOpts.find((o) => o.name.toLowerCase() === rawName.toLowerCase()));
      if (match && !picked.some((p) => p.id === match.id)) {
        picked.push({ id: match.id, name: match.name });
      }
    }
    if (picked.length > 0) {
      selectedOptionsSnapshot = JSON.stringify({ type: "CORRECTIONS", items: picked });
    }
  }

  const taggedAgentId = data.user.role === "AGENT" ? data.user.id : data.agentId || customer.agentId || null;
  // Agents are billed at agent rate, staff/office at customer rate
  const basePrice =
    data.user.role === "AGENT" ? agentRateOf(service) : Number(service.customerPrice) || 0;
  // Unit cost snapshot (govt fee + other) — historical truth even if master changes later
  const unitCost = (Number(service.govtFee) || 0) + (Number(service.otherCost) || 0);
  const seedCosts: Array<{ label: string; amount: number }> = [];
  if ((Number(service.govtFee) || 0) > 0) {
    seedCosts.push({ label: "Government fee", amount: Math.round((Number(service.govtFee) || 0) * 100) / 100 });
  }
  if ((Number(service.otherCost) || 0) > 0) {
    seedCosts.push({ label: "Other cost", amount: Math.round((Number(service.otherCost) || 0) * 100) / 100 });
  }

  const calculatedPrice = basePrice;
  const finalPrice = data.totalAmount !== undefined ? Number(data.totalAmount) : calculatedPrice;

  const workId = await generateWorkId();
  const branchId = data.branchId || data.user.branchId || customer.branchId;

  let calculatedDueDate: Date | null = null;
  if (data.dueDate) {
    calculatedDueDate = new Date(data.dueDate);
  } else {
    calculatedDueDate = new Date();
    calculatedDueDate.setDate(calculatedDueDate.getDate() + (service.estimatedDays || 3));
  }

  const work = await prisma.work.create({
    data: {
      workId,
      customerId: customer.id,
      serviceId: service.id,
      selectedOptions: selectedOptionsSnapshot,
      branchId,
      assignedUserId: data.assignedUserId || null,
      agentId: taggedAgentId,
      status: "NEW",
      priority: data.priority || "MEDIUM",
      dueDate: calculatedDueDate,
      totalAmount: finalPrice,
      paidAmount: 0,
      pendingAmount: finalPrice,
      serviceCost: unitCost,
      notes: data.notes?.trim() || null,
      documentPassword: data.documentPassword?.trim() || null,
    },
  });

  // Seed cost entries from master so staff sees the breakdown and can add more later
  for (const c of seedCosts) {
    await prisma.workCostEntry.create({
      data: { workId: work.id, label: c.label, amount: c.amount, createdByUserId: data.user.id },
    });
  }

  // Create document checklist from required documents
  for (const doc of service.requiredDocuments) {
    await prisma.workDocument.create({
      data: {
        workId: work.id,
        documentName: doc.name,
        state: "REQUIRED",
      },
    });
  }

  // Store validated custom applicant field values (snapshot, master untouched)
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

  // Initial Status History
  await prisma.workStatusHistory.create({
    data: {
      workId: work.id,
      previousStatus: "NONE",
      newStatus: "NEW",
      changedByUserId: data.user.id,
      notes: "Work order created",
    },
  });

  // Activity Log
  await logActivity({
    organizationId: data.user.organizationId,
    branchId,
    userId: data.user.id,
    action: "WORK_CREATED",
    entity: "Work",
    entityId: work.id,
    metadata: {
      workId: work.workId,
      serviceName: service.name,
      customerName: customer.name,
      selectedCorrections: selectedOptionsSnapshot ? JSON.parse(selectedOptionsSnapshot).items : [],
      customFields: customRows.length,
    },
  });

  // Notification: agent submissions alert the full office team (Admins + Employees,
  // org-scoped); other roles keep the existing admin broadcast.
  if (data.user.role === "AGENT") {
    await notifyOfficeTeam({
      organizationId: data.user.organizationId,
      branchId,
      title: `New submission by ${data.user.name}`,
      message: `Agent ${data.user.name} submitted ${work.workId} for ${customer.name} (${service.name}). Open the work order to download documents and process.`,
      type: "NEW_AGENT_SUBMISSION",
      link: `/work/${work.id}`,
    });
  } else {
    await createNotification({
      branchId,
      title: "New Work Order Created",
      message: `${work.workId} for ${customer.name} (${service.name})`,
      type: "NEW_WORK",
      link: `/work/${work.id}`,
    });
  }

  return work;
}

export async function updateWorkStatus(
  workId: string,
  newStatus: WorkStatus,
  notes: string,
  user: SessionUser
) {
  const work = await prisma.work.findFirst({
    where: {
      id: workId,
      customer: { organizationId: user.organizationId },
      ...(user.role === "AGENT" ? { agentId: user.id } : {}),
    },
    include: { customer: true, service: true },
  });

  if (!work) {
    throw new Error("Work order not found");
  }

  const previousStatus = work.status as WorkStatus;

  // Validation: Check valid transitions (Admin can override)
  if (user.role !== "ADMIN") {
    const allowedTransitions = WORK_STATUS_FLOW[previousStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${previousStatus} to ${newStatus}`);
    }
  }

  const updated = await prisma.work.update({
    where: { id: workId },
    data: { status: newStatus },
  });

  // Record in WorkStatusHistory
  await prisma.workStatusHistory.create({
    data: {
      workId: work.id,
      previousStatus,
      newStatus,
      changedByUserId: user.id,
      notes: notes?.trim() || `Status updated to ${newStatus}`,
    },
  });

  // Activity Log
  await logActivity({
    organizationId: user.organizationId,
    branchId: work.branchId,
    userId: user.id,
    action: "WORK_STATUS_CHANGED",
    entity: "Work",
    entityId: work.id,
    metadata: { workId: work.workId, previousStatus, newStatus, notes },
    previousValue: { status: previousStatus },
    newValue: { status: newStatus },
  });

  // If completed or delivered, notify
  if (newStatus === "COMPLETED" || newStatus === "DELIVERED") {
    await createNotification({
      branchId: work.branchId,
      title: `Work ${newStatus.toLowerCase()}: ${work.workId}`,
      message: `${work.service.name} for ${work.customer.name} is now ${newStatus.toLowerCase()}.`,
      type: "WORK_COMPLETED",
      link: `/work/${work.id}`,
    });
  }

  return updated;
}

export async function updateWorkDocument(
  docId: string,
  data: {
    state?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    rejectionReason?: string;
  },
  user: SessionUser
) {
  const doc = await prisma.workDocument.findUnique({
    where: { id: docId },
    include: { work: { include: { customer: true } } },
  });

  if (!doc || doc.work.customer.organizationId !== user.organizationId) {
    throw new Error("Document not found");
  }

  // Agent isolation: agents touch only their own works' documents
  if (user.role === "AGENT" && doc.work.agentId !== user.id) {
    throw new Error("Document not found");
  }

  const isVerifying = data.state === "VERIFIED";
  const isRejecting = data.state === "REJECTED";

  // Verify/Reject is staff-only (Admin/Employee). Agents upload; staff processes.
  if ((isVerifying || isRejecting) && user.role === "AGENT") {
    throw new Error("Only office staff can verify or reject documents.");
  }

  const updated = await prisma.workDocument.update({
    where: { id: docId },
    data: {
      state: data.state || doc.state,
      fileUrl: data.fileUrl !== undefined ? data.fileUrl : doc.fileUrl,
      fileName: data.fileName !== undefined ? data.fileName : doc.fileName,
      fileSize: data.fileSize !== undefined ? data.fileSize : doc.fileSize,
      mimeType: data.mimeType !== undefined ? data.mimeType : doc.mimeType,
      rejectionReason: isRejecting ? data.rejectionReason : null,
      verifiedByUserId: isVerifying ? user.id : isRejecting ? null : doc.verifiedByUserId,
      verifiedAt: isVerifying ? new Date() : isRejecting ? null : doc.verifiedAt,
    },
  });

  await logActivity({
    organizationId: user.organizationId,
    branchId: doc.work.branchId,
    userId: user.id,
    action: isVerifying ? "DOCUMENT_VERIFIED" : isRejecting ? "DOCUMENT_REJECTED" : "DOCUMENT_UPDATED",
    entity: "WorkDocument",
    entityId: docId,
    metadata: { documentName: doc.documentName, workId: doc.work.workId, state: data.state },
  });

  // Agent upload → office team (Admin + Employees) gets a bell notification with work link
  const isFileAttach = Boolean(data.fileUrl || data.fileName);
  if (isFileAttach && user.role === "AGENT") {
    await notifyOfficeTeam({
      organizationId: user.organizationId,
      branchId: doc.work.branchId,
      title: `Document uploaded by ${user.name}`,
      message: `Agent ${user.name} uploaded "${doc.documentName}" for ${doc.work.workId} (${doc.work.customer?.name || "customer"}). Open the work order to download and verify.`,
      type: "DOCUMENT_UPLOADED",
      link: `/work/${doc.work.id}`,
    });
  }

  return updated;
}

async function getAccessibleWork(workId: string, user: SessionUser) {
  const work = await prisma.work.findFirst({
    where: {
      id: workId,
      customer: { organizationId: user.organizationId },
      ...(user.role === "AGENT" ? { agentId: user.id } : {}),
    },
    include: {
      customer: { select: { id: true, customerId: true, name: true } },
      service: { select: { id: true, name: true, category: { select: { name: true } } } },
    },
  });
  return work;
}

export async function updateWorkTracking(
  workId: string,
  trackingReferenceNumber: string,
  user: SessionUser
) {
  const work = await getAccessibleWork(workId, user);
  if (!work) throw new Error("Work order not found");

  const value = trackingReferenceNumber?.trim() ?? "";
  const previous = work.trackingReferenceNumber ?? null;
  const updated = await prisma.work.update({
    where: { id: work.id },
    data: { trackingReferenceNumber: value || null },
  });

  await logActivity({
    organizationId: user.organizationId,
    branchId: work.branchId,
    userId: user.id,
    action: "TRACKING_NUMBER_UPDATED",
    entity: "Work",
    entityId: work.id,
    previousValue: { trackingReferenceNumber: previous },
    newValue: { trackingReferenceNumber: value || null },
  });

  return updated;
}

function parseDateInput(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value as string);
  if (isNaN(d.getTime())) throw new Error("Invalid date provided");
  return d;
}

export async function updateWorkDates(
  workId: string,
  data: { documentsReceivedDate?: unknown; appliedDate?: unknown; deliveryDate?: unknown },
  user: SessionUser
) {
  const work = await getAccessibleWork(workId, user);
  if (!work) throw new Error("Work order not found");

  const documentsReceivedDate = parseDateInput(data.documentsReceivedDate);
  const appliedDate = parseDateInput(data.appliedDate);
  const deliveryDate = parseDateInput(data.deliveryDate);

  if (appliedDate && documentsReceivedDate && appliedDate < documentsReceivedDate) {
    throw new Error("Applied Date cannot be before Documents Received Date");
  }
  if (deliveryDate && appliedDate && deliveryDate < appliedDate) {
    throw new Error("Delivery Date cannot be before Applied Date");
  }

  const previous = {
    documentsReceivedDate: work.documentsReceivedDate,
    appliedDate: work.appliedDate,
    deliveryDate: work.deliveryDate,
  };

  const updated = await prisma.work.update({
    where: { id: work.id },
    data: { documentsReceivedDate, appliedDate, deliveryDate },
  });

  await logActivity({
    organizationId: user.organizationId,
    branchId: work.branchId,
    userId: user.id,
    action: "SERVICE_DATES_UPDATED",
    entity: "Work",
    entityId: work.id,
    previousValue: { dates: previous },
    newValue: { documentsReceivedDate, appliedDate, deliveryDate },
  });

  return updated;
}

export async function attachWorkFile(
  workId: string,
  type: "SERVICE_RECEIPT" | "CERTIFICATE",
  fileData: { key: string; fileName: string; fileSize: number; mimeType: string; url: string },
  user: SessionUser
) {
  const work = await getAccessibleWork(workId, user);
  if (!work) throw new Error("Work order not found");

  const asset = await prisma.fileAsset.findFirst({ where: { storageKey: fileData.key } });
  if (!asset) throw new Error("Uploaded file not found");

  await prisma.fileAsset.updateMany({
    where: { workId: work.id, documentType: type, isCurrent: true },
    data: { isCurrent: false },
  });

  const attached = await prisma.fileAsset.update({
    where: { id: asset.id },
    data: {
      workId: work.id,
      customerId: work.customer?.id || null,
      documentType: type,
      isCurrent: true,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
    },
    include: { uploader: { select: { id: true, name: true, email: true } } },
  });

  await logActivity({
    organizationId: user.organizationId,
    branchId: work.branchId,
    userId: user.id,
    action: type === "SERVICE_RECEIPT" ? "SERVICE_RECEIPT_UPLOADED" : "CERTIFICATE_UPLOADED",
    entity: "Work",
    entityId: work.id,
    metadata: { workId: work.workId, type, fileName: fileData.fileName, fileSize: fileData.fileSize },
  });

  // Agent upload → office team (Admin + Employees) gets a bell notification with work link
  if (user.role === "AGENT") {
    const label = type === "SERVICE_RECEIPT" ? "Service Receipt" : "Certificate";
    await notifyOfficeTeam({
      organizationId: user.organizationId,
      branchId: work.branchId,
      title: `${label} uploaded by ${user.name}`,
      message: `Agent ${user.name} uploaded ${label} "${fileData.fileName}" for ${work.workId}. Open the work order to download and process.`,
      type: "DOCUMENT_UPLOADED",
      link: `/work/${work.id}`,
    });
  }

  return attached;
}

async function resyncWorkCost(workId: string) {
  const agg = await prisma.workCostEntry.aggregate({
    where: { workId },
    _sum: { amount: true },
  });
  const total = Math.round((agg._sum.amount || 0) * 100) / 100;
  await prisma.work.update({ where: { id: workId }, data: { serviceCost: total } });
  return total;
}

/**
 * Adds an actual cost entry to a work order (e.g. postman delivery paid later).
 * Staff-only (route enforces WORK_UPDATE); agents are rejected here as well.
 * Work.serviceCost is re-synced so profit stays live everywhere.
 */
export async function addWorkCost(
  workId: string,
  data: { label: string; amount: number },
  user: SessionUser
) {
  if (user.role === "AGENT") {
    throw new Error("Only office staff can manage work costs.");
  }
  const work = await getAccessibleWork(workId, user);
  if (!work) throw new Error("Work order not found");

  const label = (data.label || "").trim();
  const amount = Math.round((Number(data.amount) || 0) * 100) / 100;
  if (!label) throw new Error("Cost label is required.");
  if (!(amount > 0)) throw new Error("Cost amount must be greater than zero.");

  const entry = await prisma.workCostEntry.create({
    data: {
      workId: work.id,
      label: label.slice(0, 80),
      amount,
      createdByUserId: user.id,
    },
  });

  const serviceCost = await resyncWorkCost(work.id);

  await logActivity({
    organizationId: user.organizationId,
    branchId: work.branchId,
    userId: user.id,
    action: "WORK_COST_ADDED",
    entity: "Work",
    entityId: work.id,
    metadata: { workId: work.workId, label: entry.label, amount, serviceCost },
  });

  return { entry, serviceCost };
}

export async function deleteWorkCost(costId: string, user: SessionUser) {
  if (user.role === "AGENT") {
    throw new Error("Only office staff can manage work costs.");
  }
  const entry = await prisma.workCostEntry.findUnique({
    where: { id: costId },
    include: { work: { select: { id: true, workId: true, branchId: true, customer: { select: { organizationId: true } } } } },
  });
  if (!entry || entry.work.customer.organizationId !== user.organizationId) {
    throw new Error("Cost entry not found.");
  }
  // Agent isolation not needed (agents blocked above); staff sees all org works.

  await prisma.workCostEntry.delete({ where: { id: costId } });
  const serviceCost = await resyncWorkCost(entry.work.id);

  await logActivity({
    organizationId: user.organizationId,
    branchId: entry.work.branchId,
    userId: user.id,
    action: "WORK_COST_REMOVED",
    entity: "Work",
    entityId: entry.work.id,
    metadata: { workId: entry.work.workId, label: entry.label, amount: entry.amount, serviceCost },
  });

  return { id: costId, serviceCost };
}

export async function deleteWorkFile(
  workId: string,
  type: "SERVICE_RECEIPT" | "CERTIFICATE",
  user: SessionUser
) {
  const work = await getAccessibleWork(workId, user);
  if (!work) throw new Error("Work order not found");

  const asset = await prisma.fileAsset.findFirst({
    where: { workId: work.id, documentType: type, isCurrent: true },
  });

  if (!asset) {
    throw new Error(
      type === "SERVICE_RECEIPT" ? "No service receipt found to delete" : "No certificate found to delete"
    );
  }

  const storage = fileStorageService?.delete ? await fileStorageService.delete(asset.storageKey) : false;
  await prisma.fileAsset.deleteMany({ where: { id: asset.id } });

  await logActivity({
    organizationId: user.organizationId,
    branchId: work.branchId,
    userId: user.id,
    action: type === "SERVICE_RECEIPT" ? "SERVICE_RECEIPT_DELETED" : "CERTIFICATE_DELETED",
    entity: "Work",
    entityId: work.id,
    metadata: { workId: work.workId, type, fileName: asset.fileName },
  });

  return { id: asset.id, fileName: asset.fileName, deletedFile: storage };
}
