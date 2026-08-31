import type { Metadata } from "next";
import { CalendarClock, HelpCircle } from "lucide-react";
import {
  GENERAL_PROCESSES,
  GENERAL_PROCESS_NOTES,
} from "@/lib/data/jobs";
import { ENG_RESEARCH, TEACHER_RECRUIT } from "@/lib/data/channels";
import { Container, Kicker, SectionHead } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { ProcessTabs } from "@/components/process/process-tabs";

export const metadata: Metadata = {
  title: "채용절차 | 아르코채용",
  description:
    "아르코에듀의 채용절차를 채널별로 안내합니다. 일반직 · 영어연구원 · 전문강사 채용은 각각 절차가 다릅니다.",
};

/** 일반직 단계 설명(원문 name + desc)을 한 줄 문장으로 결합 */
const GENERAL_NOTES = GENERAL_PROCESS_NOTES.map(
  (n) => `${n.name} — ${n.desc}`,
);

const TABS = [
  {
    key: "general",
    label: "일반직",
    badge: "일반직 채용",
    icon: "layers" as const,
    lead: "아르코에듀 전 사업분야의 일반직 채용입니다. 직무에 따라 필기 전형이 포함되는 절차와 인적성만 진행되는 절차 두 가지로 운영됩니다.",
    general: GENERAL_PROCESSES,
    notes: GENERAL_NOTES,
  },
  {
    key: "english-research",
    label: "영어연구원",
    badge: "영어연구원모집",
    icon: "cap" as const,
    lead: "영어 교재 및 콘텐츠를 개발하는 전문 연구원 채용입니다. 일반직과 달리 필기/인적성 검사가 단일 단계로 통합되어 진행됩니다.",
    single: ENG_RESEARCH.process,
    notes: [
      ENG_RESEARCH.documentsNote,
      ...ENG_RESEARCH.documents.map((d) => `제출서류 — ${d}`),
    ],
  },
  {
    key: "teacher",
    label: "전문강사",
    badge: "전문강사모집",
    icon: "mic" as const,
    lead: "아르코에듀 전문강사 채용입니다. 시강/필기 전형이 포함된 4단계로 진행되며, 신체검사 없이 면접 후 최종합격으로 마무리됩니다.",
    single: TEACHER_RECRUIT.process,
    notes: TEACHER_RECRUIT.processNotes,
  },
];

export default function ProcessPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden pb-24 pt-32 text-paper sm:pb-32 sm:pt-40">
        <span className="grain-overlay" />
        <Container className="relative">
          <Reveal>
            <Kicker dark>Recruiting Process</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-hero mt-7 max-w-4xl">
              채널마다
              <br />
              <span className="font-semibold text-accent">
                절차가 다릅니다
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-ink">
              아르코에듀의 채용은 직무 채널에 따라 전형 절차가 다르게
              운영됩니다. 일반직 · 영어연구원 · 전문강사 채용의 단계를 채널별로
              확인하세요.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-paper backdrop-blur">
              <CalendarClock className="size-4 text-accent" />
              모든 채널 공통{" "}
              <span className="font-semibold text-paper">
                서류전형으로 시작해 최종합격으로 마무리
              </span>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 채널별 절차 탭 ───────────────────────────────────── */}
      <section className="bg-paper py-24 sm:py-32">
        <Container>
          <SectionHead
            kicker="By Channel"
            title={
              <>
                채용 채널을 선택하면
                <br />
                해당 절차가 나타납니다
              </>
            }
            lead="동일한 아르코 채용이라도 직무 채널에 따라 단계 구성과 검사 방식이 다릅니다. 지원하려는 채널의 절차를 미리 살펴보세요."
          />
          <div className="mt-16 sm:mt-20">
            <ProcessTabs tabs={TABS} />
          </div>
        </Container>
      </section>

      {/* ── 공통 안내 ──────────────────────────────────────── */}
      <section className="border-y border-line bg-paper-dim py-24 sm:py-32">
        <Container size="narrow">
          <SectionHead
            kicker="Notice"
            title="채용 공통 안내"
            align="center"
          />
          <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
            {[
              {
                t: "온라인 지원 원칙",
                d: "모든 채널은 아르코 채용사이트 온라인 지원을 원칙으로 하며, 이메일·방문 접수는 받지 않습니다.",
              },
              {
                t: "개별 결과 발표",
                d: "전형별 결과는 합격자에 한하여 개별 안내되며, 마이페이지와 SMS·이메일로 단계가 전달됩니다.",
              },
              {
                t: "증빙서류 후제출",
                d: "졸업·성적·어학 증명서 등은 최종합격자에 한하여 추후 제출합니다.",
              },
              {
                t: "공통 자격요건",
                d: "병역필 또는 면제자, 해외여행에 결격사유가 없는 자를 공통 자격요건으로 합니다.",
              },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-card border border-line bg-pure p-6"
              >
                <h3 className="text-base font-bold tracking-tight text-ink">
                  {c.t}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  {c.d}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="bg-paper py-28 sm:py-36">
        <Container className="text-center">
          <Reveal>
            <p className="serif-italic flex items-center justify-center gap-2 text-2xl text-accent-ink">
              <HelpCircle className="size-5" />
              Ready?
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-display mx-auto mt-6 max-w-3xl">
              절차를 확인했다면,
              <br />
              지원을 시작하세요
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/jobs" variant="accent" size="lg" arrow>
                진행중인 채용 보기
              </Button>
              <Button href="/faq" variant="outline" size="lg">
                자주 묻는 질문
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
