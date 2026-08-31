"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, X } from "lucide-react";
import { BrandScene } from "@/components/visuals/brand-scene";

type SceneVariant = "content" | "campus" | "share" | "people" | "global" | "growth";

/** 영상 8편 — 의미에 맞는 BrandScene variant 매핑 */
const VARIANTS: SceneVariant[] = [
  "content", // 합격CM송
  "share", // 브랜드 송
  "people", // 취업송
  "global", // 중국어송
  "growth", // 점수잡는 아르코에듀
  "content", // 인강
  "people", // 왕초보 영어탈출
  "campus", // 체육대회
];

/**
 * ARCO MOVIE — 영상 카드 그리드.
 * 실제 영상 링크가 데이터에 없으므로(레거시 영상 소스 미보존)
 * BrandScene 썸네일 카드 + placeholder 플레이어 모달로 재구성한다.
 */
export function MovieGrid({
  movies,
  playerLabels,
}: {
  movies: string[];
  playerLabels: string[];
}) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {movies.map((title, i) => (
          <button
            key={title}
            type="button"
            onClick={() => setActive(i)}
            className="group relative flex aspect-video flex-col justify-end overflow-hidden rounded-card border border-paper/10 bg-ink-800 p-5 text-left transition-all duration-300 hover:border-accent/40"
          >
            {/* BrandScene backdrop */}
            <span
              aria-hidden
              className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            >
              <BrandScene variant={VARIANTS[i % VARIANTS.length]} tone="dark" />
            </span>
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(to_top,rgba(14,27,36,0.85),transparent_60%)]"
            />
            {/* play badge */}
            <span className="absolute left-1/2 top-[42%] flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent/90 text-ink shadow-[0_8px_30px_-6px_rgba(82,179,216,0.6)] transition-transform duration-300 group-hover:scale-110">
              <Play className="size-5 translate-x-0.5 fill-current" />
            </span>
            <span className="relative">
              <span className="font-mono text-[0.65rem] tracking-[0.25em] text-accent">
                ARCO MOVIE
              </span>
              <span className="mt-1.5 block text-base font-medium leading-snug text-paper">
                {title}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* 플레이어 라벨 (레거시 player 영역 캡션 보존) */}
      {playerLabels.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-ink">
          <span className="font-mono text-[0.7rem] tracking-[0.2em] text-accent">
            PLAYER
          </span>
          {playerLabels.map((l) => (
            <span key={l} className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-accent/60" />
              {l}
            </span>
          ))}
        </div>
      )}

      {/* placeholder 모달 */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setActive(null)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={movies[active]}
              className="relative w-full max-w-3xl overflow-hidden rounded-card border border-paper/10 bg-ink-800 shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setActive(null)}
                className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/20"
              >
                <X className="size-4" />
              </button>
              <div className="relative flex aspect-video flex-col items-center justify-center gap-4 text-center">
                <span aria-hidden className="absolute inset-0">
                  <BrandScene variant={VARIANTS[active % VARIANTS.length]} tone="dark" />
                </span>
                <span aria-hidden className="absolute inset-0 bg-ink/30" />
                <span className="relative flex size-16 items-center justify-center rounded-full bg-accent/90 text-ink">
                  <Play className="size-6 translate-x-0.5 fill-current" />
                </span>
                <div className="relative">
                  <p className="font-mono text-[0.7rem] tracking-[0.25em] text-accent">
                    ARCO MOVIE
                  </p>
                  <p className="mt-2 text-xl font-medium text-paper">
                    {movies[active]}
                  </p>
                  <p className="mt-3 text-sm text-muted-ink">
                    영상 콘텐츠는 준비 중입니다.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
