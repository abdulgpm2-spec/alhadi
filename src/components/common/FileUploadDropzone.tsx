"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";

interface FileUploadDropzoneProps {
  onUploadSuccess: (fileData: { url: string; key: string; fileName: string; fileSize: number; mimeType: string }) => void;
  label?: string;
  accept?: string;
}

export function FileUploadDropzone({
  onUploadSuccess,
  label = "Upload file (PDF, JPG, PNG up to 10MB)",
  accept = ".pdf,.jpg,.jpeg,.png",
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    // Check size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum 10MB limit");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to upload file");
      }

      setUploadedFile({ name: file.name, url: json.data.url });
      onUploadSuccess(json.data);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-5 rounded-lg border-2 border-dashed transition-all cursor-pointer text-center ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50"
            : "border-slate-300 hover:border-emerald-500 bg-slate-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center py-2 space-y-2">
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
            <span className="text-xs font-medium text-slate-700">Uploading document...</span>
          </div>
        ) : uploadedFile ? (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-[200px]">{uploadedFile.name}</span>
            <span className="text-[10px] text-emerald-600">(Click to replace)</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-1">
            <UploadCloud className="h-7 w-7 text-slate-400" />
            <p className="text-xs font-medium text-slate-700">{label}</p>
            <p className="text-[11px] text-slate-400">Drag & drop or browse</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
