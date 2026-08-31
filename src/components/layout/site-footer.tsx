import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { SITE } from "@/lib/data/site";

const NAV_GROUPS = [
  {
    title: "채용",
    links: [
      { label: "전체 채용공고", href: "/jobs" },
      { label: "공지사항", href: "/jobs/notices" },
      { label: "채용 절차", href: "/process" },
      { label: "지원 현황 조회", href: "/apply/result" },
      { label: "자주 묻는 질문", href: "/faq" },
    ],
  },
  {
    title: "아르코에듀",
    links: [
      { label: "아르코 피플", href: "/people" },
      { label: "직무소개", href: "/people/jobs" },
      { label: "아르코 컬처", href: "/people/culture" },
      { label: "회사소개", href: "/company" },
      { label: "오시는 길", href: "/company/location" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mesh-ink grain mt-auto text-paper">
      <span className="grain-overlay" />
      <Container className="relative py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="text-2xl font-extrabold tracking-tight">
              아르코<span className="text-accent">채용</span>
            </Link>
            <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-muted-ink">
              {SITE.hero.lines.join(" ")}
            </p>
            <p className="serif-italic mt-6 text-2xl text-paper/90">
              Grow Faster, Work Smarter.
            </p>
          </div>

          {NAV_GROUPS.map((g) => (
            <div key={g.title}>
              <h4 className="kicker text-muted-ink">{g.title}</h4>
              <ul className="mt-5 flex flex-col gap-3">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[0.95rem] text-paper/80 transition-colors hover:text-accent"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="kicker text-muted-ink">Family Sites</h4>
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
              {SITE.familyMenu.map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="group inline-flex items-center gap-1 text-sm text-paper/70 transition-colors hover:text-paper"
                  >
                    {label}
                    <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-muted-ink sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ARCO Edu (가상의 기업). All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-paper">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-paper">
              이메일주소무단수집거부
            </a>
            <a href="#" className="hover:text-paper">
              회원탈퇴
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
