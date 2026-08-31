import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Briefcase, Target, Sparkles, TrendingUp } from "lucide-react";
import { JOB_INTROS, JOB_INTRO_ORDER } from "@/lib/data/people";
import { Container, Kicker } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { BrandScene } from "@/components/visuals/brand-scene";

export function generateStaticParams() {
  return JOB_INTROS.map((j) => ({ id: j.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = JOB_INTROS.find((j) => j.id === id);
  if (!job) return { title: "직무소개 | 아르코채용" };
  return {
    title: `${job.name} | 직무소개 | 아르코채용`,
    description: job.headline ?? `아르코에듀 ${job.name} 직무소개`,
  };
}

export default async function JobIntroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = JOB_INTROS.find((j) => j.id === id);
  if (!job) notFound();

  // 같은 흐름의 다른 직무 추천 (전체 순서 기준 인접 직무 3개)
  const idx = JOB_INTRO_ORDER.indexOf(job.name);
  const related = JOB_INTRO_ORDER.filter((n) => n !== job.name)
    .map((name) => ({
      name,
      dist: Math.abs(JOB_INTRO_ORDER.indexOf(name) - idx),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    .map((r) => JOB_INTROS.find((j) => j.name === r.name))
    .filter((j): j is NonNullable<typeof j> => Boolean(j));

  return (
    <main className="pt-32 sm:pt-40">
      {/* ── 헤더 (다크) ───────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden pb-16 pt-2 text-paper sm:pb-20">
        <span className="grain-overlay" />
        {/* 우측 비주얼 */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] opacity-60 lg:block">
          <BrandScene variant="people" tone="dark" />
          <span className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
        </div>
        <Container className="relative">
          <Reveal>
            <Link
              href="/people/jobs"
              className="group inline-flex items-center gap-2 text-sm text-muted-ink transition-colors hover:text-accent"
            >
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
              직무소개 전체보기
            </Link>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="kicker mt-8 text-accent">{job.name}</p>
          </Reveal>
          {job.headline && (
            <Reveal delay={0.1}>
              <h1 className="mt-6 max-w-3xl text-2xl font-bold leading-snug tracking-tight text-paper sm:text-3xl lg:text-[2.6rem] lg:leading-[1.2]">
                {job.headline}
              </h1>
            </Reveal>
          )}
        </Container>
      </section>

      {/* ── 본문 ─────────────────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-24">
        <Container size="narrow">
          {job.description && (
            <Reveal>
              <p className="text-xl leading-relaxed text-ink sm:text-2xl">
                {job.description}
              </p>
            </Reveal>
          )}

          {/* 이런 일을 해요 (주요업무) */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <Reveal delay={0.06}>
              <div className="mt-16">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                    <Briefcase className="size-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-mono text-xs tracking-[0.18em] text-accent-ink uppercase">
                      What you do
                    </p>
                    <h2 className="text-lg font-bold tracking-tight text-ink">
                      이런 일을 해요
                    </h2>
                  </div>
                </div>
                <ul className="mt-6 space-y-4">
                  {job.responsibilities.map((item, i) => (
                    <li
                      key={i}
                      className="surface-card flex gap-4 rounded-card p-5"
                    >
                      <span className="mt-2.5 inline-block size-1.5 shrink-0 rounded-full bg-accent" />
                      <span className="leading-relaxed whitespace-pre-line text-ink">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}

          {/* 이런 역량이 필요해요 (우대사항) */}
          {job.preferred && job.preferred.length > 0 && (
            <Reveal delay={0.08}>
              <div className="mt-14">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                    <Target className="size-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-mono text-xs tracking-[0.18em] text-accent-ink uppercase">
                      What we look for
                    </p>
                    <h2 className="text-lg font-bold tracking-tight text-ink">
                      이런 역량이 필요해요
                    </h2>
                  </div>
                </div>
                <ul className="mt-6 grid gap-3 rounded-card bg-paper-dim p-7">
                  {job.preferred.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 leading-relaxed whitespace-pre-line text-muted"
                    >
                      <span className="mt-2.5 inline-block size-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}

          {/* 함께 성장하는 방식 */}
          <Reveal delay={0.1}>
            <div className="mesh-ink grain relative mt-14 overflow-hidden rounded-lg p-9 text-paper sm:p-11">
              <span className="grain-overlay" />
              <span className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" />
              <div className="relative">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <TrendingUp className="size-5" strokeWidth={1.5} />
                </span>
                <p className="serif-italic mt-5 text-lg text-accent">
                  Grow together
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-paper">
                  함께 성장하는 방식
                </h2>
                <p className="mt-4 max-w-xl leading-relaxed text-muted-ink">
                  아르코에듀는 ‘담당분야에서 최고가 되어 나눔의 철학을 실천하는’
                  전문가를 키웁니다. 온라인 강의 무료 수강, 사내 스터디와
                  커리어코칭, 수평적 호칭 문화 속에서 {job.name} 직무는 입사
                  첫날부터 한 단계씩 깊어집니다.
                </p>
                <div className="mt-7">
                  <Link
                    href="/people/culture#benefits"
                    className="group inline-flex items-center gap-2 text-sm font-medium tracking-tight text-accent transition-colors hover:text-paper"
                  >
                    성장을 돕는 아르코에듀 복지 보기
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 이 직무와 연결된 다른 직무 */}
          {related.length > 0 && (
            <Reveal delay={0.12}>
              <div className="mt-14">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                    <Sparkles className="size-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-mono text-xs tracking-[0.18em] text-accent-ink uppercase">
                      Related roles
                    </p>
                    <h2 className="text-lg font-bold tracking-tight text-ink">
                      함께 보면 좋은 직무
                    </h2>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/people/jobs/${r.id}`}
                      className="group surface-card flex items-center justify-between gap-3 rounded-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift"
                    >
                      <span className="font-bold tracking-tight text-ink">
                        {r.name}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-ink transition-colors group-hover:text-accent-ink" />
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {/* ── 관련 채용 CTA ─────────────────────────────────── */}
      <section className="border-t border-line bg-paper-dim py-20 sm:py-24">
        <Container className="text-center">
          <Reveal>
            <Kicker className="justify-center">Join Us</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-display mx-auto mt-5 max-w-2xl">
              이 직무로 함께하고 싶다면
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-lg leading-relaxed text-muted">
              지금 진행중인 일반직 채용공고에서 {job.name} 관련 모집 정보를
              확인하고 지원하세요.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/jobs/general" variant="primary" size="lg" arrow>
                관련 채용 보기
              </Button>
              <Button href="/people/jobs" variant="outline" size="lg">
                다른 직무 보기
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
