import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { JOB_POSTINGS, GENERAL_PROCESS_NOTES } from "@/lib/data/jobs";
import { Container, Kicker, SectionHead } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { JobCard } from "@/components/job-card";
import { BrandScene } from "@/components/visuals/brand-scene";

export const metadata: Metadata = {
  title: "채용공고 | 아르코채용",
  description:
    "아르코에듀의 일반직·영어연구원·전문강사·Foreign Recruiting 채용 채널과 공지사항을 확인하세요.",
};

type Channel = {
  key: string;
  label: string;
  en: string;
  href: string;
  desc: string;
  /** 카드 역할: 대표(일반직), 비주얼 채널, 보조(공지/Foreign) */
  role: "feature" | "channel" | "support";
  visual?: "people" | "global" | "content";
  meta?: string;
};

const CHANNELS: Channel[] = [
  {
    key: "general",
    label: "일반직채용",
    en: "General Positions",
    href: "/jobs/general",
    desc: "아르코에듀의 모든 사업분야에 걸쳐 직무에 맞게 업무를 수행하는 일반직 채용입니다. 개발·기획·연구·학사·디자인 등 폭넓은 직무가 열려 있습니다.",
    role: "feature",
    meta: `${JOB_POSTINGS.length}건 진행중`,
  },
  {
    key: "english-research",
    label: "영어연구원모집",
    en: "English Research",
    href: "/jobs/english-research",
    desc: "아르코에듀 영어 교재·콘텐츠를 연구하고 개발하는 영어연구원을 모집합니다.",
    role: "channel",
    visual: "content",
  },
  {
    key: "teacher",
    label: "전문강사모집",
    en: "Professional Instructors",
    href: "/jobs/teacher",
    desc: "어학·자격증 등 각 분야의 전문 강사를 상시 모집합니다.",
    role: "channel",
    visual: "people",
  },
  {
    key: "foreign",
    label: "Foreign Recruiting",
    en: "Foreign Recruiting",
    href: "/jobs/foreign",
    desc: "Writer / Editor positions for foreign applicants at ARCO Edu.",
    role: "channel",
    visual: "global",
  },
  {
    key: "notices",
    label: "공지사항",
    en: "Notice",
    href: "/jobs/notices",
    desc: "채용 절차·개인정보처리방침 등 채용 관련 주요 사항을 안내합니다.",
    role: "support",
  },
];

export default function JobsHubPage() {
  const featured = CHANNELS.find((c) => c.role === "feature")!;
  const channels = CHANNELS.filter((c) => c.role === "channel");
  const support = CHANNELS.filter((c) => c.role === "support");
  const preview = JOB_POSTINGS.slice(0, 6);

  return (
    <main className="pt-32 sm:pt-40">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="bg-sky-veil pb-16 sm:pb-20">
        <Container>
          <Reveal>
            <Kicker>Recruit</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6 max-w-3xl">
              아르코에듀
              <br />
              채용공고
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              채용 채널별로 진행중인 모집 정보를 확인하고, 지원 절차를
              안내받으세요.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── 채널 카드 (역할별 차등) ───────────────────────── */}
      <section className="bg-paper pb-24 sm:pb-28">
        <Container>
          <div className="grid gap-5 lg:grid-cols-2">
            {/* 대표: 일반직 — 와이드 다크 카드 + 그래픽 */}
            <Reveal className="lg:row-span-2">
              <Link
                href={featured.href}
                className="group relative flex h-full min-h-[340px] flex-col justify-between overflow-hidden rounded-card border border-transparent bg-ink p-9 text-paper transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift sm:p-11"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-80 [mask-image:radial-gradient(circle_at_75%_30%,black,transparent_72%)]"
                >
                  <BrandScene variant="growth" tone="dark" />
                </span>
                <div className="relative flex items-start justify-between">
                  <span className="kicker text-accent">{featured.en}</span>
                  <span className="flex size-11 items-center justify-center rounded-full border border-white/20 text-paper transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                    <ArrowUpRight className="size-5" />
                  </span>
                </div>
                <div className="relative">
                  {featured.meta && (
                    <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                      {featured.meta}
                    </span>
                  )}
                  <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                    {featured.label}
                  </h2>
                  <p className="mt-4 max-w-lg leading-relaxed text-muted-ink">
                    {featured.desc}
                  </p>
                </div>
              </Link>
            </Reveal>

            {/* 비주얼 채널: 영어연구원/전문강사/Foreign */}
            <RevealGroup
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
              stagger={0.06}
            >
              {channels.map((c) => (
                <RevealItem key={c.key}>
                  <Link
                    href={c.href}
                    className="group relative flex h-full min-h-[160px] flex-col justify-between overflow-hidden rounded-card border border-line bg-pure p-7 transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift"
                  >
                    {c.visual && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 right-0 w-[48%] opacity-70 transition-opacity duration-500 group-hover:opacity-100 [mask-image:linear-gradient(to_right,transparent,black_65%)]"
                      >
                        <BrandScene variant={c.visual} tone="light" />
                      </span>
                    )}
                    <div className="relative flex items-start justify-between">
                      <span className="kicker text-accent-ink">{c.en}</span>
                      <span className="flex size-9 items-center justify-center rounded-full border border-line text-ink transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                        <ArrowUpRight className="size-4" />
                      </span>
                    </div>
                    <div className="relative mt-6">
                      <h3 className="text-xl font-bold tracking-tight">
                        {c.label}
                      </h3>
                      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                        {c.desc}
                      </p>
                    </div>
                  </Link>
                </RevealItem>
              ))}

              {/* 보조: 공지사항 — 얇은 라인 카드 */}
              {support.map((c) => (
                <RevealItem key={c.key} className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                  <Link
                    href={c.href}
                    className="group flex items-center justify-between gap-4 rounded-card border border-line bg-paper-dim px-7 py-5 transition-colors duration-300 hover:border-accent/40 hover:bg-pure"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="kicker text-accent-ink">{c.en}</span>
                      <span className="font-bold tracking-tight">{c.label}</span>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-ink transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-ink" />
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </section>

      {/* ── 일반직 최신 공고 (6건) ─────────────────────────── */}
      <section className="border-t border-line bg-paper-dim bg-grid py-24 sm:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHead
              kicker="Latest"
              title={
                <>
                  최근 등록된
                  <br />
                  일반직 채용
                </>
              }
            />
            <Button
              href="/jobs/general"
              variant="outline"
              arrow
              className="self-start sm:self-auto"
            >
              일반직 전체보기
            </Button>
          </div>
          <RevealGroup
            className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.06}
          >
            {preview.map((job, i) => (
              <RevealItem key={job.id}>
                <JobCard job={job} index={i} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 채용절차 미리보기 ──────────────────────────────── */}
      <section className="bg-paper py-24 sm:py-28">
        <Container>
          <SectionHead
            kicker="Process"
            title="아르코 채용은 이렇게 진행됩니다"
            lead="서류 전형부터 최종 합격까지, 지원자의 자질과 잠재력을 다각도로 살핍니다."
          />
          <RevealGroup
            className="mt-14 grid gap-5 sm:grid-cols-3"
            stagger={0.08}
          >
            {GENERAL_PROCESS_NOTES.map((note, i) => (
              <RevealItem
                key={note.name}
                className="surface-card flex h-full flex-col rounded-card p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="font-mono text-sm text-accent-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-tight">
                  {note.name}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {note.desc}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 입사지원 CTA ──────────────────────────────────── */}
      <section className="border-t border-line bg-paper-dim pb-24 pt-20 sm:pb-28 sm:pt-24">
        <Container>
          <Reveal>
            <Link
              href="/apply"
              className="group mesh-ink grain relative flex flex-col items-start justify-between gap-8 overflow-hidden rounded-lg p-10 text-paper transition-transform duration-500 hover:-translate-y-1 sm:flex-row sm:items-center sm:p-14"
            >
              <span className="grain-overlay" />
              <div className="relative">
                <Kicker dark>Apply Now</Kicker>
                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                  관심 있는 채용을 찾으셨나요?
                  <br />
                  지금 바로 지원하세요
                </h2>
              </div>
              <span className="relative inline-flex items-center gap-2 text-lg font-semibold text-accent">
                입사지원 바로가기
                <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </Link>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
