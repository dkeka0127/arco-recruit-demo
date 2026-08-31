import type { Metadata } from "next";
import {
  BookOpenText,
  GraduationCap,
  FileText,
  Info,
  PenTool,
  Layers,
  Sparkles,
} from "lucide-react";
import { recruit } from "@/lib/provider";
import { Container, Kicker, SectionHead } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { BrandScene } from "@/components/visuals/brand-scene";
import { StickyApply } from "@/components/channels/sticky-apply";

export const metadata: Metadata = {
  title: "영어연구원모집 | 아르코채용",
  description:
    "교재 콘텐츠의 전문가, 아르코에듀 영어연구원을 모집합니다. 직무·자격·전형절차·제출서류 안내.",
};

const APPLY_HREF = "/apply/english-research";

/** 연구원 역할 — bannerLead 외 정성 카피로 대표 섹션 구성 (콘텐츠 충실용) */
const ROLE_CARDS = [
  {
    icon: PenTool,
    title: "콘텐츠 설계자",
    desc: "시험 출제 경향을 분석해 학습 흐름을 설계하고, 문항과 지문을 직접 집필합니다.",
  },
  {
    icon: Layers,
    title: "교재 에디터",
    desc: "원고를 다듬고 구성·편집해 한 권의 완성된 교재로 만들어 냅니다.",
  },
  {
    icon: Sparkles,
    title: "품질의 기준",
    desc: "정확성과 완성도를 끝까지 책임지며 아르코에듀 교재의 신뢰를 지킵니다.",
  },
] as const;

export default async function EnglishResearchPage() {
  const data = await recruit.getEngResearch();
  const APPLY_LABEL = data.applyButton.replace(/\s*▶\s*$/, "");

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden pt-32 pb-24 text-paper sm:pt-40 sm:pb-32">
        <span className="grain-overlay" />
        {/* 우측 브랜드 비주얼 — 빈 다크 영역 제거 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] opacity-90 [mask-image:linear-gradient(to_right,transparent,black_40%)] lg:block"
        >
          <BrandScene variant="content" tone="dark" />
        </div>
        <Container className="relative">
          <Reveal>
            <Kicker dark>ARCO Edu · English Researcher</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-hero mt-7 max-w-[14ch]">{data.bannerTitle}</h1>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="mt-9 max-w-2xl space-y-1.5 text-lg leading-relaxed text-paper/75 sm:text-xl">
              {data.bannerLead.map((line, i) => (
                <p
                  key={i}
                  className={i === 1 ? "font-semibold text-accent" : undefined}
                >
                  {line}
                </p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href={APPLY_HREF} variant="accent" size="lg" arrow>
                {APPLY_LABEL}
              </Button>
              <span className="text-sm text-muted-ink">{data.applyNote}</span>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 대표 섹션: 교재 콘텐츠의 전문가, 영어연구원 ─────────── */}
      <section className="bg-sky-veil py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHead
              kicker="The Role"
              title={
                <>
                  교재 콘텐츠의 전문가,
                  <br />
                  <span className="font-semibold text-accent-ink">
                    영어연구원
                  </span>
                </>
              }
              lead="한 권의 교재가 수많은 학습자의 합격을 좌우합니다. 영어연구원은 그 콘텐츠를 처음부터 끝까지 책임지는 사람입니다."
            />
          </Reveal>
          <RevealGroup className="mt-14 grid gap-4 md:grid-cols-3">
            {ROLE_CARDS.map((card) => (
              <RevealItem
                key={card.title}
                className="surface-card group rounded-card p-8 transition-shadow hover:shadow-lift"
              >
                <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
                  <card.icon className="size-6" />
                </span>
                <h3 className="mt-6 text-xl font-bold tracking-tight text-ink">
                  {card.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted">{card.desc}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 주요업무 (jobGuide) ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-paper py-20 sm:py-28">
        <div aria-hidden className="bg-grid absolute inset-0 opacity-60" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <Reveal>
              <SectionHead
                kicker="Job"
                title={
                  <>
                    영어 교재와 콘텐츠를
                    <br />
                    <span className="font-semibold text-accent-ink">
                      만드는 일
                    </span>
                  </>
                }
                lead="채용 직후 맡게 되는 핵심 업무입니다."
              />
            </Reveal>
            <RevealGroup className="grid gap-4 sm:grid-cols-2">
              {data.jobGuide.map((job, i) => (
                <RevealItem
                  key={i}
                  className="surface-card group flex flex-col rounded-card p-7 transition-colors hover:border-accent/50 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
                      <BookOpenText className="size-6" />
                    </span>
                    <span className="font-mono text-xs tracking-[0.18em] text-muted-ink">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-6 text-lg font-semibold leading-snug text-ink">
                    {job}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </section>

      {/* ── 지원자격 ─────────────────────────────────────────── */}
      <section className="bg-paper-dim py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHead
              kicker="Qualifications"
              title="지원자격"
              lead="아래 자격을 갖춘 분이라면 누구나 지원할 수 있습니다."
            />
          </Reveal>
          <RevealGroup className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
            {data.qualifications.map((q, i) => (
              <RevealItem key={i} className="flex flex-col gap-5 bg-pure p-7">
                <div className="flex items-center gap-3">
                  <GraduationCap className="size-5 text-accent-ink" />
                  <span className="font-mono text-xs tracking-[0.18em] text-muted-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="text-lg font-semibold leading-snug text-ink">
                  {q}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 전형절차 (5단계 타임라인) ────────────────────────── */}
      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHead
              kicker="Process"
              title="전형절차"
              lead="서류전형부터 최종합격까지, 단계별로 진행됩니다."
            />
          </Reveal>

          <RevealGroup className="relative mt-14">
            <div
              aria-hidden
              className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-line lg:block"
            />
            <div className="grid gap-5 lg:grid-cols-5">
              {data.process.map((step, i) => (
                <RevealItem key={step.no} className="relative">
                  <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                    <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-ink font-mono text-sm font-semibold text-paper">
                      {step.no}
                    </span>
                    <div className="lg:mt-5">
                      <p className="text-lg font-bold tracking-tight text-ink">
                        {step.name}
                      </p>
                      {i < data.process.length - 1 && (
                        <span className="mt-1 hidden text-xs text-muted-ink lg:block">
                          STEP {step.no} →
                        </span>
                      )}
                    </div>
                  </div>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        </Container>
      </section>

      {/* ── 제출서류 ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-20 text-paper sm:py-28">
        <div aria-hidden className="bg-grid-dark absolute inset-0" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <Reveal>
              <div className="flex flex-col gap-5">
                <Kicker dark>Documents</Kicker>
                <h2 className="text-display text-paper">제출서류</h2>
                <p className="max-w-md leading-relaxed text-muted-ink">
                  {data.documentsNote}
                </p>
              </div>
            </Reveal>
            <RevealGroup className="space-y-3">
              {data.documents.map((doc, i) => (
                <RevealItem
                  key={i}
                  className="flex items-start gap-4 rounded-card border border-white/10 bg-white/[0.04] p-5"
                >
                  <FileText className="mt-0.5 size-5 shrink-0 text-accent" />
                  <p className="leading-relaxed text-paper/90">{doc}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </section>

      {/* ── 기타사항 ─────────────────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHead kicker="Notice" title="기타사항" />
          </Reveal>
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2">
            {data.etc.map((item, i) => (
              <RevealItem
                key={i}
                className="flex items-start gap-3 rounded-card border border-line bg-paper-dim/60 p-5"
              >
                <Info className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                <p className="text-sm leading-relaxed text-muted">{item}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 하단 지원 CTA ────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-32">
        <span className="grain-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]"
        >
          <BrandScene variant="content" tone="dark" />
        </div>
        <Container className="relative text-center">
          <Reveal>
            <Kicker dark className="justify-center">
              Join our team
            </Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-display mx-auto mt-6 max-w-3xl text-paper">
              아르코에듀 영어연구원으로
              <br />
              함께 성장하세요
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={APPLY_HREF} variant="accent" size="lg" arrow>
                {APPLY_LABEL}
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-sm text-muted-ink">{data.applyNote}</p>
          </Reveal>
        </Container>
      </section>

      <StickyApply
        eyebrow="English Researcher"
        note={data.applyNote}
        label={APPLY_LABEL}
        href={APPLY_HREF}
      />
    </>
  );
}
