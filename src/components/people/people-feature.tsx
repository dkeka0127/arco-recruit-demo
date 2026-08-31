import { Quote } from "lucide-react";
import { BrandScene } from "@/components/visuals/brand-scene";
import type { Interview } from "./interviews";

/**
 * 인터뷰 영역 (C등급 신규 창작).
 * 첫 인물은 비주얼을 가진 와이드 에디토리얼 카드, 나머지는 인용 중심 카드.
 * 모노그램 아바타 · 직무/팀 · 한 줄 인용 · 짧은 스토리.
 */
export function PeopleFeature({ people }: { people: Interview[] }) {
  if (people.length === 0) return null;
  const [lead, ...rest] = people;

  return (
    <div className="space-y-5">
      {/* ── 대표 인터뷰 (와이드 에디토리얼) ─────────────── */}
      <article className="mesh-ink grain group relative grid overflow-hidden rounded-lg text-paper lg:grid-cols-[1.1fr_0.9fr]">
        <span className="grain-overlay" />
        <span className="bg-grid-dark pointer-events-none absolute inset-0 opacity-30" />
        {/* 좌: 인용 + 스토리 */}
        <div className="relative flex flex-col justify-between gap-10 p-9 sm:p-12">
          <div>
            <Quote className="size-8 text-accent" aria-hidden />
            <p className="mt-5 text-2xl leading-snug font-light text-paper sm:text-3xl">
              {lead.quote}
            </p>
            <p className="mt-6 max-w-xl leading-relaxed text-muted-ink">
              {lead.story}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-2xl text-ink [font-family:var(--font-display)]">
              {lead.initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-paper">
                {lead.name}
              </p>
              <p className="truncate text-sm text-muted-ink">
                {lead.role} · {lead.team}
              </p>
            </div>
            <span className="ml-auto hidden font-mono text-xs tracking-[0.18em] text-accent uppercase sm:inline">
              {lead.tag}
            </span>
          </div>
        </div>
        {/* 우: 비주얼 */}
        <div className="relative hidden min-h-[20rem] lg:block">
          <BrandScene variant="people" tone="dark" />
          <span className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent" />
        </div>
      </article>

      {/* ── 나머지 인터뷰 ───────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <article
            key={p.name}
            className="group surface-card relative flex h-full flex-col rounded-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift"
          >
            {/* 헤더: 모노그램 + 이름/직무 */}
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-2xl text-paper [font-family:var(--font-display)] transition-colors duration-500 group-hover:bg-accent group-hover:text-ink">
                {p.initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold tracking-tight text-ink">
                  {p.name}
                </p>
                <p className="truncate text-sm text-muted">
                  {p.role} · {p.team}
                </p>
              </div>
            </div>

            {/* 인용 */}
            <div className="mt-7 flex-1">
              <Quote className="size-6 text-accent/50" aria-hidden />
              <p className="mt-3 text-xl leading-snug text-ink">{p.quote}</p>
              <p className="mt-5 text-[0.95rem] leading-relaxed text-muted">
                {p.story}
              </p>
            </div>

            {/* 태그 */}
            <div className="mt-7 border-t border-line pt-5">
              <span className="font-mono text-xs tracking-[0.18em] text-accent-ink uppercase">
                {p.tag}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
