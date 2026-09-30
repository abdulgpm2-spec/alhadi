import prisma from "@/lib/db";
import { SessionUser } from "@/types";
import { logActivity } from "./auditService";

export interface ServiceFilterParams {
  search?: string;
  categoryId?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

// ----------------------------------------------------
// Category Operations
// ----------------------------------------------------

export async function getCategories(user?: SessionUser) {
  return await prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { services: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  data: {
    name: string;
    description?: string;
  },
  user: SessionUser
) {
  const name = data.name ? data.name.trim() : "";
  if (!name) {
    throw new Error("Category Name is required.");
  }

  const existing = await prisma.serviceCategory.findUnique({
    where: { name },
  });

  if (existing) {
    throw new Error(`Category "${name}" already exists.`);
  }

  const category = await prisma.serviceCategory.create({
    data: {
      name,
      description: data.description?.trim() || null,
      isActive: true,
    },
  });

  await logActivity({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CATEGORY_CREATED",
    entity: "ServiceCategory",
    entityId: category.id,
    metadata: { name: category.name },
    newValue: category,
  });

  return category;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
  },
  user: SessionUser
) {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) throw new Error("Category not found.");

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) throw new Error("Category Name cannot be empty.");
    const duplicate = await prisma.serviceCategory.findFirst({
      where: {
        id: { not: id },
        name: { equals: name, mode: "insensitive" },
      },
    });
    if (duplicate) throw new Error(`Another category named "${name}" already exists.`);
  }

  const updated = await prisma.serviceCategory.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      description: data.description !== undefined ? data.description.trim() || null : undefined,
    },
  });

  await logActivity({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CATEGORY_UPDATED",
    entity: "ServiceCategory",
    entityId: id,
    previousValue: existing,
    newValue: updated,
  });

  return updated;
}

export async function deleteCategory(id: string, user: SessionUser) {
  const existing = await prisma.serviceCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { services: true } },
    },
  });

  if (!existing) throw new Error("Category not found.");

  if (existing._count.services > 0) {
    throw new Error(
      `Cannot delete category "${existing.name}" because it is linked to ${existing._count.services} service(s).`
    );
  }

  await prisma.serviceCategory.delete({ where: { id } });

  await logActivity({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CATEGORY_DELETED",
    entity: "ServiceCategory",
    entityId: id,
    metadata: { name: existing.name },
  });

  return { id, name: existing.name };
}

// ----------------------------------------------------
// Service Operations
// ----------------------------------------------------

export async function getServices(user: SessionUser, activeOnly = false) {
  const whereClause: any = {
    organizationId: user.organizationId,
  };

  if (activeOnly) {
    whereClause.isActive = true;
  }

  return await prisma.service.findMany({
    where: whereClause,
    include: {
      category: true,
      requiredDocuments: { orderBy: { createdAt: "asc" } },
      correctionOptions: { orderBy: { createdAt: "asc" } },
      customFields: { orderBy: { createdAt: "asc" } },
      _count: {
        select: { works: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getServicesCatalog(user: SessionUser, params: ServiceFilterParams = {}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 50));
  const skip = (page - 1) * pageSize;

  const whereClause: any = {
    organizationId: user.organizationId,
  };

  if (params.status === "ACTIVE" || params.activeOnly) {
    whereClause.isActive = true;
  } else if (params.status === "INACTIVE") {
    whereClause.isActive = false;
  }

  if (params.categoryId && params.categoryId !== "ALL") {
    whereClause.categoryId = params.categoryId;
  }

  if (params.search) {
    const q = params.search.trim();
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, services] = await Promise.all([
    prisma.service.count({ where: whereClause }),
    prisma.service.findMany({
      where: whereClause,
      include: {
        category: true,
        requiredDocuments: { orderBy: { createdAt: "asc" } },
        correctionOptions: { orderBy: { createdAt: "asc" } },
        customFields: { orderBy: { createdAt: "asc" } },
        _count: {
          select: { works: true },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: services,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getServiceById(id: string, user: SessionUser) {
  return await prisma.service.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
    include: {
      category: true,
      requiredDocuments: { orderBy: { createdAt: "asc" } },
      correctionOptions: { orderBy: { createdAt: "asc" } },
      customFields: { orderBy: { createdAt: "asc" } },
      _count: {
        select: { works: true },
      },
    },
  });
}

export const SERVICE_TYPES = ["NEW", "CORRECTION", "RENEWAL", "REPRINT", "PRINT"] as const;
export type ServiceTypeValue = (typeof SERVICE_TYPES)[number];

/** Effective agent rate: agentPrice when set (>0), else falls back to customerPrice. */
export function agentRateOf(svc: { agentPrice?: number | null; customerPrice?: number | null }): number {
  const agent = Number(svc.agentPrice) || 0;
  if (agent > 0) return agent;
  return Number(svc.customerPrice) || 0;
}

function normalizeServiceType(value: unknown): string {
  const v = typeof value === "string" ? value.trim().toUpperCase() : "";
  return (SERVICE_TYPES as readonly string[]).includes(v) ? v : "NEW";
}

export interface ServiceDocumentInput {
  name: string;
  isRequired?: boolean;
  description?: string;
}

function normalizeDocumentInputs(input: unknown): ServiceDocumentInput[] {
  if (!Array.isArray(input)) return [];
  const out: ServiceDocumentInput[] = [];
  for (const item of input) {
    if (typeof item === "string") {
      if (item.trim()) out.push({ name: item.trim(), isRequired: true });
    } else if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      const name = typeof rec.name === "string" ? rec.name.trim() : "";
      if (!name) continue;
      out.push({
        name,
        isRequired: rec.isRequired !== undefined ? Boolean(rec.isRequired) : true,
        description: typeof rec.description === "string" ? rec.description.trim() || undefined : undefined,
      });
    }
  }
  return out;
}

export interface ServiceCorrectionInput {
  name: string;
  note?: string;
  isActive?: boolean;
}

function normalizeCorrectionInputs(input: unknown): ServiceCorrectionInput[] {
  if (!Array.isArray(input)) return [];
  const out: ServiceCorrectionInput[] = [];
  for (const item of input) {
    if (typeof item === "string") {
      if (item.trim()) out.push({ name: item.trim(), isActive: true });
    } else if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      const name = typeof rec.name === "string" ? rec.name.trim() : "";
      if (!name) continue;
      out.push({
        name,
        note: typeof rec.note === "string" ? rec.note.trim() || undefined : undefined,
        isActive: rec.isActive !== undefined ? Boolean(rec.isActive) : true,
      });
    }
  }
  return out;
}

export type CustomFieldType = "TEXT" | "TEXTAREA" | "PHONE" | "DATE" | "SELECT";
export const CUSTOM_FIELD_TYPES: CustomFieldType[] = ["TEXT", "TEXTAREA", "PHONE", "DATE", "SELECT"];

export interface ServiceCustomFieldInput {
  fieldKey?: string;
  label: string;
  labelMr?: string;
  fieldType?: string;
  options?: string[];
  isRequired?: boolean;
  marathiEnabled?: boolean;
  isActive?: boolean;
}

function slugifyKey(label: string): string {
  return (
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "field"
  );
}

function normalizeCustomFieldInputs(input: unknown): ServiceCustomFieldInput[] {
  if (!Array.isArray(input)) return [];
  const out: ServiceCustomFieldInput[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const label = typeof rec.label === "string" ? rec.label.trim() : "";
    if (!label) continue;
    const rawKey = typeof rec.fieldKey === "string" && rec.fieldKey.trim() ? rec.fieldKey.trim() : slugifyKey(label);
    const fieldKey = rawKey.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 60) || "field";
    if (seen.has(fieldKey)) continue;
    seen.add(fieldKey);
    const fieldType =
      typeof rec.fieldType === "string" && (CUSTOM_FIELD_TYPES as string[]).includes(rec.fieldType.toUpperCase())
        ? rec.fieldType.toUpperCase()
        : "TEXT";
    let options: string[] | undefined;
    if (Array.isArray(rec.options)) {
      const cleaned = rec.options.filter((o) => typeof o === "string" && o.trim()).map((o) => (o as string).trim());
      if (cleaned.length > 0) options = Array.from(new Set(cleaned)).slice(0, 50);
    }
    out.push({
      fieldKey,
      label,
      labelMr: typeof rec.labelMr === "string" ? rec.labelMr.trim() || undefined : undefined,
      fieldType,
      options,
      isRequired: rec.isRequired !== undefined ? Boolean(rec.isRequired) : true,
      marathiEnabled: rec.marathiEnabled !== undefined ? Boolean(rec.marathiEnabled) : false,
      isActive: rec.isActive !== undefined ? Boolean(rec.isActive) : true,
    });
  }
  return out;
}

export async function createService(data: {
  name: string;
  categoryId?: string | null;
  serviceType?: string;
  passwordRequired?: boolean;
  uploadRequired?: boolean;
  customerPrice?: number;
  agentPrice?: number;
  govtFee?: number;
  otherCost?: number;
  estimatedDays?: number;
  description?: string;
  employeeInstructions?: string;
  isActive?: boolean;
  requiredDocuments?: Array<string | ServiceDocumentInput>;
  correctionOptions?: Array<string | ServiceCorrectionInput>;
  customFields?: ServiceCustomFieldInput[];
  user: SessionUser;
}) {
  const name = data.name ? data.name.trim() : "";
  if (!name) {
    throw new Error("Service Name is required.");
  }

  // Duplicate check per organization
  const duplicate = await prisma.service.findFirst({
    where: {
      organizationId: data.user.organizationId,
      name: { equals: name, mode: "insensitive" },
    },
  });

  if (duplicate) {
    throw new Error(`A Service named "${name}" already exists.`);
  }

  const service = await prisma.service.create({
    data: {
      organizationId: data.user.organizationId,
      name,
      categoryId: data.categoryId || null,
      serviceType: normalizeServiceType(data.serviceType),
      passwordRequired: data.passwordRequired !== undefined ? Boolean(data.passwordRequired) : false,
      uploadRequired: data.uploadRequired !== undefined ? Boolean(data.uploadRequired) : false,
      description: data.description?.trim() || null,
      employeeInstructions: data.employeeInstructions?.trim() || null,
      customerPrice: Number(data.customerPrice || 0),
      agentPrice: Number(data.agentPrice || 0),
      govtFee: Number(data.govtFee || 0),
      otherCost: Number(data.otherCost || 0),
      estimatedDays: Number(data.estimatedDays || 3),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    },
  });

  // Create Required Documents (name + required/optional + instructions)
  for (const doc of normalizeDocumentInputs(data.requiredDocuments)) {
    await prisma.serviceRequiredDocument.create({
      data: {
        serviceId: service.id,
        name: doc.name,
        isRequired: doc.isRequired !== undefined ? doc.isRequired : true,
        description: doc.description || null,
      },
    });
  }

  // Create Correction / Customer Options (service-specific checklist, no pricing)
  for (const opt of normalizeCorrectionInputs(data.correctionOptions)) {
    await prisma.serviceCorrectionOption.create({
      data: {
        serviceId: service.id,
        name: opt.name,
        note: opt.note || null,
        isActive: opt.isActive !== undefined ? opt.isActive : true,
      },
    });
  }

  // Create Custom Fields (applicant data form per service, incl. Marathi)
  for (const f of normalizeCustomFieldInputs(data.customFields)) {
    await prisma.serviceCustomField.create({
      data: {
        serviceId: service.id,
        fieldKey: f.fieldKey!,
        label: f.label,
        labelMr: f.labelMr || null,
        fieldType: f.fieldType || "TEXT",
        options: f.options ? JSON.stringify(f.options) : null,
        isRequired: f.isRequired !== undefined ? f.isRequired : true,
        marathiEnabled: f.marathiEnabled !== undefined ? f.marathiEnabled : false,
        isActive: f.isActive !== undefined ? f.isActive : true,
      },
    });
  }

  await logActivity({
    organizationId: data.user.organizationId,
    userId: data.user.id,
    action: "SERVICE_CREATED",
    entity: "Service",
    entityId: service.id,
    metadata: {
      name: service.name,
      serviceType: service.serviceType,
      documents: normalizeDocumentInputs(data.requiredDocuments).length,
      correctionOptions: normalizeCorrectionInputs(data.correctionOptions).length,
      customFields: normalizeCustomFieldInputs(data.customFields).length,
    },
    newValue: service,
  });

  return await getServiceById(service.id, data.user);
}

export async function updateService(
  id: string,
  data: Partial<{
    name: string;
    categoryId: string | null;
    serviceType: string;
    passwordRequired: boolean;
    uploadRequired: boolean;
    customerPrice: number;
    agentPrice: number;
    govtFee: number;
    otherCost: number;
    estimatedDays: number;
    description: string;
    employeeInstructions: string;
    isActive: boolean;
    requiredDocuments: Array<string | ServiceDocumentInput>;
    correctionOptions: Array<string | ServiceCorrectionInput>;
    customFields: ServiceCustomFieldInput[];
  }>,
  user: SessionUser
) {
  const existing = await prisma.service.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
    include: { requiredDocuments: true },
  });

  if (!existing) {
    throw new Error("Service not found.");
  }

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) {
      throw new Error("Service Name is required.");
    }
    const duplicate = await prisma.service.findFirst({
      where: {
        id: { not: id },
        organizationId: user.organizationId,
        name: { equals: name, mode: "insensitive" },
      },
    });
    if (duplicate) {
      throw new Error(`Another Service named "${name}" already exists.`);
    }
  }

  await prisma.service.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
      serviceType: data.serviceType !== undefined ? normalizeServiceType(data.serviceType) : undefined,
      passwordRequired: data.passwordRequired !== undefined ? Boolean(data.passwordRequired) : undefined,
      uploadRequired: data.uploadRequired !== undefined ? Boolean(data.uploadRequired) : undefined,
      customerPrice: data.customerPrice !== undefined ? Number(data.customerPrice) : undefined,
      agentPrice: data.agentPrice !== undefined ? Number(data.agentPrice) : undefined,
      govtFee: data.govtFee !== undefined ? Number(data.govtFee) : undefined,
      otherCost: data.otherCost !== undefined ? Number(data.otherCost) : undefined,
      estimatedDays: data.estimatedDays !== undefined ? Number(data.estimatedDays) : undefined,
      description: data.description !== undefined ? data.description.trim() || null : undefined,
      employeeInstructions:
        data.employeeInstructions !== undefined ? data.employeeInstructions.trim() || null : undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
    },
  });

  // Sync Required Documents if provided
  if (data.requiredDocuments !== undefined && Array.isArray(data.requiredDocuments)) {
    await prisma.serviceRequiredDocument.deleteMany({ where: { serviceId: id } });
    for (const doc of normalizeDocumentInputs(data.requiredDocuments)) {
      await prisma.serviceRequiredDocument.create({
        data: {
          serviceId: id,
          name: doc.name,
          isRequired: doc.isRequired !== undefined ? doc.isRequired : true,
          description: doc.description || null,
        },
      });
    }
  }

  // Sync Correction / Customer Options if provided
  if (data.correctionOptions !== undefined && Array.isArray(data.correctionOptions)) {
    await prisma.serviceCorrectionOption.deleteMany({ where: { serviceId: id } });
    for (const opt of normalizeCorrectionInputs(data.correctionOptions)) {
      await prisma.serviceCorrectionOption.create({
        data: {
          serviceId: id,
          name: opt.name,
          note: opt.note || null,
          isActive: opt.isActive !== undefined ? opt.isActive : true,
        },
      });
    }
  }

  // Sync Custom Fields if provided
  if (data.customFields !== undefined && Array.isArray(data.customFields)) {
    await prisma.serviceCustomField.deleteMany({ where: { serviceId: id } });
    for (const f of normalizeCustomFieldInputs(data.customFields)) {
      await prisma.serviceCustomField.create({
        data: {
          serviceId: id,
          fieldKey: f.fieldKey!,
          label: f.label,
          labelMr: f.labelMr || null,
          fieldType: f.fieldType || "TEXT",
          options: f.options ? JSON.stringify(f.options) : null,
          isRequired: f.isRequired !== undefined ? f.isRequired : true,
          marathiEnabled: f.marathiEnabled !== undefined ? f.marathiEnabled : false,
          isActive: f.isActive !== undefined ? f.isActive : true,
        },
      });
    }
  }

  const updated = await getServiceById(id, user);

  await logActivity({
    organizationId: user.organizationId,
    userId: user.id,
    action: "SERVICE_UPDATED",
    entity: "Service",
    entityId: id,
    metadata: {
      documents: data.requiredDocuments !== undefined ? normalizeDocumentInputs(data.requiredDocuments).length : undefined,
      correctionOptions:
        data.correctionOptions !== undefined ? normalizeCorrectionInputs(data.correctionOptions).length : undefined,
      customFields:
        data.customFields !== undefined ? normalizeCustomFieldInputs(data.customFields).length : undefined,
    },
    previousValue: existing,
    newValue: updated,
  });

  return updated;
}

export async function deleteService(id: string, user: SessionUser) {
  const existing = await prisma.service.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
    include: {
      _count: {
        select: { works: true },
      },
    },
  });

  if (!existing) {
    throw new Error("Service not found.");
  }

  // Delete Protection: Block deletion if work orders exist
  if (existing._count.works > 0) {
    throw new Error(
      `Cannot delete Service "${existing.name}" because it is referenced by ${existing._count.works} work order(s). Please set its status to Inactive instead.`
    );
  }

  await prisma.serviceRequiredDocument.deleteMany({ where: { serviceId: id } });
  await prisma.serviceCorrectionOption.deleteMany({ where: { serviceId: id } });
  await prisma.serviceCustomField.deleteMany({ where: { serviceId: id } });
  await prisma.service.delete({ where: { id } });

  await logActivity({
    organizationId: user.organizationId,
    userId: user.id,
    action: "SERVICE_DELETED",
    entity: "Service",
    entityId: id,
    metadata: { name: existing.name },
  });

  return { id, name: existing.name };
}
