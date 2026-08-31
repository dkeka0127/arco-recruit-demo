import Link from "next/link";
import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { APPLY_LNB } from "@/lib/data/apply";
import { Container } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/** LNB(원문) 라벨 → 라우트 매핑 */
const LNB_HREF: Record<string, string> = {
  "입사지원서 작성": "/apply",
  "일반직 입사지원": "/apply/general",
  "영어연구원 입사지원": "/apply/english-research",
  "전문강사 입사지원": "/apply/teacher",
  "상시지원 (인재 DB 등록)": "/apply/talent-pool",
  "입사지원서 수정": "/apply/modify",
  "나의지원결과 확인": "/apply/result",
};

/**
 * 입사지원 공통 셸 — 좌측 LNB(데스크탑) + 상단 탭(모바일) + 본문.
 * 모든 /apply/* 페이지가 동일한 내비게이션 구조를 공유한다.
 */
export function ApplyShell({
  active,
  banner,
  children,
}: {
  /** APPLY_LNB 중 현재 활성 라벨 */
  active: string;
  banner: { title: string; desc: string };
  children: ReactNode;
}) {
  return (
    <Container className="pb-24 sm:pb-28">
      {/* ── 배너 ─────────────────────────────────────────── */}
      <Reveal>
        <header className="mb-10 border-b border-line pb-8">
          <span className="kicker text-accent-ink">Application</span>
          <h1 className="text-display mt-5">{banner.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            {banner.desc}
          </p>
        </header>
      </Reveal>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        {/* ── LNB: 모바일 가로 스크롤 탭 ─────────────────── */}
        <nav className="mb-8 lg:hidden">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {APPLY_LNB.map((label) => {
              const href = LNB_HREF[label];
              const isActive = label === active;
              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium tracking-tight transition-colors",
                    isActive
                      ? "border-transparent bg-ink text-paper"
                      : "border-line bg-pure text-muted hover:border-accent/40 hover:text-ink",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── LNB: 데스크탑 사이드 ───────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <span className="kicker text-accent-ink">입사지원</span>
            <ul className="mt-5 space-y-1">
              {APPLY_LNB.map((label) => {
                const href = LNB_HREF[label];
                const isActive = label === active;
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-4 py-3 text-[0.95rem] tracking-tight transition-colors",
                        isActive
                          ? "bg-ink font-semibold text-paper"
                          : "text-muted hover:bg-paper-dim hover:text-ink",
                      )}
                    >
                      <span>{label}</span>
                      <ChevronRight
                        className={cn(
                          "size-4 transition-transform",
                          isActive
                            ? "text-accent"
                            : "text-muted-ink group-hover:translate-x-0.5",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* ── 본문 ─────────────────────────────────────── */}
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
