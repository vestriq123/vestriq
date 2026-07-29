"use client";

import React, { useCallback, useRef, useState } from "react";
import { UploadCloud, CheckCircle2, XCircle, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface FileUploadDropzoneProps {
  label?: string;
  hint?: string;
  accept?: string;
  onUpload: (file: File) => Promise<string>;
  onUploaded: (url: string) => void;
  value?: string | null;
  error?: string;
}

export function FileUploadDropzone({
  label,
  hint = "PNG, JPG up to 5MB",
  accept = "image/*",
  onUpload,
  onUploaded,
  value,
  error,
}: FileUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(value ? "done" : "idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleFile = useCallback(
    async (file: File) => {
      setLocalError(null);
      if (!file.type.startsWith("image/")) {
        setLocalError("Please upload an image file");
        setStatus("error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setLocalError("File is too large — max 5MB");
        setStatus("error");
        return;
      }
      setPreview(URL.createObjectURL(file));
      setStatus("uploading");
      try {
        const url = await onUpload(file);
        setStatus("done");
        onUploaded(url);
      } catch (err) {
        console.error("Upload failed", err);
        setLocalError(err instanceof Error ? err.message : "Upload failed, please try again");
        setStatus("error");
      }
    },
    [onUpload, onUploaded]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[11px] text-text-muted uppercase tracking-wider font-semibold">{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors",
          dragging ? "border-brand-500 bg-brand-500/5" : "border-border-subtle hover:border-border-strong bg-surface-1",
          (localError || error) && "border-danger/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {preview ? (
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Upload preview" className="max-h-40 mx-auto rounded-lg object-contain" />
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold">
              {status === "uploading" && (
                <span className="flex items-center gap-1.5 text-brand-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                </span>
              )}
              {status === "done" && (
                <span className="flex items-center gap-1.5 text-profit">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                </span>
              )}
              {status === "error" && (
                <span className="flex items-center gap-1.5 text-danger">
                  <XCircle className="w-3.5 h-3.5" /> Upload failed — click to retry
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-text-muted mb-3">
              {status === "uploading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            </div>
            <p className="text-xs font-semibold text-text-primary">Drag & drop or click to upload</p>
            <p className="text-[11px] text-text-muted mt-1">{hint}</p>
          </>
        )}
      </div>
      {(localError || error) && (
        <p className="text-xs text-danger flex items-center gap-1">
          <ImageIcon className="w-3 h-3" /> {localError || error}
        </p>
      )}
    </div>
  );
}

export default FileUploadDropzone;
