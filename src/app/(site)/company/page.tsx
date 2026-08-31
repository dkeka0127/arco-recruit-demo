import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  COMPANY_GROUP,
  COMPANY_HISTORY,
  BUSINESS_CATEGORIES,
  BUSINESS_BRANDS,
} from "@/lib/data/company";
import { Container, Kicker } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { BrandScene } from "@/components/visuals/brand-scene";
import { COMPANY_PAGES } from "@/components/company/company-nav";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "회사소개 | 아르코채용",
  description:
    "올바른 정보의 나눔. 1999년 출발한 아르코에듀의 철학, 사업분야, 역사, 장학제도를 소개합니다.",
};

// 연혁 연수: 최초(1998) ~ 최신(2025)
const FOUNDED_YEAR = Number(
  COMPANY_HISTORY[COMPANY_HISTORY.length - 1].year.replace(".", ""),
);
const LATEST_YEAR = Number(COMPANY_HISTORY[0].year.replace(".", ""));
const HISTORY_SPAN = LATEST_YEAR - FOUNDED_YEAR;
const TOTAL_ITEMS = COMPANY_HISTORY.reduce((n, y) => n + y.items.length, 0);

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/company/group": "올바른 정보의 공유를 실천하는 교육그룹과 ARCO MOVIE",
  "/company/philosophy": "나눔의 철학과 창학정신, 그리고 함께함의 가치",
  "/company/sharing": "교육을 통한 사회 환원, 아르코에듀의 나눔 활동",
  "/company/business": "어학·공무원·취업·금융까지, 끊임없이 성장하는 사업분야",
  "/company/history": "1998년부터 오늘까지, 하루하루 발전하는 아르코에듀의 역사",
  "/company/scholarship": "ARCO Scholarship — 사회에 기여하는 인재 양성",
  "/company/location": "가온캠퍼스 본관과 별관, 아르코에듀로 오시는 길",
};

// 카드 역할별 차등 — featured(다크), accent(블루 강조), 나머지 라이트
const CARD_ROLE: Record<string, "featured" | "accent" | "default"> = {
  "/company/group": "featured",
  "/company/business": "accent",
  "/company/history": "accent",
};

export default function CompanyHubPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden pt-32 pb-24 text-paper sm:pt-40 sm:pb-32">
        <span className="grain-overlay" />
        <span aria-hidden className="bg-grid-dark pointer-events-none absolute inset-0 opacity-50" />
        <Container className="relative">
          <div className="grid items-end gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              <Reveal>
                <Kicker dark>{COMPANY_GROUP.heading}</Kicker>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="text-hero mt-7 text-paper">
                  올바른 정보의
                  <br />
                  <span className="font-semibold text-accent">나눔</span>
                  을 실천합니다
                </h1>
              </Reveal>
            </div>
            <Reveal delay={0.12}>
              <p className="max-w-md text-lg leading-relaxed text-muted-ink lg:pb-3">
                {COMPANY_GROUP.paragraphs[1]}
              </p>
            </Reveal>
          </div>

          {/* stats */}
          <Reveal delay={0.18}>
            <div className="mt-16 grid gap-px overflow-hidden rounded-card border border-paper/10 bg-paper/10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: HISTORY_SPAN, suffix: "년", label: `${FOUNDED_YEAR}년 출발 — 함께 성장한 시간` },
                { value: BUSINESS_BRANDS.length, suffix: "개", label: "전문화된 교육 브랜드" },
                { value: BUSINESS_CATEGORIES.length, suffix: "개", label: "끊임없이 확장하는 사업 분야" },
                { value: TOTAL_ITEMS, suffix: "건", label: "기록된 발자취" },
              ].map((s) => (
                <div key={s.label} className="bg-ink px-7 py-9">
                  <div className="flex items-baseline gap-1">
                    <CountUp
                      to={s.value}
                      className="text-5xl font-semibold tracking-tight text-paper tabular-nums sm:text-6xl"
                    />
                    <span className="text-2xl font-medium text-accent">
                      {s.suffix}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-ink">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Intro paragraph ───────────────────────────────── */}
      <section className="bg-sky-veil py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.5fr_1fr] lg:gap-16">
            <Reveal>
              <div className="lg:sticky lg:top-32">
                <Kicker>About ARCO</Kicker>
                <div className="surface-card mt-6 aspect-[4/3] overflow-hidden rounded-card">
                  <BrandScene variant="growth" tone="light" />
                </div>
              </div>
            </Reveal>
            <div className="flex flex-col gap-8">
              {COMPANY_GROUP.paragraphs.map((p, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <p className="text-xl leading-relaxed text-ink/85 sm:text-2xl sm:leading-relaxed">
                    {p}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 7개 하위 네비 (역할별 차등) ───────────────────── */}
      <section className="bg-paper-dim py-20 sm:py-28">
        <Container>
          <Reveal>
            <div className="flex flex-col gap-5">
              <Kicker>Explore</Kicker>
              <h2 className="text-display max-w-2xl">
                아르코에듀를
                <br />더 깊이 들여다보기
              </h2>
            </div>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {COMPANY_PAGES.map((p) => {
              const role = CARD_ROLE[p.href] ?? "default";
              const featured = role === "featured";
              const accent = role === "accent";
              return (
                <RevealItem
                  key={p.href}
                  className={cn(featured && "md:col-span-2 lg:row-span-2")}
                >
                  <Link
                    href={p.href}
                    className={cn(
                      "group flex h-full flex-col justify-between gap-6 overflow-hidden rounded-card border p-8 transition-all duration-300",
                      featured &&
                        "mesh-ink relative min-h-[260px] border-paper/10 text-paper hover:border-accent/40 lg:min-h-[420px]",
                      accent &&
                        "border-accent/30 bg-accent-soft hover:border-accent hover:shadow-lift",
                      role === "default" &&
                        "border-line bg-pure hover:border-accent/50 hover:shadow-lift",
                    )}
                  >
                    {featured && (
                      <span aria-hidden className="absolute inset-0 -z-0 opacity-70">
                        <BrandScene variant="share" tone="dark" />
                      </span>
                    )}
                    <div className="relative flex items-start justify-between gap-6">
                      <span
                        className={cn(
                          "font-mono text-xs tracking-[0.25em]",
                          featured ? "text-accent" : "text-muted-ink",
                        )}
                      >
                        {p.index} / 07
                      </span>
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                          featured
                            ? "border-paper/25 text-paper group-hover:border-accent group-hover:bg-accent group-hover:text-ink"
                            : "border-line text-muted-ink group-hover:border-accent group-hover:bg-accent group-hover:text-ink",
                        )}
                      >
                        <ArrowUpRight className="size-5" />
                      </span>
                    </div>
                    <div className="relative flex flex-col gap-3">
                      <h3
                        className={cn(
                          "font-semibold tracking-tight",
                          featured ? "text-3xl text-paper sm:text-4xl" : "text-2xl text-ink",
                        )}
                      >
                        {p.label}
                      </h3>
                      <p
                        className={cn(
                          "max-w-sm text-sm leading-relaxed",
                          featured ? "text-muted-ink" : accent ? "text-accent-ink" : "text-muted",
                        )}
                      >
                        {PAGE_DESCRIPTIONS[p.href]}
                      </p>
                    </div>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-24">
        <Container className="flex flex-col items-center gap-8 text-center">
          <Reveal>
            <p className="max-w-2xl text-2xl text-accent-ink">
              {COMPANY_GROUP.paragraphs[2]}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/company/group" size="lg" arrow>
                아르코에듀 보기
              </Button>
              <Button href="/jobs" variant="outline" size="lg">
                진행중인 채용 보기
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
