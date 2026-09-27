import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import prisma from "@/lib/db";
import { createCustomer } from "@/services/customerService";
import { createWork } from "@/services/workService";
import { PERMISSIONS } from "@/lib/constants";

const OTHER_SERVICE_KEY = "__OTHER__";

/**
 * One-shot apply flow (popup): creates the work order, with the customer
 * created together when new.
 *
 * - AGENT: always new customer {name, mobile} (agents can't use POST /api/customers).
 * - STAFF/ADMIN: existing {customerId} or new {name, mobile, (+agentId for employee)}.
 * - serviceId === "__OTHER__" (+categoryId): filed under the category's
 *   auto-managed "Other Service" (created once with 2 generic document slots).
 */
export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_CREATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    if (!body.serviceId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Service is required" } },
        { status: 400 }
      );
    }

    // ---- Resolve service (incl. Other) ----
    let serviceId: string = body.serviceId;
    if (body.serviceId === OTHER_SERVICE_KEY) {
      if (!body.categoryId) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Category is required for Other service" } },
          { status: 400 }
        );
      }
      const category = await prisma.serviceCategory.findUnique({ where: { id: body.categoryId } });
      if (!category) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Selected category is invalid" } },
          { status: 400 }
        );
      }
      let other = await prisma.service.findFirst({
        where: { organizationId: auth.user.organizationId, categoryId: category.id, name: "Other Service" },
        select: { id: true },
      });
      if (!other) {
        other = await prisma.service.create({
          data: {
            organizationId: auth.user.organizationId,
            categoryId: category.id,
            name: "Other Service",
            description: "Custom agent-submitted requirements filed under this category.",
            serviceType: "NEW",
            customerPrice: 0,
            estimatedDays: 3,
            isActive: true,
            uploadRequired: true,
            requiredDocuments: {
              create: [
                { name: "Document 1", isRequired: true },
                { name: "Document 2", isRequired: true },
              ],
            },
          },
          select: { id: true },
        });
      }
      serviceId = other.id;
    }

    const selectedCorrections = Array.isArray(body.selectedCorrections) ? body.selectedCorrections : [];
    const documentPassword = body.documentPassword ? String(body.documentPassword).trim() || undefined : undefined;
    const notes = body.notes ? String(body.notes).trim() || undefined : undefined;

    // ---- Existing customer path (staff/admin) ----
    if (body.customerId) {
      if (auth.user.role === "AGENT") {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Agents always create a fresh customer in apply flow." } },
          { status: 403 }
        );
      }
      const customer = await prisma.customer.findFirst({
        where: { id: body.customerId, organizationId: auth.user.organizationId, isDeleted: false },
        select: { id: true, customerId: true, name: true, agentId: true },
      });
      if (!customer) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Selected customer is invalid" } },
          { status: 400 }
        );
      }
      const work = await createWork({
        customerId: customer.id,
        serviceId,
        selectedCorrections,
        documentPassword,
        notes,
        customFieldValues: body.customFieldValues,
        user: auth.user,
      });
      return NextResponse.json({
        success: true,
        data: { customer, work: { id: work.id, workId: work.workId } },
        message: "Work order created successfully",
      });
    }

    // ---- New customer path (all roles; assignment enforced in createCustomer) ----
    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Customer name is required" } },
        { status: 400 }
      );
    }
    const mobile = String(body.mobile || "").replace(/\D/g, "");
    if (mobile.length !== 10) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "10-digit mobile number is required" } },
        { status: 400 }
      );
    }

    const customer = await createCustomer({
      name: String(body.name).trim(),
      mobile,
      address: body.address ? String(body.address).trim() : undefined,
      agentId: body.agentId || undefined,
      employeeId: body.employeeId || undefined,
      serviceIds: [serviceId],
      serviceCorrections: selectedCorrections.length ? { [serviceId]: selectedCorrections } : undefined,
      documentPassword,
      notes,
      customFieldValues: body.customFieldValues,
      user: auth.user,
    });

    // createCustomer creates exactly one work for a single serviceId
    const work = await prisma.work.findFirst({
      where: { customerId: customer.id, serviceId },
      orderBy: { createdAt: "desc" },
      select: { id: true, workId: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        customer: { id: customer.id, customerId: customer.customerId, name: customer.name },
        work,
      },
      message: "Customer and work order created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "APPLY_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
