import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 라벨 + 에러 메시지를 감싸는 필드 래퍼 */
export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
        {label}
        {required && <span className="text-accent-ink">*</span>}
      </span>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-accent-ink">{error}</p>
      )}
    </label>
  );
}

const inputBase =
  "h-12 w-full rounded-xl border bg-pure px-4 text-ink outline-none transition-colors placeholder:text-muted-ink focus:border-accent";

export function TextInput({
  error,
  className,
  ...rest
}: { error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(inputBase, error ? "border-accent-deep" : "border-line", className)}
      {...rest}
    />
  );
}

export function TextArea({
  error,
  className,
  ...rest
}: { error?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border bg-pure px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted-ink focus:border-accent",
        error ? "border-accent-deep" : "border-line",
        className,
      )}
      {...rest}
    />
  );
}

export function Select({
  error,
  className,
  children,
  ...rest
}: { error?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          inputBase,
          "appearance-none pr-10",
          error ? "border-accent-deep" : "border-line",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
        ▾
      </span>
    </div>
  );
}
