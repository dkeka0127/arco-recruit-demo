import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8",
        size === "default" && "max-w-[1240px]",
        size === "wide" && "max-w-[1480px]",
        size === "narrow" && "max-w-[820px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Kicker({
  children,
  className,
  dark,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        "kicker inline-flex items-center gap-2",
        dark ? "text-accent" : "text-accent-ink",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-px w-6",
          dark ? "bg-accent/70" : "bg-accent",
        )}
      />
      {children}
    </span>
  );
}

type BadgeTone = "neutral" | "accent" | "ink" | "outline" | "signal" | "soft";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-paper-dim text-muted",
    accent: "bg-accent text-ink",
    ink: "bg-ink text-paper",
    outline: "border border-ink/15 text-ink",
    signal: "bg-signal/12 text-signal",
    soft: "bg-accent-soft text-accent-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-tight",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Section heading block: kicker + display title + optional lead */
export function SectionHead({
  kicker,
  title,
  lead,
  align = "left",
  className,
}: {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {kicker && <Kicker>{kicker}</Kicker>}
      <h2 className="text-display max-w-3xl">{title}</h2>
      {lead && (
        <p
          className={cn(
            "max-w-xl text-lg leading-relaxed text-muted",
            align === "center" && "mx-auto",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
