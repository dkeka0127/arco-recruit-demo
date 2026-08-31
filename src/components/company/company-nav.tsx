import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { COMPANY_LNB } from "@/lib/data/site";
import { cn } from "@/lib/utils";

/** 회사소개 7개 하위 페이지 라우트 매핑 (LNB 원문 라벨 ↔ slug) */
export const COMPANY_PAGES = [
  { label: COMPANY_LNB[0], href: "/company/group", index: "01" },
  { label: COMPANY_LNB[1], href: "/company/philosophy", index: "02" },
  { label: COMPANY_LNB[2], href: "/company/sharing", index: "03" },
  { label: COMPANY_LNB[3], href: "/company/business", index: "04" },
  { label: COMPANY_LNB[4], href: "/company/history", index: "05" },
  { label: COMPANY_LNB[5], href: "/company/scholarship", index: "06" },
  { label: COMPANY_LNB[6], href: "/company/location", index: "07" },
] as const;

/**
 * 회사소개 하위 페이지 상단 가로 LNB.
 * Server Component — 현재 경로(active)만 prop으로 받는다.
 */
export function CompanyNav({ active }: { active: string }) {
  return (
    <nav
      aria-label="회사소개 하위 메뉴"
      className="border-y border-line bg-pure/70 backdrop-blur"
    >
      <div className="no-scrollbar mx-auto flex w-full max-w-[1480px] gap-1 overflow-x-auto px-5 sm:px-8">
        {COMPANY_PAGES.map((p) => {
          const isActive = p.href === active;
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative shrink-0 whitespace-nowrap px-4 py-4 text-sm font-medium tracking-tight transition-colors sm:px-5",
                isActive
                  ? "text-ink"
                  : "text-muted hover:text-accent-ink",
              )}
            >
              {p.label}
              {isActive && (
                <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent sm:inset-x-5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** 하위 페이지 공통 헤더 (kicker + title + desc) */
export function CompanyHeader({
  kicker,
  title,
  desc,
  index,
}: {
  kicker: string;
  title: React.ReactNode;
  desc?: string;
  index?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="kicker text-accent-ink">
          <span className="mr-2 inline-block h-px w-6 bg-accent align-middle" />
          {kicker}
        </span>
        {index && (
          <span className="font-mono text-xs tracking-[0.25em] text-muted-ink">
            {index} / 07
          </span>
        )}
      </div>
      <h1 className="text-hero">{title}</h1>
      {desc && <p className="max-w-2xl text-lg leading-relaxed text-muted">{desc}</p>}
    </div>
  );
}

/** 하위 페이지 하단 — 다음 페이지로 안내하는 푸터 링크 밴드 */
export function CompanyPager({ current }: { current: string }) {
  const idx = COMPANY_PAGES.findIndex((p) => p.href === current);
  if (idx === -1) return null;
  const prev = idx > 0 ? COMPANY_PAGES[idx - 1] : null;
  const next =
    idx < COMPANY_PAGES.length - 1 ? COMPANY_PAGES[idx + 1] : null;

  return (
    <div className="mt-20 grid gap-4 border-t border-line pt-10 sm:mt-28 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-col gap-1.5 rounded-card border border-line bg-pure px-6 py-5 transition-colors hover:border-accent/50"
        >
          <span className="font-mono text-[0.7rem] tracking-[0.25em] text-muted-ink">
            PREV · {prev.index}
          </span>
          <span className="text-base font-medium text-ink transition-colors group-hover:text-accent-ink">
            {prev.label}
          </span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <Link
          href={next.href}
          className="group flex flex-col items-end gap-1.5 rounded-card border border-line bg-pure px-6 py-5 text-right transition-colors hover:border-accent/50 sm:col-start-2"
        >
          <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] tracking-[0.25em] text-muted-ink">
            NEXT · {next.index}
            <ArrowUpRight className="size-3.5" />
          </span>
          <span className="text-base font-medium text-ink transition-colors group-hover:text-accent-ink">
            {next.label}
          </span>
        </Link>
      )}
    </div>
  );
}
