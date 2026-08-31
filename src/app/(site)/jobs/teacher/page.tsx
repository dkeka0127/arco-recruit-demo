import type { Metadata } from "next";
import { CheckCircle2, FileText, Info } from "lucide-react";
import { recruit } from "@/lib/provider";
import { Container, Kicker, SectionHead } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { BrandScene } from "@/components/visuals/brand-scene";
import { TeacherFields } from "@/components/channels/teacher-fields";
import { StickyApply } from "@/components/channels/sticky-apply";

export const metadata: Metadata = {
  title: "전문강사모집 | 아르코채용",
  description:
    "존경받는 이름, 아르코에듀 전문강사를 모집합니다. 22개 모집분야와 지원자격·전형절차·제출서류 안내.",
};

const APPLY_HREF = "/apply/teacher";

export default async function TeacherPage() {
  const data = await recruit.getTeacherRecruit();
  const APPLY_LABEL = data.applyButton.replace(/\s*[›▶]\s*$/, "");

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden pt-32 pb-24 text-paper sm:pt-40 sm:pb-32">
        <span className="grain-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] opacity-90 [mask-image:linear-gradient(to_right,transparent,black_40%)] lg:block"
        >
          <BrandScene variant="people" tone="dark" />
        </div>
        <Container className="relative">
          <Reveal>
            <Kicker dark>ARCO Edu · Instructors</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-hero mt-7 max-w-[16ch]">
              {data.bannerTitle.map((line, i) => (
                <span key={i} className="block">
                  {i === data.bannerTitle.length - 1 ? (
                    <span className="font-semibold text-accent">{line}</span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="mt-9 max-w-2xl space-y-1.5 text-lg leading-relaxed text-paper/75 sm:text-xl">
              {data.bannerLead.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href={APPLY_HREF} variant="accent" size="lg" arrow>
                {APPLY_LABEL}
              </Button>
              <span className="text-sm text-muted-ink">{data.applyNote}</span>
            </div>
          </Reveal>
          {/* 핵심 지표 — 빈 영역 보강 */}
          <Reveal delay={0.24}>
            <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-card border border-white/10 bg-white/10">
              {[
                { v: "22", l: "모집 분야" },
                { v: "4", l: "전형 단계" },
                { v: "BA+", l: "지원 학력" },
              ].map((s) => (
                <div key={s.l} className="bg-ink/40 px-5 py-5 backdrop-blur-sm">
                  <dt className="text-3xl font-extrabold tracking-tight text-accent">
                    {s.v}
                  </dt>
                  <dd className="mt-1 text-sm text-muted-ink">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </section>

      {/* ── 대표 섹션: 모집분야 (22개 프리미엄 리스트) ─────────── */}
      <section className="bg-sky-veil py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHead
              kicker="Recruiting Fields"
              title={
                <>
                  22개 분야,
                  <br />
                  <span className="font-semibold text-accent-ink">
                    당신의 전문성
                  </span>
                  을 펼치세요
                </>
              }
              lead="어학부터 전문자격, 공무원·임용까지 — 카테고리와 검색으로 모집 과목을 확인하세요."
            />
          </Reveal>
          <div className="mt-12">
            <TeacherFields fields={data.fields} note={data.fieldsNote} />
          </div>
        </Container>
      </section>

      {/* ── 지원자격 ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-paper py-20 sm:py-28">
        <div aria-hidden className="bg-grid absolute inset-0 opacity-60" />
        <Container className="relative">
          <Reveal>
            <SectionHead
              kicker="Qualifications"
              title="지원자격"
              lead="국내·해외 학위 소지자 모두 지원할 수 있습니다."
            />
          </Reveal>
          <RevealGroup className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
            {data.qualifications.map((q, i) => (
              <RevealItem key={i} className="flex flex-col gap-5 bg-pure p-7">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-accent-ink" />
                  <span className="font-mono text-xs tracking-[0.18em] text-muted-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="text-lg font-semibold leading-snug text-ink">
                  {q}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 전형절차 (4단계 + 설명) ──────────────────────────── */}
      <section className="bg-paper-dim py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHead
              kicker="Process"
              title="전형절차"
              lead="서류전형부터 최종합격까지, 4단계로 진행됩니다."
            />
          </Reveal>

          <RevealGroup className="relative mt-14">
            <div
              aria-hidden
              className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-line-strong lg:block"
            />
            <div className="grid gap-5 lg:grid-cols-4">
              {data.process.map((step) => (
                <RevealItem key={step.no} className="relative">
                  <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                    <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-ink font-mono text-sm font-semibold text-paper">
                      {step.no}
                    </span>
                    <p className="text-lg font-bold tracking-tight text-ink lg:mt-5">
                      {step.name}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>

          {/* 단계별 설명 (processNotes) */}
          <RevealGroup className="mt-12 grid gap-3 lg:grid-cols-2">
            {data.processNotes.map((note, i) => {
              const isSub = note.trimStart().startsWith("※");
              return (
                <RevealItem
                  key={i}
                  className={
                    isSub
                      ? "flex items-start gap-3 rounded-card bg-accent-soft px-5 py-4"
                      : "flex items-start gap-3 rounded-card border border-line bg-pure px-5 py-4"
                  }
                >
                  <span
                    className={
                      isSub
                        ? "mt-2 size-1.5 shrink-0 rounded-full bg-accent-deep"
                        : "mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                    }
                  />
                  <p
                    className={
                      isSub
                        ? "text-sm leading-relaxed text-accent-ink"
                        : "text-sm leading-relaxed text-muted"
                    }
                  >
                    {note}
                  </p>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 제출서류 ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-20 text-paper sm:py-28">
        <div aria-hidden className="bg-grid-dark absolute inset-0" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <Reveal>
              <div className="flex flex-col gap-5">
                <Kicker dark>Documents</Kicker>
                <h2 className="text-display text-paper">제출서류</h2>
                <p className="max-w-md leading-relaxed text-muted-ink">
                  {data.documentsNote}
                </p>
              </div>
            </Reveal>
            <RevealGroup className="space-y-3">
              {data.documents.map((doc, i) => (
                <RevealItem
                  key={i}
                  className="flex items-start gap-4 rounded-card border border-white/10 bg-white/[0.04] p-5"
                >
                  <FileText className="mt-0.5 size-5 shrink-0 text-accent" />
                  <p className="leading-relaxed text-paper/90">{doc}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </section>

      {/* ── 유의사항 (기타사항) ──────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHead kicker="Notice" title="유의사항" />
          </Reveal>
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2">
            {data.etc.map((item, i) => (
              <RevealItem
                key={i}
                className="flex items-start gap-3 rounded-card border border-line bg-paper-dim/60 p-5"
              >
                <Info className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                <p className="text-sm leading-relaxed text-muted">{item}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 하단 지원 CTA ────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-32">
        <span className="grain-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]"
        >
          <BrandScene variant="people" tone="dark" />
        </div>
        <Container className="relative text-center">
          <Reveal>
            <Kicker dark className="justify-center">
              Become an instructor
            </Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-display mx-auto mt-6 max-w-3xl text-paper">
              존경받는 이름,
              <br />
              아르코에듀 전문강사가 되세요
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={APPLY_HREF} variant="accent" size="lg" arrow>
                {APPLY_LABEL}
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-sm text-muted-ink">{data.applyNote}</p>
          </Reveal>
        </Container>
      </section>

      <StickyApply
        eyebrow="Instructor"
        note={data.applyNote}
        label={APPLY_LABEL}
        href={APPLY_HREF}
      />
    </>
  );
}
