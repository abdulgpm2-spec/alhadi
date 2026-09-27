import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { fileStorageService } from "@/services/fileStorageService";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  // Document upload is restricted to Employee and Agent roles.
  // Admins can view/download documents but cannot upload them.
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
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "NO_FILE", message: "No file uploaded" } },
        { status: 400 }
      );
    }

    // Limit file size to 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: "FILE_TOO_LARGE", message: "File size cannot exceed 10MB" } },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await fileStorageService.upload(
      buffer,
      file.name,
      file.type || "application/octet-stream",
      auth.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
        fileName: file.name,
        fileSize: result.size,
        mimeType: file.type,
      },
      message: "File uploaded successfully",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: { code: "UPLOAD_ERROR", message: error.message || "Failed to upload file" } },
      { status: 500 }
    );
  }
}
