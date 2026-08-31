"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * 하단 고정 지원 CTA 바.
 * 스크롤이 일정 지점을 지나면 화면 하단에서 슬라이드 인.
 */
export function StickyApply({
  label,
  href,
  note,
  eyebrow,
}: {
  label: string;
  href: string;
  note?: string;
  eyebrow?: string;
}) {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      // 상단 70vh 지난 뒤 노출, 페이지 최하단(푸터 CTA) 근처에서는 숨김
      setShow(scrolled > window.innerHeight * 0.7 && scrolled < max - 480);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduce ? false : { y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: 90, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6 sm:pb-6"
        >
          <div className="pointer-events-auto mx-auto flex max-w-[1240px] items-center justify-between gap-4 rounded-card border border-white/10 bg-ink/95 px-5 py-3.5 text-paper shadow-pop backdrop-blur-md sm:px-7 sm:py-4">
            <div className="min-w-0">
              {eyebrow && (
                <p className="kicker text-accent">{eyebrow}</p>
              )}
              {note && (
                <p className="mt-0.5 hidden truncate text-sm text-muted-ink sm:block">
                  {note}
                </p>
              )}
            </div>
            <Link
              href={href}
              className={cn(
                "group/btn inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold tracking-tight text-ink transition-colors duration-300 hover:bg-accent-deep hover:text-white",
              )}
            >
              {label}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
