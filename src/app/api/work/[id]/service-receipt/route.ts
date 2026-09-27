import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { attachWorkFile, deleteWorkFile } from "@/services/workService";
import { PERMISSIONS } from "@/lib/constants";

// Attach an already-uploaded file (via /api/upload) as the current Service Receipt.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_SERVICE_RECEIPTS_UPLOAD);
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
    const attached = await attachWorkFile(
      params.id,
      "SERVICE_RECEIPT",
      {
        key: body.key,
        url: body.url,
        fileName: body.fileName,
        fileSize: Number(body.fileSize) || 0,
        mimeType: body.mimeType || "application/octet-stream",
      },
      auth.user
    );
    return NextResponse.json({ success: true, data: attached, message: "Service Receipt uploaded successfully" });
  } catch (error: any) {
    const isNotFound = error.message === "Work order not found" || error.message === "Uploaded file not found";
    return NextResponse.json(
      { success: false, error: { code: "SERVICE_RECEIPT_UPLOAD_ERROR", message: error.message } },
      { status: isNotFound ? 404 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, PERMISSIONS.WORK_SERVICE_RECEIPTS_DELETE);
  if ("status" in auth) return auth;

  try {
    const result = await deleteWorkFile(params.id, "SERVICE_RECEIPT", auth.user);
    return NextResponse.json({ success: true, data: result, message: "Service Receipt removed" });
  } catch (error: any) {
    const isNotFound = error.message === "Work order not found";
    const noAsset = error.message === "No service receipt found to delete";
    return NextResponse.json(
      { success: false, error: { code: "SERVICE_RECEIPT_DELETE_ERROR", message: error.message } },
      { status: isNotFound ? 404 : noAsset ? 409 : 500 }
    );
  }
}