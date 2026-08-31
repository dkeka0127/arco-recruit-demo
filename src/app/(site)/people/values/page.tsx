import type { Metadata } from "next";
import { TALENT_VALUES, VALUES_HEADER } from "@/lib/data/people";
import { Container, Kicker } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { BrandScene } from "@/components/visuals/brand-scene";
import { ValuesGrid } from "@/components/people/values-grid";

export const metadata: Metadata = {
  title: "인재상 | 아르코 피플 | 아르코채용",
  description:
    "열정인·도전인·전문인·소통인. 아르코에듀가 함께 일하고 싶은 인재상을 소개합니다.",
};

export default function ValuesPage() {
  return (
    <main className="pt-32 sm:pt-40">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="bg-sky-veil pb-16 sm:pb-20">
        <Container>
          <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div>
              <Reveal>
                <Kicker>Talent Values</Kicker>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="text-hero mt-7 max-w-3xl">
                  아르코에듀가 함께할
                  <br />
                  <span className="font-semibold text-accent-ink">네 사람</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                  {VALUES_HEADER.desc}
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.14}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line">
                <BrandScene variant="people" tone="light" />
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 p-5">
                  {TALENT_VALUES.map((v) => (
                    <span
                      key={v.keyword}
                      className="rounded-full bg-pure/85 px-3 py-1 text-xs font-medium tracking-tight text-accent-ink backdrop-blur"
                    >
                      {v.keyword}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── 인재상 4 그리드 ───────────────────────────────── */}
      <section className="bg-paper pb-24 sm:pb-28">
        <Container>
          <Reveal>
            <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
              카드에 마우스를 올리면 해당 인재상이 강조됩니다. 네 가지 기준은
              따로 떨어져 있지 않고, 한 사람 안에서 함께 자랍니다.
            </p>
          </Reveal>
          <Reveal>
            <ValuesGrid values={TALENT_VALUES} />
          </Reveal>
        </Container>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-28">
        <span className="grain-overlay" />
        <span className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" />
        <Container className="relative text-center">
          <Reveal>
            <p className="serif-italic text-xl text-accent">
              Be Professional, ARCO People!
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-display mx-auto mt-5 max-w-3xl text-paper">
              당신은 어떤 사람인가요?
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/people/jobs" variant="accent" size="lg" arrow>
                직무소개 보기
              </Button>
              <Button href="/people/culture" variant="light" size="lg">
                아르코 컬처 보기
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
