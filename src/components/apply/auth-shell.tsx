import Link from "next/link";
import { type ReactNode } from "react";
import { Container } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";

/**
 * 로그인/회원가입/계정찾기 공통 셸 — 좌측 브랜드 패널 + 우측 폼 카드.
 */
export function AuthShell({
  kicker,
  title,
  desc,
  aside,
  children,
}: {
  kicker: string;
  title: string;
  desc: string;
  /** 좌측 패널 하단 보조 콘텐츠 */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="bg-paper pt-32 sm:pt-40">
      <Container className="pb-24 sm:pb-28">
        <div className="overflow-hidden rounded-card border border-line bg-pure shadow-lift lg:grid lg:grid-cols-2">
          {/* ── 좌측 브랜드 패널 ─────────────────────────── */}
          <Reveal>
            <div className="mesh-ink grain-overlay relative flex h-full flex-col justify-between p-9 text-paper sm:p-12">
              <div>
                <span className="kicker text-accent">{kicker}</span>
                <h1 className="text-display mt-6 text-paper">{title}</h1>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-paper/75">
                  {desc}
                </p>
              </div>
              <div className="mt-12">
                {aside}
                <p className="mt-8 text-sm text-paper/50">
                  아르코에듀 인재채용
                </p>
              </div>
            </div>
          </Reveal>

          {/* ── 우측 폼 ──────────────────────────────────── */}
          <Reveal delay={0.08}>
            <div className="p-7 sm:p-12">{children}</div>
          </Reveal>
        </div>
      </Container>
    </main>
  );
}

/** 보조 링크 라인 */
export function AuthFootLinks({
  links,
}: {
  links: { label: string; href: string }[];
}) {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-6 text-sm">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="font-medium text-accent-ink transition-colors hover:text-accent-deep"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
