import type { Metadata } from "next";
import {
  HeartPulse,
  MessagesSquare,
  BookOpen,
  Sparkles,
  Palmtree,
  UtensilsCrossed,
  TrendingUp,
  Users,
  Coffee,
  CalendarHeart,
  type LucideIcon,
} from "lucide-react";
import { CULTURE_COPY, BENEFIT_BLOCKS } from "@/lib/data/people";
import { Container, Kicker, SectionHead } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { BrandScene } from "@/components/visuals/brand-scene";

export const metadata: Metadata = {
  title: "아르코 컬처 | 아르코 피플 | 아르코채용",
  description:
    "건강하고 평등하게, 서로를 존중하며 함께 성장하는 아르코에듀의 복리후생(ARCOEDU)을 소개합니다.",
};

/** 영문명 → lucide 아이콘 (서버 컴포넌트 내부에서 직접 렌더) */
const BENEFIT_ICONS: Record<string, LucideIcon> = {
  "Anniversary care": CalendarHeart,
  "Refresh vacation": Palmtree,
  "Care for health": HeartPulse,
  "Open communication": MessagesSquare,
  "Education support": BookOpen,
  "Dining & snacks": UtensilsCrossed,
  "Uplift together": TrendingUp,
};

/** 일하는 환경 3블록 */
const WORK_ENV = [
  {
    icon: Users,
    en: "Flat",
    title: "수평적으로 일합니다",
    desc: "‘프로’라는 단일 호칭과 평등한 회의 문화. 직급이 아니라 더 나은 생각이 의사결정의 기준입니다.",
  },
  {
    icon: BookOpen,
    en: "Learn",
    title: "배우며 성장합니다",
    desc: "온라인강의 무료 수강, 사내 도서관과 스터디, 커리어코칭 시스템으로 일하면서 계속 깊어집니다.",
  },
  {
    icon: CalendarHeart,
    en: "Care",
    title: "서로를 존중합니다",
    desc: "자유로운 산전후휴가와 육아휴직, 경조 지원과 휴양소까지—일과 삶이 함께 가도록 돕습니다.",
  },
];

export default function CulturePage() {
  // ARCOEDU 머리글자
  const acronym = BENEFIT_BLOCKS.map((b) => b.en.charAt(0));

  return (
    <main className="pt-32 sm:pt-40">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="bg-sky-veil pb-14 sm:pb-16">
        <Container>
          <Reveal>
            <Kicker>Culture &amp; Benefits</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-hero mt-7 max-w-3xl">
              {CULTURE_COPY.header.title}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              {CULTURE_COPY.header.desc}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── 비주얼 밴드 (페스티벌 분위기 + 영상 카피) ──────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-28">
        <span className="grain-overlay" />
        {/* 우측 비주얼 */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-70 lg:block">
          <BrandScene variant="share" tone="dark" />
          <span className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
        </div>
        <Container className="relative">
          <div className="max-w-2xl">
            <Reveal>
              <p className="serif-italic text-2xl text-accent">
                ARCO Festival
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-5 font-mono text-sm tracking-[0.18em] text-muted-ink">
                &lt;두근두근 아르코에듀 체전&gt;
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-8 space-y-1.5 text-2xl leading-snug font-light text-paper sm:text-3xl">
                {CULTURE_COPY.videoCaption.map((line, i) =>
                  line === "" ? (
                    <div key={i} className="h-4" />
                  ) : (
                    <p key={i}>{line}</p>
                  ),
                )}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── 복지 철학 ─────────────────────────────────────── */}
      <section className="bg-paper py-24 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20">
            <Reveal>
              <div>
                <Kicker>Our Philosophy</Kicker>
                <h2 className="text-display mt-6 max-w-xl">
                  복지는 제도가 아니라
                  <br />
                  사람을 향한 태도입니다
                </h2>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="space-y-5 text-lg leading-relaxed text-muted">
                <p>
                  아르코에듀의 복지는 화려한 목록이 아니라, ‘함께 일하는 사람을 어떻게
                  대하는가’에 대한 답입니다. 삶의 순간을 함께 기념하고, 쉼과
                  건강을 챙기며, 솔직하게 소통하고, 끊임없이 배우는 일상.
                </p>
                <p className="text-ink">
                  그 일곱 가지 약속의 머리글자를 모으면, 우리의 이름{" "}
                  <span className="font-semibold text-accent-ink">ARCOEDU</span>{" "}
                  가 됩니다.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── 복리후생 ARCOEDU 7블록 ─────────────────────────── */}
      <section
        id="benefits"
        className="bg-grid scroll-mt-24 border-t border-line bg-paper-dim py-24 sm:py-28"
      >
        <Container>
          <SectionHead
            kicker="Benefits"
            title={
              <>
                일곱 글자로 완성되는
                <br />
                아르코에듀의 복지
              </>
            }
            lead="기념·재충전·건강·소통·배움·든든함·동반성장. 그 머리글자를 모으면 ARCOEDU가 됩니다."
          />

          {/* ARCOEDU 머리글자 시각화 */}
          <Reveal delay={0.06}>
            <div className="mt-12 flex flex-wrap gap-2 sm:gap-3">
              {acronym.map((ch, i) => (
                <span
                  key={i}
                  className="flex size-12 items-center justify-center rounded-card bg-ink text-2xl text-paper [font-family:var(--font-display)] sm:size-14 sm:text-3xl"
                >
                  {ch}
                </span>
              ))}
            </div>
          </Reveal>

          {/* 블록 그리드 — 역할별 차등: 항목 많은 블록(Knowledge/Support)은 와이드 */}
          <RevealGroup
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.05}
          >
            {BENEFIT_BLOCKS.map((b) => {
              const Icon = BENEFIT_ICONS[b.en] ?? Sparkles;
              const wide = b.items.length >= 5; // 항목 5개 이상 블록은 와이드
              return (
                <RevealItem
                  key={b.en}
                  className={wide ? "sm:col-span-2 lg:col-span-2" : undefined}
                >
                  <div
                    className={
                      "group flex h-full flex-col rounded-card border p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift " +
                      (wide
                        ? "border-transparent bg-ink text-paper hover:border-accent/40"
                        : "surface-card hover:border-accent/40")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          "flex size-12 items-center justify-center rounded-full " +
                          (wide
                            ? "bg-accent/15 text-accent"
                            : "bg-accent-soft text-accent-ink")
                        }
                      >
                        <Icon className="size-6" strokeWidth={1.5} />
                      </span>
                      <span
                        className={
                          "text-4xl [font-family:var(--font-display)] " +
                          (wide ? "text-white/15" : "text-line-strong")
                        }
                      >
                        {b.en.charAt(0)}
                      </span>
                    </div>
                    <p
                      className={
                        "mt-7 font-mono text-xs tracking-[0.18em] uppercase " +
                        (wide ? "text-accent" : "text-accent-ink")
                      }
                    >
                      {b.en}
                    </p>
                    <h3
                      className={
                        "mt-2 text-2xl font-bold tracking-tight " +
                        (wide ? "text-paper" : "text-ink")
                      }
                    >
                      {b.ko}
                    </h3>
                    <ul
                      className={
                        "mt-5 flex-1 space-y-3 border-t pt-5 " +
                        (wide ? "border-white/10" : "border-line") +
                        (wide ? " sm:columns-2 sm:gap-x-8" : "")
                      }
                    >
                      {b.items.map((item, i) => (
                        <li
                          key={i}
                          className={
                            "flex gap-3 text-[0.95rem] leading-relaxed break-inside-avoid " +
                            (wide ? "text-muted-ink" : "text-muted")
                          }
                        >
                          <span className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 일하는 환경 / 성장 지원 ───────────────────────── */}
      <section className="bg-paper py-24 sm:py-28">
        <Container>
          <SectionHead
            kicker="Workplace"
            title={
              <>
                일하는 환경이
                <br />
                성장의 속도를 만듭니다
              </>
            }
            lead="제도 너머, 매일의 일하는 방식. 아르코에듀가 일터에서 지키는 세 가지 약속입니다."
          />
          <RevealGroup
            className="mt-12 grid gap-5 sm:grid-cols-3"
            stagger={0.06}
          >
            {WORK_ENV.map((w) => {
              const Icon = w.icon;
              return (
                <RevealItem key={w.en}>
                  <div className="surface-card flex h-full flex-col rounded-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift">
                    <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                      <Icon className="size-6" strokeWidth={1.5} />
                    </span>
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

          {/* 모닝밀크 등 일상 디테일 한 줄 */}
          <Reveal delay={0.1}>
            <div className="mt-10 flex items-center gap-3 rounded-card bg-paper-dim p-6 text-sm text-muted">
              <Coffee className="size-5 shrink-0 text-accent-ink" strokeWidth={1.5} />
              <p>
                모닝 밀크와 저녁 식대·간식, 야근 교통비까지—작은 챙김이 모여
                하루의 결을 바꿉니다.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="border-t border-line bg-paper-dim py-20 sm:py-24">
        <Container className="text-center">
          <Reveal>
            <h2 className="text-display mx-auto max-w-2xl">
              이런 문화 속에서
              <br />
              함께 일하고 싶다면
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/jobs/general" variant="primary" size="lg" arrow>
                진행중인 채용 보기
              </Button>
              <Button href="/people/values" variant="outline" size="lg">
                인재상 보기
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
