import type { Metadata } from "next";
import { Check } from "lucide-react";
import {
  JOB_POSTINGS,
  JOB_POSTINGS_NEW,
  JOB_POSTINGS_CAREER,
  JOB_POSTINGS_INTERN,
  GENERAL_PROCESSES,
  GENERAL_PROCESS_NOTES,
  GENERAL_APPLY_METHOD,
  GENERAL_ETC,
  GENERAL_APPLY_BUTTON,
  GENERAL_HEADERS,
  TALENT_DB_NOTICE,
} from "@/lib/data/jobs";
import { Container, Kicker, SectionHead } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { GeneralList } from "@/components/jobs/general-list";

export const metadata: Metadata = {
  title: "일반직채용 | 아르코채용",
  description: GENERAL_HEADERS.pageDesc,
};

export default function GeneralJobsPage() {
  const buckets = {
    전체: JOB_POSTINGS,
    신입: JOB_POSTINGS_NEW,
    경력: JOB_POSTINGS_CAREER,
    인턴: JOB_POSTINGS_INTERN,
  };

  return (
    <main className="pt-32 sm:pt-40">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="bg-paper pb-14 sm:pb-16">
        <Container>
          <Reveal>
            <Kicker>General Positions</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6">{GENERAL_HEADERS.pageTitle}</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {GENERAL_HEADERS.pageDesc} {GENERAL_HEADERS.sectionDesc}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── 목록 + 필터 ───────────────────────────────────── */}
      <section className="bg-paper pb-24 sm:pb-28">
        <Container>
          <GeneralList buckets={buckets} />
        </Container>
      </section>

      {/* ── 입사지원 방법 ─────────────────────────────────── */}
      <section className="border-t border-line bg-paper-dim py-20 sm:py-24">
        <Container>
          <SectionHead kicker="How to Apply" title="입사지원 방법" />
          <ul className="mt-10 space-y-4">
            {GENERAL_APPLY_METHOD.map((line, i) => (
              <li key={i} className="flex gap-3 leading-relaxed text-muted">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="break-all">{line}</span>
              </li>
            ))}
          </ul>
          <Button href="/apply/general" variant="accent" arrow className="mt-10">
            {GENERAL_APPLY_BUTTON}
          </Button>
        </Container>
      </section>

      {/* ── 채용절차 ──────────────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-24">
        <Container>
          <SectionHead kicker="Process" title="채용절차" />
          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            {GENERAL_PROCESSES.map((proc) => (
              <div key={proc.title}>
                <h3 className="text-lg font-bold tracking-tight">{proc.title}</h3>
                <ol className="mt-6 space-y-3">
                  {proc.steps.map((step) => (
                    <li
                      key={step.no}
                      className="flex items-center gap-4 rounded-card border border-line bg-pure px-5 py-4"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-sm font-semibold text-accent-ink">
                        {step.no}
                      </span>
                      <span className="font-medium tracking-tight">
                        {step.name}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* 단계 설명 */}
          <div className="mt-14 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
            {GENERAL_PROCESS_NOTES.map((note) => (
              <div key={note.name} className="bg-pure p-7">
                <h4 className="font-bold tracking-tight text-accent-ink">
                  {note.name}
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {note.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 인재DB 등록 안내 ──────────────────────────────── */}
      <section className="bg-paper-dim py-20 sm:py-24">
        <Container>
          <SectionHead kicker="Talent DB" title="인재DB 등록 안내" />
          <ul className="mt-10 space-y-4">
            {TALENT_DB_NOTICE.map((line, i) => (
              <li key={i} className="flex gap-3 leading-relaxed text-muted">
                <Check className="mt-1 size-4 shrink-0 text-accent-ink" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── 유의사항 ──────────────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-24">
        <Container>
          <SectionHead kicker="Notice" title="유의사항" />
          <ul className="mt-10 space-y-4">
            {GENERAL_ETC.map((line, i) => (
              <li key={i} className="leading-relaxed text-muted">
                {line}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  );
}
