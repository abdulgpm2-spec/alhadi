import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { getServices, getServicesCatalog, createService } from "@/services/serviceCatalogService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const status = (url.searchParams.get("status") as any) || undefined;
  // Agents always see active catalog services only (inactive hidden, server-enforced)
  const activeOnly = url.searchParams.get("activeOnly") === "true" || auth.user.role === "AGENT";
  const isCatalog = url.searchParams.get("catalog") === "true";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);

  try {
    if (isCatalog || search || status || categoryId) {
      const result = await getServicesCatalog(auth.user, {
        search,
        categoryId,
        status,
        activeOnly,
        page,
        pageSize,
      });
      return NextResponse.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }

    const services = await getServices(auth.user, activeOnly);
    return NextResponse.json({ success: true, data: services });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.SERVICES_CREATE);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Service Name is required" } },
        { status: 400 }
      );
    }

    const price = body.customerPrice !== undefined ? Number(body.customerPrice) : (body.amount !== undefined ? Number(body.amount) : 0);

    const service = await createService({
      name: body.name.trim(),
      categoryId: body.categoryId || null,
      serviceType: body.serviceType || "NEW",
      passwordRequired: body.passwordRequired !== undefined ? Boolean(body.passwordRequired) : false,
      uploadRequired: body.uploadRequired !== undefined ? Boolean(body.uploadRequired) : false,
      customerPrice: price,
      agentPrice: body.agentPrice !== undefined ? Number(body.agentPrice) : 0,
      estimatedDays: body.estimatedDays !== undefined ? Number(body.estimatedDays) : 3,
      description: body.description,
      employeeInstructions: body.employeeInstructions,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      requiredDocuments: body.requiredDocuments,
      correctionOptions: body.correctionOptions,
      customFields: body.customFields,
      user: auth.user,
    });

    return NextResponse.json({
      success: true,
      data: service,
      message: "Service created successfully",
    });
  } catch (error: any) {
    const isConflict = error.message && error.message.includes("already exists");
    return NextResponse.json(
      { success: false, error: { code: isConflict ? "DUPLICATE_ERROR" : "CREATE_ERROR", message: error.message } },
      { status: isConflict ? 409 : 500 }
    );
  }
}
