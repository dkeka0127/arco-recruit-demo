"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * 히어로 배경 미디어.
 * - src(영상)가 있으면 자동재생 루프 영상, 로드 실패/모바일/감속모드에서는 메시 그라데이션 fallback.
 * - 추후 AI 생성 5~8초 무드 영상을 /public/hero.mp4 로 넣고 src="/hero.mp4" 전달.
 */
export function HeroMedia({
  src,
  poster,
}: {
  src?: string;
  poster?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const showVideo = src && !failed && !reduce;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden mesh-ink">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        {showVideo ? (
          <video
            className="size-full object-cover opacity-60"
            autoPlay
            muted
            loop
            playsInline
            poster={poster}
            onError={() => setFailed(true)}
          >
            <source src={src} type="video/mp4" />
          </video>
        ) : (
          <FallbackField />
        )}
      </motion.div>

      {/* grain + vignette */}
      <span className="grain-overlay opacity-[0.07]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />
    </div>
  );
}

/** 영상이 없을 때의 살아있는 추상 배경 — 부드럽게 떠다니는 오로라 블롭. */
function FallbackField() {
  const reduce = useReducedMotion();
  const blobs = [
    { c: "rgba(82,179,216,0.55)", s: "42vw", x: "8%", y: "12%", d: 0 },
    { c: "rgba(42,147,192,0.42)", s: "38vw", x: "70%", y: "8%", d: 2 },
    { c: "rgba(82,179,216,0.30)", s: "46vw", x: "52%", y: "62%", d: 4 },
  ];
  return (
    <div className="absolute inset-0">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[80px]"
          style={{
            width: b.s,
            height: b.s,
            left: b.x,
            top: b.y,
            background: b.c,
          }}
          animate={
            reduce
              ? undefined
              : { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.12, 0.95, 1] }
          }
          transition={{ duration: 18 + i * 4, repeat: Infinity, ease: "easeInOut", delay: b.d }}
        />
      ))}
    </div>
  );
}
