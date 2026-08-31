import { type ReactNode } from "react";
import { BrandScene } from "@/components/visuals/brand-scene";

type BrandVariant = "people" | "share" | "content" | "global" | "growth" | "campus";

/**
 * 페이지별 대표(성격) 섹션 — "누구를 위한, 어떤 지원인지"를 한눈에 드러내는 헤더 카드.
 * 좌측 텍스트 + 우측 브랜드 비주얼 스트립. 각 유형 페이지가 같은 껍데기로 보이지 않도록
 * tone/variant/카피로 차별화한다.
 */
export function ApplyHighlight({
  kicker,
  title,
  body,
  brand,
  stats,
}: {
  kicker: string;
  title: ReactNode;
  body: ReactNode;
  brand: BrandVariant;
  /** 우측 하단 핵심 지표/배지 */
  stats?: { label: string; value: string }[];
}) {
  return (
    <div className="surface-card relative overflow-hidden rounded-card">
      <div className="grid gap-0 sm:grid-cols-[1.4fr_1fr]">
        <div className="relative z-10 p-7 sm:p-9">
          <span className="kicker text-accent-ink">{kicker}</span>
          <h2 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-ink sm:text-[1.75rem]">
            {title}
          </h2>
          <div className="mt-4 max-w-xl text-[0.97rem] leading-relaxed text-muted">
            {body}
          </div>

          {stats && stats.length > 0 && (
            <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-ink">
                    {s.label}
                  </dt>
                  <dd className="mt-1 text-lg font-bold tracking-tight text-ink">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* 우측 비주얼 — 빈 면이 아닌 의미 있는 그래픽 */}
        <div className="relative min-h-[160px] overflow-hidden bg-ink sm:min-h-0">
          <BrandScene variant={brand} tone="dark" className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
}
