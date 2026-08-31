import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

type Variant = "primary" | "accent" | "outline" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:bg-ink-700 shadow-[0_10px_30px_-12px_rgba(10,10,11,0.5)] hover:shadow-[0_16px_40px_-12px_rgba(10,10,11,0.6)]",
  accent:
    "bg-accent text-ink hover:bg-accent-deep hover:text-white shadow-[0_10px_30px_-12px_rgba(82,179,216,0.65)]",
  outline:
    "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:bg-ink/5",
  light:
    "bg-paper text-ink hover:bg-white border border-transparent hover:border-line",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-14 px-8 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  arrow?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  arrow,
  href,
  type = "button",
  ...rest
}: CommonProps &
  (
    | ({ href: string } & React.ComponentProps<typeof Link>)
    | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  )) {
  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
      )}
    </>
  );
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href !== undefined) {
    return (
      <Link href={href} className={classes} {...(rest as object)}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type={type as "button" | "submit" | "reset"}
      className={classes}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
