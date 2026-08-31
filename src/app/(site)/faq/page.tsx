import type { Metadata } from "next";
import { FAQS, FAQ_TOPICS, FAQ_HEADER, QNA } from "@/lib/data/faq";
import { Container, Kicker } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { FaqList } from "@/components/faq/faq-list";

export const metadata: Metadata = {
  title: "FAQ | 아르코채용",
  description: FAQ_HEADER.desc,
};

export default function FaqPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="bg-paper pb-16 pt-32 sm:pb-20 sm:pt-40">
        <Container>
          <Reveal>
            <Kicker>Help Center</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-hero mt-7 max-w-4xl">
              {FAQ_HEADER.title},
              <br />
              <span className="font-semibold text-accent-ink">
                먼저
              </span>{" "}
              찾아보세요
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              {FAQ_HEADER.desc}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── 질문 목록 (필터/검색) ──────────────────────────── */}
      <section className="bg-paper pb-24 sm:pb-32">
        <Container size="narrow">
          <FaqList
            faqs={FAQS}
            topics={FAQ_TOPICS}
            faqButtonLabel={QNA.faqButtonLabel}
            featuredNos={[30, 25, 5, 9, 21]}
          />
        </Container>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="border-t border-line bg-paper-dim py-16 sm:py-20">
        <Container className="text-center">
          <Reveal>
            <p className="serif-italic text-xl text-accent-ink">
              Still curious?
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
              원하는 답을 못 찾으셨나요?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">
              자주 묻는 질문 외에 채용에 관한 궁금한 점은 Q&amp;A로 문의해
              주세요. 인사담당자가 빠르게 답변드리겠습니다.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/qna" variant="accent" size="lg" arrow>
                Q&amp;A로 문의하기
              </Button>
              <Button href="/jobs" variant="outline" size="lg">
                채용공고 보기
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
