import { cn } from "@/lib/utils";

type Variant =
  | "growth"
  | "people"
  | "global"
  | "share"
  | "campus"
  | "content"
  | "default";

/**
 * 브랜드 추상 SVG 비주얼 — 실사진 대용 에디토리얼 그래픽.
 * 빈 다크/라이트 영역을 의미 있는 비주얼로 채운다. 스카이블루/네이비 팔레트.
 * tone="dark": mesh-ink 위 / tone="light": paper 위.
 */
export function BrandScene({
  variant = "default",
  tone = "dark",
  className,
}: {
  variant?: Variant;
  tone?: "dark" | "light";
  className?: string;
}) {
  const sky = "#52b3d8";
  const line = tone === "dark" ? "rgba(255,255,255,0.16)" : "rgba(20,98,127,0.16)";
  const lineSoft = tone === "dark" ? "rgba(255,255,255,0.08)" : "rgba(20,98,127,0.08)";
  const ink = tone === "dark" ? "#0e1b24" : "#ffffff";

  return (
    <svg
      viewBox="0 0 400 300"
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id={`bs-glow-${variant}`} cx="50%" cy="22%" r="80%">
          <stop offset="0%" stopColor={sky} stopOpacity={tone === "dark" ? 0.5 : 0.32} />
          <stop offset="55%" stopColor={sky} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`bs-stroke-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={sky} />
          <stop offset="100%" stopColor={tone === "dark" ? "#ffffff" : "#14627f"} />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill={ink} />
      <rect width="400" height="300" fill={`url(#bs-glow-${variant})`} />

      {/* faint grid */}
      <g stroke={lineSoft} strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="300" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} />
        ))}
      </g>

      <Motif variant={variant} sky={sky} line={line} stroke={`url(#bs-stroke-${variant})`} />
    </svg>
  );
}

function Motif({
  variant,
  sky,
  line,
  stroke,
}: {
  variant: Variant;
  sky: string;
  line: string;
  stroke: string;
}) {
  switch (variant) {
    case "growth":
      return (
        <g fill="none">
          <polyline
            points="40,240 110,200 170,210 240,140 300,150 360,70"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            [40, 240],
            [170, 210],
            [240, 140],
            [360, 70],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill={sky} />
          ))}
          <path d="M360 70 l-16 4 l8 -16 z" fill={sky} />
          {[210, 250, 175, 230].map((h, i) => (
            <rect
              key={i}
              x={70 + i * 70}
              y={300 - h * 0.45}
              width="16"
              height={h * 0.45}
              rx="3"
              fill={line}
            />
          ))}
        </g>
      );
    case "people":
      return (
        <g>
          {[
            [120, 110],
            [260, 90],
            [200, 180],
            [90, 220],
            [320, 200],
          ].map(([x, y], i) => (
            <g key={i}>
              <line x1={x} y1={y} x2="200" y2="150" stroke={line} strokeWidth="1.5" />
              <circle cx={x} cy={y} r="22" fill="none" stroke={stroke} strokeWidth="2" />
              <circle cx={x} cy={y - 4} r="6" fill={sky} />
              <path d={`M${x - 11} ${y + 14} a11 9 0 0 1 22 0`} fill={sky} opacity="0.85" />
            </g>
          ))}
          <circle cx="200" cy="150" r="8" fill={sky} />
        </g>
      );
    case "global":
      return (
        <g fill="none" stroke={stroke} strokeWidth="2">
          <circle cx="200" cy="150" r="92" />
          <ellipse cx="200" cy="150" rx="40" ry="92" stroke={line} />
          <ellipse cx="200" cy="150" rx="78" ry="92" stroke={line} />
          <line x1="108" y1="150" x2="292" y2="150" stroke={line} />
          <line x1="120" y1="108" x2="280" y2="108" stroke={line} />
          <line x1="120" y1="192" x2="280" y2="192" stroke={line} />
          {[
            [160, 110],
            [250, 140],
            [180, 190],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={sky} stroke="none" />
          ))}
        </g>
      );
    case "share":
      return (
        <g fill="none">
          {[36, 70, 104, 138].map((r, i) => (
            <circle
              key={i}
              cx="200"
              cy="150"
              r={r}
              stroke={i === 0 ? stroke : line}
              strokeWidth={i === 0 ? 3 : 1.5}
            />
          ))}
          <circle cx="200" cy="150" r="10" fill={sky} />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <circle
                key={i}
                cx={200 + Math.cos(rad) * 104}
                cy={150 + Math.sin(rad) * 104}
                r="5"
                fill={sky}
              />
            );
          })}
        </g>
      );
    case "campus":
      return (
        <g fill="none" stroke={stroke} strokeWidth="2">
          <rect x="120" y="110" width="70" height="150" stroke={line} />
          <rect x="210" y="70" width="80" height="190" />
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`a${i}`} x1="128" y1={130 + i * 26} x2="182" y2={130 + i * 26} stroke={line} />
          ))}
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 3 }).map((_, c) => (
              <rect key={`b${r}-${c}`} x={222 + c * 22} y={84 + r * 28} width="12" height="16" fill={sky} fillOpacity="0.25" stroke="none" />
            )),
          )}
          <line x1="80" y1="260" x2="330" y2="260" stroke={sky} />
        </g>
      );
    case "content":
      return (
        <g fill="none">
          <rect x="120" y="80" width="160" height="150" rx="8" stroke={stroke} strokeWidth="2" />
          {[120, 140, 160].map((y, i) => (
            <line key={i} x1="145" y1={y + 5} x2={255 - i * 24} y2={y + 5} stroke={line} strokeWidth="6" strokeLinecap="round" />
          ))}
          <circle cx="200" cy="200" r="3" fill={sky} />
          <path d="M150 200 h100" stroke={line} strokeWidth="2" />
          <path d="M270 70 l34 0 l0 34" stroke={sky} strokeWidth="2" />
        </g>
      );
    default:
      return (
        <g fill="none">
          {[40, 80, 120].map((r, i) => (
            <circle key={i} cx="260" cy="120" r={r} stroke={i === 0 ? stroke : line} strokeWidth={i === 0 ? 3 : 1.5} />
          ))}
          <circle cx="260" cy="120" r="7" fill={sky} />
          <polyline points="40,250 130,210 210,230 320,170" stroke={line} strokeWidth="2" />
        </g>
      );
  }
}
