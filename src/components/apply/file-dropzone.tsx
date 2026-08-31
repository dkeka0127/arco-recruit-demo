"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { recruit } from "@/lib/provider";
import type { UploadedFile } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCEPT = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const ACCEPT_LABEL = "PDF · PNG · JPG · WEBP";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 드래그앤드롭 파일 업로더.
 * PDF·이미지 검증 + 용량 검증 → recruit.uploadApplicationFile 호출 → UploadedFile[] 동기화.
 */
export function FileDropzone({
  value,
  onChange,
}: {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setError(null);

      const incoming = Array.from(fileList);
      const valid: File[] = [];
      for (const f of incoming) {
        const isImageExt = /\.(png|jpe?g|webp)$/i.test(f.name);
        const isPdfExt = /\.pdf$/i.test(f.name);
        if (!ACCEPT.includes(f.type) && !isImageExt && !isPdfExt) {
          setError(`"${f.name}" 은(는) 지원하지 않는 형식입니다. (${ACCEPT_LABEL})`);
          continue;
        }
        if (f.size > MAX_BYTES) {
          setError(`"${f.name}" 의 용량이 10MB를 초과합니다.`);
          continue;
        }
        valid.push(f);
      }
      if (valid.length === 0) return;

      setUploading(true);
      try {
        const uploaded = await Promise.all(
          valid.map((f) => recruit.uploadApplicationFile(f)),
        );
        onChange([...value, ...uploaded]);
      } catch {
        setError("파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setUploading(false);
      }
    },
    [onChange, value],
  );

  const removeFile = (id: string) => {
    onChange(value.filter((f) => f.id !== id));
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging
            ? "border-accent bg-accent-soft/60"
            : "border-line-strong bg-paper-dim/40 hover:border-accent/60 hover:bg-accent-soft/30",
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-pure text-accent-ink shadow-lift">
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <UploadCloud className="size-6" />
          )}
        </span>
        <p className="text-base font-medium text-ink">
          {uploading
            ? "업로드 중..."
            : "파일을 끌어다 놓거나 클릭하여 첨부"}
        </p>
        <p className="text-sm text-muted">
          {ACCEPT_LABEL} · 최대 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-accent-ink">{error}</p>
      )}

      {value.length > 0 && (
        <ul className="mt-4 space-y-2">
          {value.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-pure px-4 py-3"
            >
              <FileText className="size-5 shrink-0 text-accent-ink" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {f.name}
                </p>
                <p className="text-xs text-muted">{formatSize(f.size)}</p>
              </div>
              <CheckCircle2 className="size-4 shrink-0 text-signal" />
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                aria-label={`${f.name} 삭제`}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper-dim hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
