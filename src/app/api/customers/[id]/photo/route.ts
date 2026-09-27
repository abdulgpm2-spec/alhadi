import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { attachCustomerPhoto, deleteCustomerPhoto } from "@/services/customerService";
import { PERMISSIONS } from "@/lib/constants";

// Attach an already-uploaded file (via /api/upload) as the current Customer profile photo.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.CUSTOMERS_UPDATE);
  if ("status" in auth) return auth;

  if (auth.user.role === "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Administrators cannot upload documents. Only Employees and Agents can upload.",
        },
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    if (!body.key || !body.fileName) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_FILE_DATA", message: "Uploaded file metadata is required" } },
        { status: 400 }
      );
    }
    const attached = await attachCustomerPhoto(
      params.id,
      {
        key: body.key,
        url: body.url,
        fileName: body.fileName,
        fileSize: Number(body.fileSize) || 0,
        mimeType: body.mimeType || "application/octet-stream",
      },
      auth.user
    );
    return NextResponse.json({ success: true, data: attached, message: "Profile photo updated successfully" });
  } catch (error: any) {
    const isNotFound = error.message === "Customer not found or unauthorized";
    const noUpload = error.message === "Uploaded file not found";
    return NextResponse.json(
      { success: false, error: { code: "PHOTO_UPLOAD_ERROR", message: error.message } },
      { status: isNotFound ? 404 : noUpload ? 409 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.CUSTOMERS_UPDATE);
  if ("status" in auth) return auth;

  try {
    const result = await deleteCustomerPhoto(params.id, auth.user);
    return NextResponse.json({ success: true, data: result, message: "Profile photo removed" });
  } catch (error: any) {
    const isNotFound = error.message === "Customer not found or unauthorized";
    const noAsset = error.message === "No customer photo found to delete";
    return NextResponse.json(
      { success: false, error: { code: "PHOTO_DELETE_ERROR", message: error.message } },
      { status: isNotFound ? 404 : noAsset ? 409 : 500 }
    );
  }
}
