import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Check } from "lucide-react";
import {
  JOB_POSTINGS,
  JOB_DETAILS,
  GENERAL_PROCESSES,
  GENERAL_ETC,
} from "@/lib/data/jobs";
import type { JobDetail } from "@/lib/types";
import { Container, Kicker, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return JOB_POSTINGS.map((j) => ({ id: j.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = JOB_POSTINGS.find((j) => j.id === id);
  if (!job) return { title: "공고를 찾을 수 없습니다 | 아르코채용" };
  return {
    title: `${job.title} | 아르코채용`,
    description: `${job.title} · 접수기간 ${job.period}`,
  };
}

export default async function GeneralJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = JOB_POSTINGS.find((j) => j.id === id);
  if (!job) notFound();

  const detail = job.hasDetail ? JOB_DETAILS[id] ?? null : null;
  const closed = job.status === "마감";
  const cleanTitle = job.categoryLabel
    ? job.title.replace(job.categoryLabel, "").trim()
    : job.title;

  return (
    <main className="pt-32 sm:pt-40">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="bg-paper pb-12">
        <Container>
          <Link
            href="/jobs/general"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" /> 일반직 채용공고
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Badge tone={job.format === "인턴" ? "signal" : "soft"}>
              {job.format}
            </Badge>
            <span className="kicker text-accent-ink">{job.categoryLabel}</span>
            <Badge tone={closed ? "neutral" : "accent"}>
              {closed ? "접수 마감" : "접수 중"}
            </Badge>
          </div>

          <h1 className="mt-6 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {detail ? detail.titleBar : cleanTitle}
          </h1>

          <p className="mt-6 inline-flex items-center gap-2 text-muted">
            <CalendarDays className="size-4" /> 접수기간 {job.period}
          </p>
        </Container>
      </section>

      {/* ── 본문 + 사이드 ─────────────────────────────────── */}
      <section className="bg-paper pb-24 sm:pb-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-16">
            {/* 본문 */}
            <div className="min-w-0">
              {detail ? (
                <DetailContent detail={detail} />
              ) : (
                <BasicContent />
              )}
            </div>

            {/* sticky 지원 카드 */}
            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="rounded-card border border-line bg-pure p-7 shadow-lift">
                <p className="kicker text-accent-ink">Apply</p>
                <h2 className="mt-4 text-xl font-bold leading-snug tracking-tight">
                  {cleanTitle}
                </h2>
                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">구분</dt>
                    <dd className="text-right font-medium">{job.format}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">직군</dt>
                    <dd className="text-right font-medium">
                      {job.categoryLabel}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-muted">접수기간</dt>
                    <dd className="text-right font-medium">{job.period}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">상태</dt>
                    <dd
                      className={
                        "text-right font-medium " +
                        (closed ? "text-muted" : "text-accent-ink")
                      }
                    >
                      {closed ? "접수 마감" : "접수 중"}
                    </dd>
                  </div>
                </dl>

                {closed ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="mt-7 w-full pointer-events-none opacity-60"
                  >
                    접수 마감
                  </Button>
                ) : (
                  <Button
                    href="/apply/general"
                    variant="accent"
                    size="lg"
                    arrow
                    className="mt-7 w-full"
                  >
                    지원하기
                  </Button>
                )}
                <p className="mt-4 text-center text-xs leading-relaxed text-muted">
                  온라인 입사지원만 가능합니다.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}

/* ── 상세 데이터가 있는 공고 ─────────────────────────────── */
function DetailContent({ detail }: { detail: JobDetail }) {
  return (
    <div className="space-y-14">
      {/* 담당업무/자격 표 */}
      <section>
        <Kicker>Details</Kicker>
        <h2 className="mt-5 text-2xl font-bold tracking-tight">
          채용 상세정보
        </h2>
        <dl className="mt-8 divide-y divide-line overflow-hidden rounded-card border border-line">
          {detail.rows.map((row) => (
            <div
              key={row.label}
              className="grid gap-2 bg-pure p-6 sm:grid-cols-[160px_1fr] sm:gap-6"
            >
              <dt className="font-bold tracking-tight text-accent-ink">
                {row.label}
              </dt>
              <dd className="space-y-1.5 text-muted">
                {row.value.map((v, i) => (
                  <p key={i} className="leading-relaxed">
                    {v}
                  </p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 지원방법 */}
      {detail.applyMethod && detail.applyMethod.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight">지원방법</h2>
          <div className="mt-8 space-y-8">
            {detail.applyMethod.map((group) => (
              <div key={group.heading}>
                <h3 className="font-bold tracking-tight text-accent-ink">
                  {group.heading}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item, i) => (
                    <li key={i} className="flex gap-3 leading-relaxed text-muted">
                      <Check className="mt-1 size-4 shrink-0 text-accent-ink" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 채용절차 (그룹) */}
      {detail.processGroups && detail.processGroups.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight">채용절차</h2>
          <div className="mt-8 space-y-8">
            {detail.processGroups.map((group) => (
              <div key={group.heading}>
                <h3 className="font-bold tracking-tight text-accent-ink">
                  {group.heading}
                </h3>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {group.steps.map((step, i) => (
                    <span key={step} className="flex items-center gap-2">
                      <span className="rounded-full border border-line bg-pure px-4 py-2 text-sm font-medium">
                        {step}
                      </span>
                      {i < group.steps.length - 1 && (
                        <span className="text-muted-ink">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 기타사항 */}
      {detail.etc.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight">※ 기타사항</h2>
          <ul className="mt-8 space-y-4">
            {detail.etc.map((line, i) => (
              <li key={i} className="flex gap-3 leading-relaxed text-muted">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-line-strong" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.footerLine && (
        <p className="rounded-card border border-line bg-paper-dim px-6 py-5 text-sm font-medium text-ink">
          {detail.footerLine}
        </p>
      )}
    </div>
  );
}

/* ── 상세 데이터가 없는 공고 (공통 절차/유의사항) ─────────── */
function BasicContent() {
  return (
    <div className="space-y-14">
      <section>
        <Kicker>Process</Kicker>
        <h2 className="mt-5 text-2xl font-bold tracking-tight">채용절차</h2>
        <p className="mt-4 leading-relaxed text-muted">
          본 공고의 세부 채용 정보는 입사지원 페이지에서 확인하실 수 있습니다.
          공통 채용절차는 아래와 같습니다.
        </p>
        <div className="mt-8 grid gap-10 sm:grid-cols-2">
          {GENERAL_PROCESSES.map((proc) => (
            <div key={proc.title}>
              <h3 className="font-bold tracking-tight">{proc.title}</h3>
              <ol className="mt-5 space-y-3">
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
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">유의사항</h2>
        <ul className="mt-8 space-y-4">
          {GENERAL_ETC.map((line, i) => (
            <li key={i} className="leading-relaxed text-muted">
              {line}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
