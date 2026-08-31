import {
  GraduationCap,
  HandHeart,
  HeartHandshake,
  Share2,
  Sprout,
  Globe2,
  Recycle,
  type LucideIcon,
} from "lucide-react";

export type Pillar = {
  icon: keyof typeof ICONS;
  en: string;
  title: string;
  body: string;
};

const ICONS = {
  education: GraduationCap,
  scholarship: HandHeart,
  community: HeartHandshake,
  knowledge: Share2,
  growth: Sprout,
  global: Globe2,
  giveback: Recycle,
} satisfies Record<string, LucideIcon>;

/**
 * 가치 카드 그리드 — 역할별 스타일 차등.
 * 첫 카드는 다크/블루 강조(Server), 나머지는 라이트 정보 카드.
 * 흰배경+둥근+화살표 반복을 피하기 위해 강조 카드를 섞는다.
 */
export function ValuePillars({ pillars }: { pillars: Pillar[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {pillars.map((p, i) => {
        const Icon = ICONS[p.icon];
        const feature = i === 0;
        return (
          <div
            key={p.title}
            className={
              feature
                ? "mesh-ink grain relative flex flex-col overflow-hidden rounded-card border border-ink/20 p-9 text-paper sm:row-span-1"
                : "surface-card flex flex-col rounded-card p-9 transition-colors hover:border-accent/40"
            }
          >
            {feature && <span className="grain-overlay" />}
            <div className="relative flex items-center justify-between">
              <span
                className={
                  "font-mono text-xs tracking-[0.2em] " +
                  (feature ? "text-accent" : "text-muted-ink")
                }
              >
                0{i + 1}
              </span>
              <span
                className={
                  "flex size-12 items-center justify-center rounded-full " +
                  (feature
                    ? "bg-accent text-ink"
                    : "bg-accent-soft text-accent-ink")
                }
              >
                <Icon className="size-6" />
              </span>
            </div>

            <div className="relative mt-10">
              <p
                className={
                  "serif-italic text-lg " +
                  (feature ? "text-accent" : "text-accent-ink")
                }
              >
                {p.en}
              </p>
              <h3
                className={
                  "mt-2 text-2xl font-bold tracking-tight " +
                  (feature ? "text-paper" : "text-ink")
                }
              >
                {p.title}
              </h3>
            </div>

            <p
              className={
                "relative mt-5 text-[0.97rem] leading-relaxed " +
                (feature ? "text-muted-ink" : "text-muted")
              }
            >
              {p.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
