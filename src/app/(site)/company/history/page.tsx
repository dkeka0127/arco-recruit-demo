import type { Metadata } from "next";
import { COMPANY_HISTORY, HISTORY_HEADER } from "@/lib/data/company";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { BrandScene } from "@/components/visuals/brand-scene";
import {
  CompanyNav,
  CompanyHeader,
  CompanyPager,
} from "@/components/company/company-nav";
import { HistoryTimeline } from "@/components/company/history-timeline";

export const metadata: Metadata = {
  title: "아르코에듀 역사 | 아르코채용",
  description: HISTORY_HEADER.desc,
};

const FOUNDED = Number(
  COMPANY_HISTORY[COMPANY_HISTORY.length - 1].year.replace(".", ""),
);
const LATEST = Number(COMPANY_HISTORY[0].year.replace(".", ""));
const HISTORY_SPAN = LATEST - FOUNDED;
const TOTAL_ITEMS = COMPANY_HISTORY.reduce((n, y) => n + y.items.length, 0);

const STATS = [
  { value: HISTORY_SPAN, suffix: "년", label: `${FOUNDED}–${LATEST} 함께한 시간` },
  { value: COMPANY_HISTORY.length, suffix: "개", label: "연도별 기록" },
  { value: TOTAL_ITEMS, suffix: "건", label: "기록된 발자취" },
];

export default function CompanyHistoryPage() {
  return (
    <>
      <div className="pt-32 sm:pt-40">
        <CompanyNav active="/company/history" />
      </div>

      {/* ── Dark intro band ───────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-16 text-paper sm:py-20">
        <span className="grain-overlay" />
        <span aria-hidden className="bg-grid-dark pointer-events-none absolute inset-0 opacity-60" />
        <Container size="wide" className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <Reveal>
                <CompanyHeader
                  kicker="History"
                  index="05"
                  title={
                    <span className="text-paper">
                      아르코에듀{" "}
                      <span className="font-semibold text-accent">역사</span>
                    </span>
                  }
                  desc={HISTORY_HEADER.desc}
                />
              </Reveal>

              {/* stats strip */}
              <Reveal delay={0.08}>
                <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-card border border-paper/10 bg-paper/10">
                  {STATS.map((s) => (
                    <div key={s.label} className="bg-ink px-5 py-6 sm:px-7">
                      <div className="flex items-baseline gap-0.5">
                        <CountUp
                          to={s.value}
                          className="text-3xl font-bold tracking-tight text-paper tabular-nums sm:text-4xl"
                        />
                        <span className="text-lg font-semibold text-accent">
                          {s.suffix}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-ink sm:text-sm">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.12}>
              <div className="surface-card relative aspect-[5/3] overflow-hidden rounded-card border-paper/10 lg:aspect-[4/3]">
                <BrandScene variant="growth" tone="dark" />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── Timeline ──────────────────────────────────────── */}
      <section className="bg-sky-veil py-16 sm:py-24">
        <Container size="wide">
          <HistoryTimeline years={COMPANY_HISTORY} />
        </Container>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="bg-ink py-16 text-paper sm:py-20">
        <Container size="wide">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
                다음 한 줄의 역사를 함께 쓸 분을 찾습니다.
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted-ink">
                {FOUNDED}년부터 오늘까지, 아르코에듀의 모든 발자취는 사람이 만들었습니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button href="/jobs" variant="accent" size="lg" arrow>
                진행중인 채용 보기
              </Button>
              <Button href="/company/business" variant="light" size="lg">
                사업분야 보기
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-paper pb-10 pt-2">
        <Container size="wide">
          <CompanyPager current="/company/history" />
        </Container>
      </section>
    </>
  );
}
