import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Compass, Heart, Sparkles } from "lucide-react";
import {
  TALENT_VALUES,
  JOB_INTRO_ORDER,
  BENEFIT_BLOCKS,
} from "@/lib/data/people";
import { Container, Kicker, SectionHead } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { BrandScene } from "@/components/visuals/brand-scene";
import { PeopleFeature } from "@/components/people/people-feature";
import { INTERVIEWS } from "@/components/people/interviews";

export const metadata: Metadata = {
  title: "아르코 피플 | 아르코채용",
  description:
    "아르코에듀의 인재상·직무소개·아르코 컬처. 그리고 아르코에듀에서 성장하는 사람들의 이야기.",
};

/** 일하는 방식 3원칙 (인재상·문화 맥락 압축) */
const WAYS = [
  {
    icon: Compass,
    en: "Right & Fast",
    title: "바른 정보를 가장 빠르게",
    desc: "핵심적이고 정확한 정보를 가장 먼저 나눕니다. 속도와 정확함은 함께 갑니다.",
  },
  {
    icon: Sparkles,
    en: "Be Professional",
    title: "담당 분야의 최고가 되기",
    desc: "각자의 분야에서 깊어지며, 나눔의 철학을 실력으로 증명합니다.",
  },
  {
    icon: Heart,
    en: "Grow Together",
    title: "동료와 함께 성장하기",
    desc: "수평적으로 소통하고 서로를 존중하며, 어제보다 나은 오늘을 만듭니다.",
  },
];

export default function PeoplePage() {
  return (
    <main className="pt-32 sm:pt-40">
      {/* ── Intro hero ─────────────────────────────────────── */}
      <section className="bg-sky-veil pb-20 sm:pb-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
            <div>
              <Reveal>
                <Kicker>ARCO People</Kicker>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="text-hero mt-7">
                  성장의 이야기는
                  <br />
                  <span className="font-semibold text-accent-ink">사람</span>
                  에게서 나옵니다
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-7 max-w-md text-lg leading-relaxed text-muted">
                  직무도, 연차도, 일하는 방식도 다른 동료들. 하지만 모두 ‘어제보다
                  더 나아지는 일’을 합니다. 인재상부터 직무, 문화까지—아르코에듀
                  사람들이 일하는 방식을 만나보세요.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button href="#voices" variant="primary" size="lg" arrow>
                    사람들의 이야기
                  </Button>
                  <Button href="/people/values" variant="outline" size="lg">
                    인재상 보기
                  </Button>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.16}>
              <div className="relative aspect-[5/4] overflow-hidden rounded-lg border border-line">
                <BrandScene variant="people" tone="light" />
              </div>
            </Reveal>
          </div>

          {/* meta strip */}
          <Reveal delay={0.22}>
            <div className="mt-16 grid grid-cols-3 gap-6 border-t border-line pt-8">
              <div>
                <p className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  <CountUp to={TALENT_VALUES.length} />
                </p>
                <p className="mt-1 text-sm text-muted">가지 인재상</p>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  <CountUp to={JOB_INTRO_ORDER.length} />
                </p>
                <p className="mt-1 text-sm text-muted">개 직무</p>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  <CountUp to={BENEFIT_BLOCKS.length} />
                </p>
                <p className="mt-1 text-sm text-muted">개 복지 영역</p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 일하는 이야기 (인터뷰) ─────────────────────────── */}
      <section
        id="voices"
        className="bg-grid scroll-mt-24 border-t border-line bg-paper-dim py-24 sm:py-28"
      >
        <Container size="wide">
          <SectionHead
            kicker="Voices"
            title={
              <>
                아르코에듀 사람들의
                <br />
                일하는 이야기
              </>
            }
            lead="직무도 팀도 다르지만, 같은 곳을 바라보는 동료들. 아르코에듀에서 일하는 사람들의 목소리를 담았습니다."
          />
          <Reveal delay={0.1} className="mt-14">
            <PeopleFeature people={INTERVIEWS} />
          </Reveal>
        </Container>
      </section>

      {/* ── 일하는 방식 ───────────────────────────────────── */}
      <section className="bg-paper py-24 sm:py-28">
        <Container>
          <SectionHead
            kicker="How we work"
            title={
              <>
                다른 직무, 같은
                <br />
                일하는 방식
              </>
            }
            lead="팀과 직무는 달라도, 아르코에듀 사람들이 공유하는 세 가지 일의 기준이 있습니다."
          />
          <RevealGroup
            className="mt-12 grid gap-5 sm:grid-cols-3"
            stagger={0.06}
          >
            {WAYS.map((w, i) => {
              const Icon = w.icon;
              return (
                <RevealItem key={w.en}>
                  <div className="surface-card flex h-full flex-col rounded-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift">
                    <div className="flex items-center justify-between">
                      <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                        <Icon className="size-6" strokeWidth={1.5} />
                      </span>
                      <span className="font-mono text-xs tracking-[0.2em] text-muted-ink">
                        0{i + 1}
                      </span>
                    </div>
                    <p className="serif-italic mt-6 text-base text-accent-ink">
                      {w.en}
                    </p>
                    <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">
                      {w.title}
                    </h3>
                    <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-muted">
                      {w.desc}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 인재상 티저 (다크) ────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-28">
        <span className="grain-overlay" />
        <span className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
            <div>
              <Reveal>
                <p className="serif-italic text-xl text-accent">Talent Values</p>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="text-display mt-4 max-w-md text-paper">
                  아르코에듀가 함께할 네 사람
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-md leading-relaxed text-muted-ink">
                  열정인·도전인·전문인·소통인. 네 가지 기준은 따로 있지 않고, 한
                  사람 안에서 함께 자랍니다.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-9">
                  <Button href="/people/values" variant="accent" size="lg" arrow>
                    인재상 자세히 보기
                  </Button>
                </div>
              </Reveal>
            </div>
            <RevealGroup
              className="grid grid-cols-2 gap-4"
              stagger={0.05}
            >
              {TALENT_VALUES.map((v, i) => (
                <RevealItem key={v.keyword}>
                  <div className="flex h-full flex-col justify-between rounded-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors duration-500 hover:border-accent/40">
                    <span className="font-mono text-xs tracking-[0.2em] text-accent">
                      0{i + 1}
                    </span>
                    <div className="mt-8">
                      <h3 className="text-2xl font-bold tracking-tight text-paper">
                        {v.keyword}
                      </h3>
                      <p className="serif-italic mt-1 text-accent">{v.en}</p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </section>

      {/* ── 직무 & 문화 티저 ──────────────────────────────── */}
      <section className="bg-paper py-24 sm:py-28">
        <Container>
          <RevealGroup className="grid gap-5 lg:grid-cols-2" stagger={0.08}>
            {/* 직무소개 */}
            <RevealItem>
              <Link
                href="/people/jobs"
                className="group surface-card relative flex h-full flex-col justify-between overflow-hidden rounded-lg p-9 transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift sm:p-11"
              >
                <span className="bg-dots pointer-events-none absolute inset-0 opacity-50" />
                <div className="relative flex items-start justify-between">
                  <span className="kicker text-accent-ink">Job Roles</span>
                  <span className="flex size-11 items-center justify-center rounded-full border border-line text-ink transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                    <ArrowUpRight className="size-5" />
                  </span>
                </div>
                <div className="relative mt-16">
                  <h3 className="text-3xl font-bold tracking-tight text-ink">
                    직무소개
                  </h3>
                  <p className="mt-3 max-w-sm leading-relaxed text-muted">
                    기획·콘텐츠부터 개발·디자인, 교육·연구, 운영·관리,
                    경영지원까지—{JOB_INTRO_ORDER.length}개 직무를 분야별로
                    소개합니다.
                  </p>
                  <p className="mt-5 font-mono text-xs tracking-[0.2em] text-muted-ink">
                    {String(JOB_INTRO_ORDER.length).padStart(2, "0")} ROLES · 05
                    FIELDS
                  </p>
                </div>
              </Link>
            </RevealItem>

            {/* 아르코 컬처 (다크) */}
            <RevealItem>
              <Link
                href="/people/culture"
                className="mesh-ink grain group relative flex h-full flex-col justify-between overflow-hidden rounded-lg p-9 text-paper transition-all duration-500 hover:-translate-y-1 hover:shadow-lift sm:p-11"
              >
                <span className="grain-overlay" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-50">
                  <BrandScene variant="share" tone="dark" />
                  <span className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
                </div>
                <div className="relative flex items-start justify-between">
                  <span className="kicker text-accent">Culture &amp; Benefits</span>
                  <span className="flex size-11 items-center justify-center rounded-full border border-white/20 text-paper transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                    <ArrowUpRight className="size-5" />
                  </span>
                </div>
                <div className="relative mt-16">
                  <h3 className="text-3xl font-bold tracking-tight text-paper">
                    아르코 컬처
                  </h3>
                  <p className="mt-3 max-w-sm leading-relaxed text-muted-ink">
                    건강·연대·소통·배움·평등·존중·지원. 머리글자를 모으면
                    ARCOEDU가 되는 일곱 가지 복지와 일하는 환경을 만나보세요.
                  </p>
                  <p className="mt-5 font-mono text-xs tracking-[0.2em] text-accent">
                    H · A · C · K · E · R · S
                  </p>
                </div>
              </Link>
            </RevealItem>
          </RevealGroup>
        </Container>
      </section>

      {/* ── Closing CTA band ───────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden border-t border-white/10 py-28 text-paper sm:py-36">
        <span className="grain-overlay" />
        <Container className="relative text-center">
          <Reveal>
            <p className="serif-italic text-2xl text-accent">Your story, next</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-display mx-auto mt-6 max-w-4xl text-paper">
              당신의 이야기를
              <br />
              여기에 더해주세요
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-7 max-w-xl leading-relaxed text-muted-ink">
              다음 인터뷰의 주인공은 당신일지도 모릅니다. 함께 성장할 동료를
              기다립니다.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/jobs/general" variant="accent" size="lg" arrow>
                진행중인 채용 보기
              </Button>
              <Button href="/people/values" variant="light" size="lg">
                인재상 보기
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
