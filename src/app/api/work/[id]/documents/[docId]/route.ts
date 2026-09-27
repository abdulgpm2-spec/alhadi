import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateWorkDocument } from "@/services/workService";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  const auth = await requireAuth(req);
  if ("status" in auth) return auth;

  try {
    const body = await req.json();
    // File attach (upload) is restricted to Employee and Agent roles.
    // State-only actions (Verify / Reject) remain allowed for Admins.
    const isFileAttach = Boolean(body.fileUrl || body.fileName || body.fileSize || body.mimeType);
    if (isFileAttach && auth.user.role === "ADMIN") {
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
    const updated = await updateWorkDocument(params.docId, body, auth.user);
    return NextResponse.json({
      success: true,
      data: updated,
      message: "Document updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DOCUMENT_UPDATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
