import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { getCategories, createCategory } from "@/services/serviceCatalogService";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  try {
    const categories = await getCategories(auth.user);
    return NextResponse.json({ success: true, data: categories });
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
        { success: false, error: { code: "VALIDATION_ERROR", message: "Category Name is required" } },
        { status: 400 }
      );
    }

    const category = await createCategory(
      {
        name: body.name.trim(),
        description: body.description?.trim() || null,
      },
      auth.user
    );

    return NextResponse.json({
      success: true,
      data: category,
      message: "Category created successfully",
    });
  } catch (error: any) {
    const isConflict = error.message && error.message.includes("already exists");
    return NextResponse.json(
      { success: false, error: { code: isConflict ? "DUPLICATE_ERROR" : "CREATE_ERROR", message: error.message } },
      { status: isConflict ? 409 : 500 }
    );
  }
}
