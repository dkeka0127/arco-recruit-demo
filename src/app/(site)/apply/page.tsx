import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { APPLY_MAIN } from "@/lib/data/apply";
import { Container, Kicker } from "@/components/ui/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { BrandScene } from "@/components/visuals/brand-scene";

export const metadata: Metadata = {
  title: "입사지원서 작성 | 아르코채용",
  description:
    "온라인 입사지원서를 작성하실 수 있습니다. 일반직·영어연구원·전문강사·상시지원(인재DB등록) 중 지원 분류를 선택하세요.",
};

type BrandVariant = "people" | "share" | "content" | "global" | "growth" | "campus";

/** 카테고리 카드(원문) → 라우트 + 대상/성격 매핑 (위계 강화) */
const CARD_ROUTES: Record<
  string,
  {
    href: string;
    en: string;
    who: string;
    desc: string;
    brand: BrandVariant;
    featured?: boolean;
  }
> = {
  일반직: {
    href: "/apply/general",
    en: "General",
    who: "진행중인 공고에 지원하는 분",
    desc: "진행중인 채용공고를 선택해 일반직 입사지원서를 작성합니다. 가장 일반적인 지원 경로입니다.",
    brand: "growth",
    featured: true,
  },
  전문강사: {
    href: "/apply/teacher",
    en: "Instructor",
    who: "강의에 열정을 지닌 전문강사",
    desc: "교육에 대한 뜨거운 열정과 전문성을 지닌 전문강사 지원서를 작성합니다.",
    brand: "campus",
  },
  영어연구원: {
    href: "/apply/english-research",
    en: "English Research",
    who: "영어 콘텐츠 연구 인재",
    desc: "영어연구원 상시 지원 DB에 입사지원서를 등록하실 수 있습니다.",
    brand: "global",
  },
  "상시지원 (인재DB등록)": {
    href: "/apply/talent-pool",
    en: "Talent Pool",
    who: "맞는 공고를 기다리는 모든 분",
    desc: "지금 맞는 공고가 없어도 인재 DB에 상시 등록해 두면 채용 소요 발생 시 우선 검토됩니다.",
    brand: "share",
  },
};

/** 바로가기(원문) → 라우트 매핑 */
const SHORTCUT_ROUTES: Record<string, string> = {
  "일반직 채용공고 바로가기  >": "/jobs/general",
  "전문강사 채용공고 바로가기  >": "/jobs/teacher",
  "영어연구원 채용공고 바로가기  >": "/jobs/english-research",
  "파트타임 채용공고 바로가기  >": "/jobs",
  "일반직 직무소개 바로가기  >": "/people",
};

export default function ApplyHubPage() {
  return (
    <main className="bg-paper bg-grid pt-32 sm:pt-40">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="pb-12 sm:pb-16">
        <Container>
          <Reveal>
            <Kicker>Application</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6">{APPLY_MAIN.banner.title}</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {APPLY_MAIN.banner.desc}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-8 text-xl font-semibold leading-relaxed tracking-tight text-ink sm:text-2xl">
              {APPLY_MAIN.illustrationText.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── 지원 유형 카드 4종 (대상별 위계) ───────────────── */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <RevealGroup className="grid gap-5 sm:grid-cols-2" stagger={0.06}>
            {APPLY_MAIN.categoryCards.map((label) => {
              const route = CARD_ROUTES[label];
              return (
                <RevealItem
                  key={label}
                  className={route.featured ? "sm:col-span-2" : undefined}
                >
                  <Link
                    href={route.href}
                    className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-pure transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift"
                  >
                    {route.featured ? (
                      <div className="grid sm:grid-cols-[1.5fr_1fr]">
                        <div className="p-8 sm:p-9">
                          <div className="flex items-start justify-between">
                            <span className="kicker text-accent-ink">
                              {route.en}
                            </span>
                            <span className="flex size-10 items-center justify-center rounded-full border border-line text-ink transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                              <ArrowUpRight className="size-5" />
                            </span>
                          </div>
                          <p className="mt-7 text-xs font-medium uppercase tracking-wide text-muted-ink">
                            For · {route.who}
                          </p>
                          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
                            {label}
                          </h2>
                          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted">
                            {route.desc}
                          </p>
                        </div>
                        <div className="relative hidden min-h-[200px] overflow-hidden bg-ink sm:block">
                          <BrandScene
                            variant={route.brand}
                            tone="dark"
                            className="absolute inset-0"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col p-8">
                        <div className="flex items-start justify-between">
                          <span className="kicker text-accent-ink">
                            {route.en}
                          </span>
                          <span className="flex size-10 items-center justify-center rounded-full border border-line text-ink transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                            <ArrowUpRight className="size-5" />
                          </span>
                        </div>
                        <p className="mt-7 text-xs font-medium uppercase tracking-wide text-muted-ink">
                          For · {route.who}
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">
                          {label}
                        </h2>
                        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                          {route.desc}
                        </p>
                      </div>
                    )}
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 바로가기 ──────────────────────────────────────── */}
      <section className="pb-24 sm:pb-28">
        <Container>
          <Reveal>
            <div className="surface-card rounded-card p-7 sm:p-9">
              <span className="kicker text-accent-ink">Quick Links</span>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-ink">
                바로가기
              </h3>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {APPLY_MAIN.shortcuts.map((label) => {
                  const href = SHORTCUT_ROUTES[label] ?? "/jobs";
                  return (
                    <li key={label}>
                      <Link
                        href={href}
                        className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-[0.95rem] font-medium text-ink transition-colors hover:bg-paper-dim"
                      >
                        <span>{label}</span>
                        <ArrowRight className="size-4 text-muted-ink transition-transform group-hover:translate-x-1 group-hover:text-accent-ink" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
