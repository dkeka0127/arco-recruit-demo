import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { COMPANY_SHARING } from "@/lib/data/company";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import {
  CompanyNav,
  CompanyHeader,
  CompanyPager,
} from "@/components/company/company-nav";
import { ValuePillars, type Pillar } from "@/components/company/value-pillars";
import { BrandScene } from "@/components/visuals/brand-scene";

export const metadata: Metadata = {
  title: "아르코에듀 나눔 활동 | 아르코채용",
  description: COMPANY_SHARING.titleBar.desc,
};

/** 아르코에듀 철학(나눔) 기반의 일반적 가치 서술 — 허위 사실 없이 4개 영역 */
const PILLARS: Pillar[] = [
  {
    icon: "education",
    en: "Education",
    title: "교육 나눔",
    body: "무료 강의와 학습 콘텐츠, 교재 나눔으로 누구나 양질의 교육에 다가갈 수 있도록 합니다. 정보의 독점을 경계하고 배움의 기회를 넓히는 것이 아르코에듀 나눔의 출발점입니다.",
  },
  {
    icon: "scholarship",
    en: "Scholarship",
    title: "장학 지원",
    body: "사회에 기여하는 인재를 양성하기 위해 장학 기금을 조성하고 장학금을 수여합니다. 받은 혜택을 다시 나누려는 꿈을 가진 이들을 응원합니다.",
  },
  {
    icon: "community",
    en: "Community",
    title: "사회공헌",
    body: "교육을 통한 사회 환원의 가치 아래, 우리 사회를 더 향기롭게 하는 다양한 사회공헌의 길을 모색합니다. 함께 살아가는 공동체에 대한 책임을 잊지 않습니다.",
  },
  {
    icon: "knowledge",
    en: "Knowledge",
    title: "지식 공유",
    body: "땀과 열정으로 쌓은 핵심적이고 바른 정보를 커뮤니티를 통해 함께 나눕니다. 올바른 정보의 공유가 곧 아르코에듀라는 이름의 뜻입니다.",
  },
];

export default function CompanySharingPage() {
  const { titleBar } = COMPANY_SHARING;

  return (
    <>
      <div className="pt-32 sm:pt-40">
        <CompanyNav active="/company/sharing" />
      </div>

      {/* ── Header + 철학 연결 인용 ───────────────────────── */}
      <section className="bg-sky-veil py-16 sm:py-24">
        <Container>
          <Reveal>
            <CompanyHeader
              kicker="Sharing"
              index="03"
              title={
                <>
                  나눔{" "}
                  <span className="font-semibold text-accent-ink">활동</span>
                </>
              }
              desc={titleBar.desc}
            />
          </Reveal>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-stretch lg:gap-10">
            <Reveal>
              <div className="surface-card flex h-full flex-col justify-center rounded-card p-8 sm:p-10">
                <p className="serif-italic text-lg text-accent-ink">
                  Give back to the community
                </p>
                <p className="mt-5 text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.7rem]">
                  “우리가 받은 사회의 혜택과 따스한 호의는 반드시 사회를 향해,
                  모두를 향해 돌려주고 나눈다.”
                </p>
                <p className="mt-6 text-base leading-relaxed text-muted">
                  아르코에듀의 나눔은 구호가 아니라 철학입니다. 교육을 통한 사회
                  환원이라는 한 가지 약속을 네 가지 방식으로 실천합니다.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="relative h-64 overflow-hidden rounded-card border border-line lg:h-full">
                <BrandScene
                  variant="people"
                  tone="dark"
                  className="absolute inset-0"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-7">
                  <p className="serif-italic text-base text-accent">Together</p>
                  <p className="mt-1 text-lg font-semibold leading-snug text-paper">
                    사귐과 연대를 통한
                    <br />
                    함께함의 공동체
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── 4개 가치 카드 ─────────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <Reveal>
            <span className="kicker text-accent-ink">
              <span className="mr-2 inline-block h-px w-6 bg-accent align-middle" />
              Four Ways
            </span>
            <h2 className="text-display mt-5 max-w-3xl">
              아르코에듀가 나누는 네 가지 방식
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-12">
              <ValuePillars pillars={PILLARS} />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 철학 연결 다크 밴드 (큰 메시지) ───────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-28">
        <span className="grain-overlay" />
        <div className="bg-grid-dark absolute inset-0 opacity-60" />
        <Container size="narrow" className="relative text-center">
          <Reveal>
            <p className="serif-italic text-xl text-accent">Architects of Growth — ARCO</p>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mx-auto mt-6 max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-paper sm:text-[2rem] sm:leading-[1.35]">
              땀과 열정이 있는 이들의 핵심적이고 바른 정보의 공유 —{" "}
              <span className="text-accent">그것이 아르코에듀의 뜻</span>입니다.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-ink">
              나눔의 철학이 어디에서 비롯되었는지, 아르코에듀 철학 페이지에서 더
              깊이 만나보세요.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-9">
              <Link
                href="/company/philosophy"
                className="inline-flex items-center gap-2 text-base font-medium text-accent transition-colors hover:text-paper"
              >
                아르코에듀 철학 보기
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 연결 CTA (장학 / 역사) ────────────────────────── */}
      <section className="bg-paper py-20 sm:py-24">
        <Container>
          <Reveal>
            <span className="kicker text-accent-ink">
              <span className="mr-2 inline-block h-px w-6 bg-accent align-middle" />
              Explore More
            </span>
            <h2 className="text-display mt-5 max-w-2xl">나눔의 발자취</h2>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-5 md:grid-cols-2" stagger={0.08}>
            {[
              {
                href: "/company/scholarship",
                kicker: "Scholarship",
                title: "아르코에듀 장학제도",
                body: "사회에 기여하는 인재를 양성하는 ARCO Scholarship 기금과 장학금, Essay & Speech Contest를 소개합니다.",
              },
              {
                href: "/company/history",
                kicker: "History",
                title: "나눔의 연혁",
                body: "교재 기증, 후원금 전달, 봉사활동까지 — 아르코에듀가 매년 이어온 나눔의 발자취를 연혁에서 확인하세요.",
              },
            ].map((c) => (
              <RevealItem key={c.href}>
                <Link
                  href={c.href}
                  className="group surface-card flex h-full flex-col rounded-card p-9 transition-colors hover:border-accent/50"
                >
                  <span className="serif-italic text-lg text-accent-ink">
                    {c.kicker}
                  </span>
                  <h3 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
                    {c.title}
                    <ArrowUpRight className="size-5 text-accent-ink transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </h3>
                  <p className="mt-4 text-[0.97rem] leading-relaxed text-muted">
                    {c.body}
                  </p>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="mt-10">
            <Button href="/company/history" variant="outline" arrow>
              아르코에듀 역사 전체 보기
            </Button>
          </div>

          <CompanyPager current="/company/sharing" />
        </Container>
      </section>
    </>
  );
}
