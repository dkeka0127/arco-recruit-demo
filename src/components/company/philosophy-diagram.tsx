import type { CompanyPhilosophy } from "@/lib/types";

type Node = CompanyPhilosophy["diagram"]["nodes"][number];

/**
 * 아르코에듀 철학 원형 다이어그램.
 * 가운데 core(center) + 사분면 4개 노드(철인 figure) + 연결선.
 * 데스크톱: 실제 원형 SVG 레이아웃. 모바일: 세로 스택으로 자연 폴백.
 * 빈 다크 장식이 아니라 철학 구조 자체를 시각화한다.
 */

// 사분면별 좌표(% 기준) + 정렬
const QUAD: Record<
  string,
  { x: number; y: number; align: "left" | "right"; en: string }
> = {
  좌상: { x: 19, y: 20, align: "right", en: "Academia" },
  우상: { x: 81, y: 20, align: "left", en: "Compassion" },
  좌하: { x: 19, y: 80, align: "right", en: "Hope" },
  우하: { x: 81, y: 80, align: "left", en: "Reality" },
};

export function PhilosophyDiagram({
  center,
  nodes,
  bottomLabel,
}: {
  center: string;
  nodes: Node[];
  bottomLabel: string;
}) {
  return (
    <div>
      {/* ── 데스크톱: 원형 레이아웃 ─────────────────────────── */}
      <div className="relative mx-auto hidden aspect-square w-full max-w-[760px] lg:block">
        {/* 연결선 SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="phil-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#52b3d8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#52b3d8" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* core halo */}
          <circle cx="50" cy="50" r="34" fill="url(#phil-core)" />
          {/* orbit rings */}
          <circle
            cx="50"
            cy="50"
            r="33"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.3"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.3"
            strokeDasharray="1 2"
          />
          {/* spokes to four quadrants */}
          {Object.values(QUAD).map((q, i) => (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={q.x}
              y2={q.y}
              stroke="rgba(82,179,216,0.4)"
              strokeWidth="0.35"
            />
          ))}
          {Object.values(QUAD).map((q, i) => (
            <circle key={`d${i}`} cx={q.x} cy={q.y} r="0.9" fill="#52b3d8" />
          ))}
        </svg>

        {/* center core */}
        <div className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="rounded-full border border-accent/40 bg-accent/10 px-7 py-8 backdrop-blur">
            <span className="font-mono text-[0.65rem] tracking-[0.3em] text-accent">
              CORE
            </span>
            <p className="mt-3 text-base font-semibold leading-snug text-paper">
              {center}
            </p>
          </div>
        </div>

        {/* four quadrant nodes */}
        {nodes.map((node) => {
          const q = QUAD[node.position];
          if (!q) return null;
          return (
            <div
              key={node.position}
              className="absolute w-[34%] -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${q.x}%`, top: `${q.y}%` }}
            >
              <div
                className={
                  "flex flex-col gap-2 rounded-card border border-paper/12 bg-paper/[0.05] p-5 backdrop-blur " +
                  (q.align === "right" ? "text-right" : "text-left")
                }
              >
                <span className="serif-italic text-sm text-accent">{q.en}</span>
                <p className="text-[0.95rem] font-medium leading-snug text-paper">
                  {node.text}
                </p>
                <p className="text-xs text-muted-ink">{node.figure}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 모바일/태블릿: 세로 스택 ───────────────────────── */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-md rounded-card border border-accent/40 bg-accent/10 p-7 text-center backdrop-blur">
          <span className="font-mono text-[0.65rem] tracking-[0.3em] text-accent">
            CORE
          </span>
          <p className="mt-3 text-base font-semibold leading-snug text-paper">
            {center}
          </p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {nodes.map((node) => {
            const q = QUAD[node.position];
            return (
              <div
                key={node.position}
                className="flex flex-col gap-2 rounded-card border border-paper/12 bg-paper/[0.05] p-5"
              >
                <span className="serif-italic text-sm text-accent">
                  {q?.en}
                </span>
                <p className="text-[0.95rem] font-medium leading-snug text-paper">
                  {node.text}
                </p>
                <p className="text-xs text-muted-ink">{node.figure}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* bottom label */}
      <div className="mx-auto mt-12 w-fit rounded-full border border-accent/40 bg-accent/10 px-7 py-3 text-center text-base font-medium text-accent">
        {bottomLabel}
      </div>
    </div>
  );
}
