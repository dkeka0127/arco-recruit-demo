"use client";

/**
 * 포트폴리오 데모 안내 배너 — 지원자 사이트/HR 콘솔 셸 최상단에 고정 노출.
 * 셸 쪽에서는 배너 높이(h-7)만큼 상단 오프셋을 잡아준다.
 * 모드 전환 링크로 데모의 다른 얼굴(지원자/HR/면접관/필기시험)을 발견 가능하게 한다.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const MODES = [
  { href: "/", label: "지원자", match: (p: string) => !p.startsWith("/hr") && !p.startsWith("/interviewer") && !p.startsWith("/exam") },
  { href: "/hr", label: "HR 콘솔", match: (p: string) => p.startsWith("/hr") },
  { href: "/interviewer/ivp-taekyung-r9c47f", label: "면접관", match: (p: string) => p.startsWith("/interviewer") },
  { href: "/exam/exm-me-4k2p9d", label: "필기시험", match: (p: string) => p.startsWith("/exam") },
];

export function DemoBanner() {
  const pathname = usePathname() ?? "/";

  return (
    <div
      role="note"
      className="fixed inset-x-0 top-0 z-[70] flex h-7 items-center justify-center gap-2.5 bg-ink px-3 text-[0.7rem] font-medium tracking-tight text-paper/80 sm:gap-4"
    >
      <span className="hidden items-center gap-1 sm:flex">
        <span aria-hidden>🧪</span>
        <span>포트폴리오 데모 — 데이터는 가상 · 브라우저에만 저장</span>
      </span>
      <span className="hidden h-3 w-px bg-paper/25 sm:block" aria-hidden />
      <nav aria-label="데모 모드 전환" className="flex items-center gap-2 sm:gap-2.5">
        <span className="text-paper/45">모드:</span>
        {MODES.map((m) => {
          const active = m.match(pathname);
          return (
            <Link
              key={m.href}
              href={m.href}
              className={
                active
                  ? "rounded-full bg-paper/90 px-2 py-0.5 font-bold text-ink"
                  : "rounded-full px-1.5 py-0.5 text-paper/70 underline decoration-paper/30 underline-offset-2 transition-colors hover:text-paper"
              }
              aria-current={active ? "page" : undefined}
            >
              {m.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
