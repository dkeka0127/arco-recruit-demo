"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "채용공고", href: "/jobs" },
  { label: "입사지원", href: "/apply" },
  { label: "아르코 피플", href: "/people" },
  { label: "회사소개", href: "/company" },
  { label: "FAQ", href: "/faq" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 경로 변경 시 모바일 메뉴 닫기 — 렌더 중 상태 보정 패턴 (effect 내 setState 회피)
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-7 z-50 transition-all duration-500",
        transparent
          ? "bg-transparent"
          : "border-b border-line/80 bg-paper/80 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-5 sm:h-[72px] sm:px-8">
        <Link
          href="/"
          className={cn(
            "flex items-baseline gap-1.5 text-xl font-extrabold tracking-tight transition-colors",
            transparent ? "text-paper" : "text-ink",
          )}
        >
          아르코
          <span className="text-accent">채용</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  transparent
                    ? "text-paper/80 hover:text-paper"
                    : "text-ink/70 hover:text-ink",
                  active && (transparent ? "text-paper" : "text-ink"),
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute inset-x-4 -bottom-0.5 h-[3px] rounded-full bg-accent"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/apply/result"
            className={cn(
              "hidden rounded-full px-4 py-2 text-sm font-medium transition-colors sm:block",
              transparent ? "text-paper/80 hover:text-paper" : "text-ink/70 hover:text-ink",
            )}
          >
            지원현황
          </Link>
          <Button
            href="/apply"
            variant={transparent ? "light" : "accent"}
            size="sm"
            className="hidden sm:inline-flex"
            arrow
          >
            입사지원
          </Button>
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setOpen(true)}
            className={cn(
              "flex size-10 items-center justify-center rounded-full transition-colors lg:hidden",
              transparent ? "text-paper hover:bg-white/10" : "text-ink hover:bg-ink/5",
            )}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 bottom-0 top-7 z-50 mesh-ink lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-5 sm:h-[72px] sm:px-8">
              <span className="text-xl font-extrabold text-paper">
                아르코<span className="text-accent">채용</span>
              </span>
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="flex size-10 items-center justify-center rounded-full text-paper hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-5 pt-8 sm:px-8">
              {NAV.concat({ label: "지원현황", href: "/apply/result" }).map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.06 }}
                >
                  <Link
                    href={item.href}
                    className="block border-b border-white/10 py-4 text-3xl font-bold tracking-tight text-paper"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <Button href="/apply" variant="accent" size="lg" arrow className="w-full">
                  입사지원 하기
                </Button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
