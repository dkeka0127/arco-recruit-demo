import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Lightbulb, Code2, GraduationCap, ClipboardList, Building2, type LucideIcon } from "lucide-react";
import { JOB_INTROS, JOB_INTRO_ORDER, JOB_INTRO_HEADER } from "@/lib/data/people";
import { Container, Kicker } from "@/components/ui/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "직무소개 | 아르코 피플 | 아르코채용",
  description:
    "기획·콘텐츠 · 개발·디자인 · 교육·연구 · 운영·관리 · 경영지원. 아르코에듀의 19개 직무를 분야별로 소개합니다.",
};

/** 직무명 → slug id (그리드 순서 보존을 위해 이름으로 매핑) */
const ID_BY_NAME = new Map(JOB_INTROS.map((j) => [j.name, j.id]));
/** 직무명 → 헤드라인 (카드 보조 카피) */
const HEADLINE_BY_NAME = new Map(JOB_INTROS.map((j) => [j.name, j.headline]));

interface Category {
  key: string;
  en: string;
  ko: string;
  desc: string;
  icon: LucideIcon;
  /** JOB_INTRO_ORDER 의 직무명 (분류) */
  roles: string[];
}

/** 19개 직무 → 5개 분야 (직무명 기준 합리적 분류) */
const CATEGORIES: Category[] = [
  {
    key: "planning",
    en: "Planning & Content",
    ko: "기획·콘텐츠",
    desc: "교육 상품과 콘텐츠의 방향을 그리고, 시장과 학습자에게 닿게 하는 직무",
    icon: Lightbulb,
    roles: ["기획/마케팅", "금융콘텐츠 기획/개발", "교재기획/개발/편집", "유학원 기획/운영"],
  },
  {
    key: "tech",
    en: "Engineering & Design",
    ko: "개발·디자인",
    desc: "수백만 학습자가 만나는 서비스를 만들고, 안정적으로 운영하는 직무",
    icon: Code2,
    roles: ["PHP 프로그래머", "서버관리", "웹디자인", "웹퍼블리셔", "촬영/편집"],
  },
  {
    key: "research",
    en: "Education & Research",
    ko: "교육·연구",
    desc: "가장 잘 가르치는 방법을 연구하고, 학습 경험을 설계하는 직무",
    icon: GraduationCap,
    roles: ["영어연구", "중국어 연구", "평생교육 교수설계", "이러닝 교수설계"],
  },
  {
    key: "operation",
    en: "Service & Operation",
    ko: "운영·관리",
    desc: "학습자·기업 고객과 가장 가까이에서 교육 현장을 운영하는 직무",
    icon: ClipboardList,
    roles: ["학사기획/관리", "어학교육상담", "기업교육 운영"],
  },
  {
    key: "corporate",
    en: "Corporate Support",
    ko: "경영지원",
    desc: "사람·법무·재무로 아르코에듀의 토대를 든든하게 받치는 직무",
    icon: Building2,
    roles: ["인사", "법무", "재무/회계"],
  },
];

export default function JobIntroListPage() {
  return (
    <main className="pt-32 sm:pt-40">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="bg-sky-veil pb-14 sm:pb-16">
        <Container>
          <Reveal>
            <Kicker>Job Roles</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-hero mt-7 max-w-3xl">{JOB_INTRO_HEADER.title}</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              {JOB_INTRO_HEADER.desc}
            </p>
          </Reveal>
          {/* 분야 빠른 이동 */}
          <Reveal delay={0.14}>
            <div className="mt-9 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tracking-[0.2em] text-muted-ink">
                ROLES · {String(JOB_INTRO_ORDER.length).padStart(2, "0")}
              </span>
              <span className="mx-1 h-3.5 w-px bg-line-strong" />
              {CATEGORIES.map((c) => (
                <a
                  key={c.key}
                  href={`#${c.key}`}
                  className="rounded-full border border-line bg-pure px-3.5 py-1.5 text-sm font-medium tracking-tight text-accent-ink transition-colors hover:border-accent hover:text-accent-ink"
                >
                  {c.ko}
                  <span className="ml-1.5 text-xs text-muted-ink">
                    {c.roles.length}
                  </span>
                </a>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 분야별 직무 섹션 ───────────────────────────────── */}
      <section className="bg-paper pb-24 sm:pb-28">
        <Container>
          <div className="space-y-16 sm:space-y-20">
            {CATEGORIES.map((cat, ci) => {
              const Icon = cat.icon;
              return (
                <div key={cat.key} id={cat.key} className="scroll-mt-28">
                  {/* 분야 헤더 */}
                  <Reveal>
                    <div className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-card bg-ink text-paper">
                          <Icon className="size-6" strokeWidth={1.5} />
                        </span>
                        <div>
                          <p className="font-mono text-xs tracking-[0.2em] text-accent-ink uppercase">
                            {String(ci + 1).padStart(2, "0")} · {cat.en}
                          </p>
                          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-[1.7rem]">
                            {cat.ko}
                          </h2>
                        </div>
                      </div>
                      <p className="max-w-md text-[0.95rem] leading-relaxed text-muted sm:text-right">
                        {cat.desc}
                      </p>
                    </div>
                  </Reveal>

                  {/* 분야 내 직무 카드 */}
                  <RevealGroup
                    className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    stagger={0.04}
                  >
                    {cat.roles.map((name, ri) => {
                      const id = ID_BY_NAME.get(name) ?? null;
                      const headline = HEADLINE_BY_NAME.get(name);
                      const num = JOB_INTRO_ORDER.indexOf(name) + 1;
                      // 분야 첫 카드는 살짝 강조(더 큰 영역)
                      const lead = ri === 0;
                      const inner = (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-mono text-xs tracking-[0.18em] text-muted-ink">
                              {String(num).padStart(2, "0")}
                            </span>
                            {id && (
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                                <ArrowUpRight className="size-4.5" />
                              </span>
                            )}
                          </div>
                          <h3 className="mt-6 text-xl font-bold tracking-tight">
                            {name}
                          </h3>
                          {headline && (
                            <p
                              className={
                                "mt-2.5 line-clamp-2 text-[0.9rem] leading-relaxed " +
                                (lead ? "text-muted-ink" : "text-muted")
                              }
                            >
                              {headline}
                            </p>
                          )}
                        </>
                      );
                      return (
                        <RevealItem
                          key={name}
                          className={lead ? "lg:col-span-1" : undefined}
                        >
                          {id ? (
                            <Link
                              href={`/people/jobs/${id}`}
                              className={
                                "group flex h-full flex-col rounded-card border p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift " +
                                (lead
                                  ? "border-transparent bg-ink text-paper hover:border-accent/40"
                                  : "surface-card text-ink hover:border-accent/40")
                              }
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div className="flex h-full flex-col rounded-card border border-line bg-paper-dim p-7 text-muted">
                              {inner}
                            </div>
                          )}
                        </RevealItem>
                      );
                    })}
                  </RevealGroup>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </main>
  );
}
