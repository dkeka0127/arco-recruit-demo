import type { Metadata } from "next";
import { COMPANY_GROUP } from "@/lib/data/company";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { BrandScene } from "@/components/visuals/brand-scene";
import {
  CompanyNav,
  CompanyHeader,
  CompanyPager,
} from "@/components/company/company-nav";
import { MovieGrid } from "@/components/company/movie-grid";

export const metadata: Metadata = {
  title: "아르코에듀 | 아르코채용",
  description: COMPANY_GROUP.paragraphs[0],
};

export default function CompanyGroupPage() {
  return (
    <>
      <div className="pt-32 sm:pt-40">
        <CompanyNav active="/company/group" />
      </div>

      {/* ── Header + intro paragraphs ─────────────────────── */}
      <section className="bg-paper py-16 sm:py-24">
        <Container>
          <Reveal>
            <CompanyHeader
              kicker={COMPANY_GROUP.heading}
              index="01"
              title={
                <>
                  아르코에듀 <span className="font-semibold text-accent-ink">교육그룹</span>
                </>
              }
            />
          </Reveal>

          <div className="mt-14 grid gap-10 lg:grid-cols-[0.42fr_1fr] lg:gap-16">
            <Reveal>
              <div className="lg:sticky lg:top-32">
                <p className="text-lg font-semibold leading-relaxed text-accent-ink sm:text-xl">
                  ‘올바른 정보의 공유를 위해
                  <br className="hidden lg:block" /> 힘쓰는 사람들’
                </p>
                <div className="surface-card mt-6 aspect-[4/3] overflow-hidden rounded-card">
                  <BrandScene variant="share" tone="light" />
                </div>
              </div>
            </Reveal>
            <div className="flex flex-col gap-8 border-l border-line pl-8 sm:pl-12">
              {COMPANY_GROUP.paragraphs.map((p, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <p className="text-lg leading-relaxed text-ink/85 sm:text-xl sm:leading-relaxed">
                    {p}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── ARCO MOVIE ─────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-20 text-paper sm:py-28">
        <span className="grain-overlay" />
        <Container className="relative">
          <Reveal>
            <div className="flex flex-col gap-5">
              <span className="kicker text-accent">
                <span className="mr-2 inline-block h-px w-6 bg-accent/70 align-middle" />
                ARCO MOVIE
              </span>
              <h2 className="text-display max-w-2xl text-paper">
                아르코에듀의 이야기를
                <br />
                영상으로 만나보세요
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-muted-ink">
                합격CM송부터 교육그룹 체육대회까지, 아르코에듀가 담아온 순간들.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-12">
              <MovieGrid
                movies={COMPANY_GROUP.movies}
                playerLabels={COMPANY_GROUP.playerLabels}
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="bg-paper-dim py-16 sm:py-20">
        <Container className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl sm:leading-snug">
            대한민국 젊은이들의 미래를 밝히는 등대,
            <br className="hidden sm:block" /> 그 길을 함께 걷습니다.
          </p>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button href="/company/philosophy" size="lg" arrow>
              아르코에듀 철학 보기
            </Button>
            <Button href="/jobs" variant="outline" size="lg">
              채용 보기
            </Button>
          </div>
        </Container>
      </section>

      <section className="bg-paper pb-10 pt-2">
        <Container>
          <CompanyPager current="/company/group" />
        </Container>
      </section>
    </>
  );
}
