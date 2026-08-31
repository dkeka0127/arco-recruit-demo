import type { Metadata } from "next";
import { MapPin, Printer, Navigation, ExternalLink } from "lucide-react";
import { LOCATION } from "@/lib/data/company";
import { Container } from "@/components/ui/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import {
  CompanyNav,
  CompanyHeader,
  CompanyPager,
} from "@/components/company/company-nav";

export const metadata: Metadata = {
  title: "오시는 길 | 아르코채용",
  description: LOCATION.address,
};

// 지도/지도앱용 주소 — 가상 주소 (데모)
const MAP_QUERY = "서울특별시 어딘가구 가상로 123 아르코타워";
const ENCODED = encodeURIComponent(MAP_QUERY);
const MAP_EMBED = `https://www.google.com/maps?q=${ENCODED}&z=17&output=embed`;
const GOOGLE_LINK = `https://www.google.com/maps/search/?api=1&query=${ENCODED}`;
const NAVER_LINK = `https://map.naver.com/v5/search/${ENCODED}`;
const KAKAO_LINK = `https://map.kakao.com/?q=${ENCODED}`;

export default function CompanyLocationPage() {
  const { mapLabels, address, mainDirection, annexes, buttons } = LOCATION;

  return (
    <>
      <div className="pt-32 sm:pt-40">
        <CompanyNav active="/company/location" />
      </div>

      <section className="bg-paper py-16 sm:py-24">
        <Container>
          <Reveal>
            <CompanyHeader
              kicker="Location"
              index="07"
              title={
                <>
                  오시는{" "}
                  <span className="font-semibold text-accent-ink">길</span>
                </>
              }
              desc="아르코에듀 가온캠퍼스 본관(아르코타워)으로 안내합니다. (가상의 주소입니다)"
            />
          </Reveal>

          {/* 주소 + 빠른 버튼 */}
          <Reveal delay={0.06}>
            <div className="mt-12 flex flex-col gap-6 rounded-card border border-line bg-pure p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                  <MapPin className="size-5" />
                </span>
                <p className="text-base font-medium leading-relaxed text-ink sm:text-lg">
                  {address}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <a
                  href={GOOGLE_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                >
                  <Navigation className="size-4" />
                  {buttons[0]}
                </a>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                >
                  <Printer className="size-4" />
                  {buttons[1]}
                </button>
              </div>
            </div>
          </Reveal>

          {/* 지도 embed */}
          <Reveal delay={0.08}>
            <div className="mt-6 overflow-hidden rounded-card border border-line bg-pure">
              <iframe
                src={MAP_EMBED}
                title="아르코에듀 본사 위치 지도"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="aspect-[16/10] w-full sm:aspect-[16/7]"
              />
              {/* 가온역 출구 칩 */}
              <div className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
                <span className="font-mono text-[0.7rem] tracking-[0.2em] text-muted-ink">
                  가온역 출구
                </span>
                {mapLabels.exits.map((e) => (
                  <span
                    key={e}
                    className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-ink"
                  >
                    {e}
                  </span>
                ))}
                <span className="ml-1 text-xs text-muted">
                  본관은 <strong className="font-semibold text-accent-ink">3번 출구</strong>에서 가장 가깝습니다.
                </span>
              </div>
            </div>
          </Reveal>

          {/* 본관 길찾기 */}
          <Reveal delay={0.1}>
            <div className="mt-6 rounded-card border border-accent/30 bg-accent-soft/50 p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-ink">
                  본관
                </span>
                <h2 className="text-lg font-semibold tracking-tight text-ink">
                  아르코에듀 본관 (아르코타워) 가기
                </h2>
              </div>
              <p className="mt-4 text-[0.95rem] font-medium leading-relaxed text-accent-ink">
                {mainDirection.summary}
              </p>
              <ol className="mt-5 flex flex-col gap-3">
                {mainDirection.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink/85">
                    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-[0.7rem] font-bold text-paper">
                      {i + 1}
                    </span>
                    {s.replace(/^\d+\.\s*/, "")}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 별관 ①~⑥ ─────────────────────────────────────── */}
      <section className="bg-paper-dim py-16 sm:py-24">
        <Container>
          <Reveal>
            <span className="kicker text-accent-ink">
              <span className="mr-2 inline-block h-px w-6 bg-accent align-middle" />
              Annexes
            </span>
            <h2 className="text-display mt-5">가온캠퍼스 별관 안내</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              본관 주변에 위치한 6개 별관의 길찾기 경로입니다.
            </p>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-5 lg:grid-cols-2" stagger={0.05}>
            {annexes.map((a) => (
              <RevealItem key={a.no}>
                <article className="flex h-full flex-col gap-4 rounded-card border border-line bg-pure p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-ink text-base font-semibold text-paper">
                      {a.no}
                    </span>
                    <h3 className="text-lg font-semibold tracking-tight text-ink">
                      {a.name}
                    </h3>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-accent-ink">
                    {a.summary}
                  </p>
                  <ol className="flex flex-col gap-2 border-t border-line pt-4">
                    {a.steps.map((s, i) => (
                      <li key={i} className="text-sm leading-relaxed text-muted">
                        {s}
                      </li>
                    ))}
                  </ol>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 지도앱 열기 CTA ───────────────────────────────── */}
      <section className="bg-ink py-14 text-paper sm:py-16">
        <Container>
          <div className="flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
            <div>
              <p className="text-xl font-semibold tracking-tight text-paper sm:text-2xl">
                지도 앱으로 길 안내 받기
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-ink">
                {MAP_QUERY}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Google", href: GOOGLE_LINK },
                { label: "네이버 지도", href: NAVER_LINK },
                { label: "카카오맵", href: KAKAO_LINK },
              ].map((m) => (
                <a
                  key={m.label}
                  href={m.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-accent"
                >
                  {m.label}
                  <ExternalLink className="size-3.5" />
                </a>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-paper pb-10 pt-2">
        <Container>
          <CompanyPager current="/company/location" />
        </Container>
      </section>
    </>
  );
}
