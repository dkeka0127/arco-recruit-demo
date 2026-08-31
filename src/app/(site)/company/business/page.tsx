import type { Metadata } from "next";
import {
  BUSINESS_HEADER,
  BUSINESS_CATEGORIES,
  BUSINESS_BRANDS,
} from "@/lib/data/company";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { BrandScene } from "@/components/visuals/brand-scene";
import {
  CompanyNav,
  CompanyHeader,
  CompanyPager,
} from "@/components/company/company-nav";
import { BusinessExplorer } from "@/components/company/business-explorer";

export const metadata: Metadata = {
  title: "아르코에듀 사업분야 | 아르코채용",
  description: BUSINESS_HEADER.desc,
};

export default function CompanyBusinessPage() {
  return (
    <>
      <div className="pt-32 sm:pt-40">
        <CompanyNav active="/company/business" />
      </div>

      {/* ── Header + overview ─────────────────────────────── */}
      <section className="bg-paper py-16 sm:py-24">
        <Container>
          <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <Reveal>
              <CompanyHeader
                kicker="Business"
                index="04"
                title={
                  <>
                    아르코에듀{" "}
                    <span className="font-semibold text-accent-ink">
                      사업분야
                    </span>
                  </>
                }
                desc={BUSINESS_HEADER.desc}
              />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="surface-card relative aspect-[5/3] overflow-hidden rounded-card">
                <BrandScene variant="content" tone="light" />
              </div>
            </Reveal>
          </div>

          {/* 개요 지표 */}
          <Reveal delay={0.08}>
            <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
              {[
                { v: BUSINESS_CATEGORIES.length, s: "개 사업 분야", d: "공무원·자격증·어학·편입·전문직·유학·취업·기업교육" },
                { v: BUSINESS_BRANDS.length, s: "개 교육 브랜드", d: "어학부터 전문직 자격까지 전문화된 브랜드" },
                { v: 1999, s: "년 출발", d: "아르코에듀 토플 프로그램을 모태로 시작" },
              ].map((x) => (
                <div key={x.s} className="bg-pure px-6 py-7">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-ink tabular-nums">
                      {x.v}
                    </span>
                    <span className="text-base font-semibold text-accent-ink">
                      {x.s}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{x.d}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-10 max-w-3xl text-sm font-medium leading-relaxed text-accent-ink">
              카테고리를 펼치면 각 브랜드의 상세 소개를 확인할 수 있습니다.
            </p>
            <div className="mt-5">
              <BusinessExplorer
                categories={BUSINESS_CATEGORIES}
                brands={BUSINESS_BRANDS}
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="bg-paper-dim py-16 sm:py-20">
        <Container className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              더 넓은 나눔을 위하여, 함께 성장할 분을 찾습니다.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted">
              아르코에듀는 끊임없이 새로운 교육 분야로 확장하고 있습니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button href="/jobs" size="lg" arrow>
              진행중인 채용 보기
            </Button>
            <Button href="/company/history" variant="outline" size="lg">
              아르코에듀 역사 보기
            </Button>
          </div>
        </Container>
      </section>

      <section className="bg-paper pb-10 pt-2">
        <Container>
          <CompanyPager current="/company/business" />
        </Container>
      </section>
    </>
  );
}
