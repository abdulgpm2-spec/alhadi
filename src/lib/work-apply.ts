/**
 * Uploads pre-selected citizen document files and attaches them to a freshly
 * created work order's document checklist (matched by document name).
 * Shared by the Services Apply popup and the New Work Order page.
 */
export async function attachDocFilesToWork(
  workDbId: string,
  docFiles: Record<string, File>
): Promise<{ attached: number; failed: number }> {
  const entries = Object.entries(docFiles);
  if (entries.length === 0) return { attached: 0, failed: 0 };

  const detailRes = await fetch(`/api/work/${workDbId}`);
  const detailJson = await detailRes.json();
  if (!detailJson.success) throw new Error("Work created, but failed to load its document checklist");
  const checklist: any[] = detailJson.data?.documents || [];

  let attached = 0;
  let failed = 0;
  for (const [docName, file] of entries) {
    try {
      const target = checklist.find(
        (d) => d.documentName?.toLowerCase() === docName.toLowerCase()
      );
      if (!target) {
        failed += 1;
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upJson = await upRes.json();
      if (!upJson.success) throw new Error(upJson.error?.message || "File upload failed");
      const atRes = await fetch(`/api/work/${workDbId}/documents/${target.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: "UPLOADED",
          fileUrl: upJson.data.url,
          fileName: upJson.data.fileName,
          fileSize: upJson.data.fileSize,
          mimeType: upJson.data.mimeType,
        }),
      });
      const atJson = await atRes.json();
      if (!atJson.success) throw new Error(atJson.error?.message || "Failed to attach document");
      attached += 1;
    } catch {
      failed += 1;
    }
  }
  return { attached, failed };
}

/** Effective rate visible to a role: agents see agent rate (fallback customer), staff sees customer rate. */
export function clientRateFor(
  svc: { agentPrice?: number | null; customerPrice?: number | null } | null | undefined,
  isAgent: boolean
): number {
  if (!svc) return 0;
  if (isAgent) return Number(svc.agentPrice) || Number(svc.customerPrice) || 0;
  return Number(svc.customerPrice) || 0;
}
