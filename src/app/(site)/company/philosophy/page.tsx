import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { COMPANY_PHILOSOPHY } from "@/lib/data/company";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import {
  CompanyNav,
  CompanyHeader,
  CompanyPager,
} from "@/components/company/company-nav";
import { PhilosophyDiagram } from "@/components/company/philosophy-diagram";
import { BrandScene } from "@/components/visuals/brand-scene";

export const metadata: Metadata = {
  title: "아르코에듀 철학 | 아르코채용",
  description: COMPANY_PHILOSOPHY.intro.body,
};

export default function CompanyPhilosophyPage() {
  const { intro, ideal, diagram, bottomBody } = COMPANY_PHILOSOPHY;

  return (
    <>
      <div className="pt-32 sm:pt-40">
        <CompanyNav active="/company/philosophy" />
      </div>

      {/* ── Header + intro ────────────────────────────────── */}
      <section className="bg-sky-veil py-16 sm:py-24">
        <Container>
          <Reveal>
            <CompanyHeader
              kicker="Philosophy"
              index="02"
              title={
                <>
                  나눔의{" "}
                  <span className="font-semibold text-accent-ink">철학</span>
                </>
              }
            />
          </Reveal>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-stretch lg:gap-10">
            <Reveal>
              <div className="surface-card flex h-full flex-col justify-center rounded-card p-8 sm:p-10">
                <h2 className="text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.7rem]">
                  {intro.title}
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-muted">
                  {intro.body}
                </p>
              </div>
            </Reveal>

            {/* 비주얼 패널 (share variant) */}
            <Reveal delay={0.08}>
              <div className="relative h-64 overflow-hidden rounded-card border border-line lg:h-full">
                <BrandScene
                  variant="share"
                  tone="dark"
                  className="absolute inset-0"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-7">
                  <p className="serif-italic text-base text-accent">Sharing</p>
                  <p className="mt-1 text-lg font-semibold leading-snug text-paper">
                    정보의 독점을 경계하고
                    <br />
                    바른 정보를 나눕니다
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── 철학이념 큰 인용문 (다크 밴드) ──────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-32">
        <span className="grain-overlay" />
        <div className="bg-grid-dark absolute inset-0 opacity-60" />
        <Container size="narrow" className="relative">
          <Reveal>
            <span className="kicker text-accent">
              <span className="mr-2 inline-block h-px w-6 bg-accent/70 align-middle" />
              {ideal.title}
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <blockquote className="mt-8 text-2xl font-semibold leading-snug tracking-tight text-paper sm:text-[2rem] sm:leading-[1.35]">
              <span className="text-accent">“</span>
              세계를 웅비하며, 우리가 함께 살고 있는 사회를 더욱더 향기롭게 하길
              원하는 이들에게 올바르고 효과적인 길을 제시하고,{" "}
              <span className="text-accent">핵심 정보 공유</span>에 가치를
              내걸어 하나의 커다란 배움의 장이 된다.
              <span className="text-accent">”</span>
            </blockquote>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-10 border-l-2 border-accent/50 pl-6 text-base leading-loose text-muted-ink">
              {ideal.body}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── 원형 철학 다이어그램 ──────────────────────────── */}
      <section className="mesh-ink relative overflow-hidden border-t border-paper/10 py-20 text-paper sm:py-28">
        <Container className="relative">
          <Reveal>
            <div className="flex flex-col items-center gap-5 text-center">
              <span className="kicker text-accent">
                <span className="mr-2 inline-block h-px w-6 bg-accent/70 align-middle" />
                Diagram
              </span>
              <h2 className="text-display max-w-2xl text-paper">
                네 철인의 정신,
                <br />
                하나의 공동체
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-16">
              <PhilosophyDiagram
                center={diagram.center}
                nodes={diagram.nodes}
                bottomLabel={diagram.bottomLabel}
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── bottomBody — 얇은 라인 리스트 ─────────────────── */}
      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <Reveal>
            <span className="kicker text-accent-ink">
              <span className="mr-2 inline-block h-px w-6 bg-accent align-middle" />
              Roots
            </span>
            <h2 className="text-display mt-5 max-w-3xl">
              아르코에듀가 잊지 않는 것들
            </h2>
          </Reveal>

          <RevealGroup
            className="mt-12 divide-y divide-line border-y border-line"
            stagger={0.07}
          >
            {bottomBody.map((p, i) => (
              <RevealItem key={i}>
                <div className="flex gap-6 py-7 sm:gap-10">
                  <span className="shrink-0 font-mono text-sm tracking-[0.2em] text-accent-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-lg leading-loose text-ink/85">{p}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-20 text-paper sm:py-24">
        <span className="grain-overlay" />
        <Container className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <Reveal>
              <div>
                <p className="serif-italic text-xl text-accent">
                  Solidarity & Community
                </p>
                <h2 className="text-display mt-4 max-w-2xl text-paper">
                  철학은 나눔으로,
                  <br />
                  나눔은 사람으로 이어집니다
                </h2>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-ink">
                  아르코에듀의 나눔 활동과 장학제도에서 이 철학이 어떻게 실천되는지
                  확인해 보세요.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button href="/company/sharing" variant="accent" size="lg" arrow>
                  나눔 활동 보기
                </Button>
                <Link
                  href="/company/scholarship"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-paper/25 px-8 py-4 text-base font-medium text-paper transition-colors hover:border-accent hover:text-accent"
                >
                  장학제도 보기
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="mt-16">
            <CompanyPager current="/company/philosophy" />
          </div>
        </Container>
      </section>
    </>
  );
}
