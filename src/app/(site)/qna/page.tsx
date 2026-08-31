import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { QNA } from "@/lib/data/faq";
import { Container, Kicker } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { QnaForm } from "@/components/qna/qna-form";

export const metadata: Metadata = {
  title: "Q&A | 아르코채용",
  description: QNA.titleBar.desc,
};

export default function QnaPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="bg-paper pb-16 pt-32 sm:pb-20 sm:pt-40">
        <Container size="narrow">
          <Reveal>
            <Kicker>Contact</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-hero mt-7">
              {QNA.titleBar.title}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              {QNA.titleBar.desc}
            </p>
          </Reveal>

          {/* 안내문 (원문) + FAQ 링크 */}
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-col gap-5 rounded-card border border-line bg-paper-dim p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <ul className="flex flex-col gap-2">
                {QNA.notices.map((n, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-muted"
                  >
                    {n}
                  </li>
                ))}
              </ul>
              <Link
                href="/faq"
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-line bg-pure px-4 py-2.5 text-sm font-medium tracking-tight text-accent-ink transition-colors hover:bg-pure/60 sm:self-auto"
              >
                {QNA.faqButtonLabel}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 문의 폼 ────────────────────────────────────────── */}
      <section className="bg-paper pb-28 sm:pb-36">
        <Container size="narrow">
          <QnaForm qna={QNA} />
        </Container>
      </section>
    </>
  );
}
