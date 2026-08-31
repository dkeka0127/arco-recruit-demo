"use client";

import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { HeroMedia } from "@/components/hero-media";
import { BrandScene } from "@/components/visuals/brand-scene";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/data/site";

const EASE = [0.16, 1, 0.3, 1] as const;
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const line = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};

const MARQUEE = [
  "개발",
  "기획",
  "마케팅",
  "콘텐츠",
  "디자인",
  "연구",
  "학사",
  "전문강사",
];

export function Hero() {
  const [line1, line2] = SITE.hero.lines;

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden text-paper">
      <HeroMedia /* src="/hero.mp4" */ />

      {/* 우측 브랜드 그래픽 레이어 — 타이포만의 추상성을 비주얼로 보완 */}
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 1.6, ease: EASE }}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] opacity-70 [mask-image:linear-gradient(to_right,transparent,black_55%)] lg:block"
      >
        <BrandScene variant="growth" tone="dark" />
      </motion.div>

      <div className="relative mx-auto w-full max-w-[1480px] px-5 pb-14 pt-32 sm:px-8 sm:pb-20">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={line}
            className="kicker mb-8 flex items-center gap-3 text-paper/70"
          >
            <span className="inline-block h-px w-8 bg-accent" />
            ARCO Careers — Bright Education, Brighter Sharing
          </motion.p>

          <h1 className="text-hero max-w-[20ch]">
            <motion.span variants={line} className="block">
              {line1}
            </motion.span>
          </h1>

          <motion.p
            variants={line}
            className="mt-8 max-w-2xl text-balance text-xl font-semibold leading-snug text-paper/90 sm:text-2xl"
          >
            {line2}
          </motion.p>

          <motion.p
            variants={line}
            className="mt-5 max-w-xl leading-relaxed text-paper/70"
          >
            교육의 경험을 바꾸고, 더 많은 사람의 가능성을 앞당깁니다.
            <br className="hidden sm:block" />
            지금, 아르코에듀와 함께 다음 성장을 설계하세요.
          </motion.p>

          <motion.div
            variants={line}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button href="/jobs" variant="light" size="lg" arrow>
              진행중인 채용 보기
            </Button>
            <Button
              href="/apply"
              size="lg"
              className="border border-white/25 bg-white/5 text-paper backdrop-blur-sm hover:bg-white/10"
            >
              입사지원 바로가기
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* bottom marquee */}
      <div className="relative border-t border-white/10 bg-ink/30 py-4 backdrop-blur-sm">
        <div className="flex w-max animate-marquee gap-10 pr-10">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((w, i) => (
            <span
              key={i}
              className="kicker flex items-center gap-10 text-paper/50"
            >
              {w}
              <span className="text-accent">✦</span>
            </span>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="pointer-events-none absolute bottom-24 right-6 hidden items-center gap-2 text-xs text-paper/50 lg:flex"
      >
        <ArrowDown className="size-4 animate-bounce" /> SCROLL
      </motion.div>
    </section>
  );
}
