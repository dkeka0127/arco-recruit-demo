import type { Metadata } from "next";
import { Sprout, Globe2, Recycle } from "lucide-react";
import { SCHOLARSHIP } from "@/lib/data/company";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import {
  CompanyNav,
  CompanyHeader,
  CompanyPager,
} from "@/components/company/company-nav";
import { BrandScene } from "@/components/visuals/brand-scene";

export const metadata: Metadata = {
  title: "아르코에듀 장학제도 | 아르코채용",
  description: SCHOLARSHIP.titleBar.desc,
};

/** col1을 기준으로 row를 묶어 첫 행에만 라벨을 rowSpan 처럼 표시 */
function groupByCol1<T extends { col1: string }>(rows: T[]) {
  const groups: { col1: string; rows: T[] }[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last.col1 === r.col1) last.rows.push(r);
    else groups.push({ col1: r.col1, rows: [r] });
  }
  return groups;
}

const CORE_VALUES = [
  {
    icon: Sprout,
    en: "Growth",
    title: "성장 지원",
    body: "학업성적이나 경제적 필요가 아니라, 사회에 기여하려는 꿈을 가진 인재의 성장을 지원합니다.",
  },
  {
    icon: Globe2,
    en: "Opportunity",
    title: "교육 기회 확대",
    body: "한국과 유학 현지를 잇는 다리(Bridge)가 되어, 더 넓은 무대에서 배움을 이어갈 기회를 엽니다.",
  },
  {
    icon: Recycle,
    en: "Give Back",
    title: "사회 환원",
    body: "사회로부터 받은 혜택과 호의를 다시 나누는 선순환의 공동체를 만들어 갑니다.",
  },
];

export default function CompanyScholarshipPage() {
  const {
    titleBar,
    purpose,
    scholarship,
    announcement,
    contest,
    contestSchedule,
    judges,
  } = SCHOLARSHIP;

  const schGroups = groupByCol1(scholarship.rows);
  const contestGroups = groupByCol1(contest.rows);

  return (
    <>
      <div className="pt-32 sm:pt-40">
        <CompanyNav active="/company/scholarship" />
      </div>

      {/* ── Header + purpose ──────────────────────────────── */}
      <section className="bg-sky-veil py-16 sm:py-24">
        <Container>
          <Reveal>
            <CompanyHeader
              kicker="Scholarship"
              index="06"
              title={
                <>
                  아르코에듀{" "}
                  <span className="font-semibold text-accent-ink">
                    장학제도
                  </span>
                </>
              }
              desc={titleBar.desc}
            />
          </Reveal>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-stretch lg:gap-10">
            <Reveal>
              <div className="surface-card flex h-full flex-col justify-center rounded-card p-8 sm:p-10">
                <h2 className="text-xl font-semibold tracking-tight text-ink">
                  {purpose.title}
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-muted">
                  {purpose.body}
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="relative h-64 overflow-hidden rounded-card border border-line lg:h-full">
                <BrandScene
                  variant="global"
                  tone="dark"
                  className="absolute inset-0"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-7">
                  <p className="serif-italic text-base text-accent">Bridge</p>
                  <p className="mt-1 text-lg font-semibold leading-snug text-paper">
                    한국과 유학 현지를
                    <br />
                    잇는 다리가 됩니다
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── 핵심 가치 3 ───────────────────────────────────── */}
      <section className="bg-paper py-16 sm:py-20">
        <Container>
          <RevealGroup className="grid gap-5 md:grid-cols-3" stagger={0.08}>
            {CORE_VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <RevealItem key={v.title}>
                  <div className="surface-card flex h-full flex-col rounded-card p-8">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs tracking-[0.2em] text-muted-ink">
                        0{i + 1}
                      </span>
                      <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                        <Icon className="size-5" />
                      </span>
                    </div>
                    <p className="serif-italic mt-8 text-base text-accent-ink">
                      {v.en}
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold tracking-tight text-ink">
                      {v.title}
                    </h3>
                    <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
                      {v.body}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 장학 철학 큰 문장 (다크 밴드) ─────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-28">
        <span className="grain-overlay" />
        <div className="bg-grid-dark absolute inset-0 opacity-60" />
        <Container size="narrow" className="relative text-center">
          <Reveal>
            <p className="serif-italic text-xl text-accent">
              ARCO Bridge Scholarship
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mx-auto mt-6 max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-paper sm:text-[2rem] sm:leading-[1.35]">
              성적이나 형편이 아니라,{" "}
              <span className="text-accent">
                받은 혜택을 다시 나누려는 꿈
              </span>
              을 봅니다.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-ink">
              아르코에듀 공동체 형성에 기여하고, 사회로부터 받은 호의를 세계 무대에서
              다시 나누려는 인재를 응원합니다.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── Scholarship 상세 ──────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="flex flex-col gap-4">
                <span className="kicker text-accent-ink">
                  <span className="mr-2 inline-block h-px w-6 bg-accent align-middle" />
                  ARCO Bridge Scholarship
                </span>
                <h2 className="text-display">{scholarship.title}</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-muted">
                  {scholarship.note}
                </p>
              </div>
              {/* 금액 강조 카드 (블루) */}
              <div className="rounded-card border border-accent/30 bg-accent-soft px-8 py-6 text-center">
                <p className="font-mono text-[0.7rem] tracking-[0.25em] text-accent-ink">
                  AMOUNT
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-accent-ink">
                  {scholarship.amount}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-10 overflow-hidden rounded-card border border-line bg-pure">
              {schGroups.map((g) => (
                <div
                  key={g.col1}
                  className="grid border-b border-line last:border-b-0 sm:grid-cols-[160px_1fr]"
                >
                  <div className="bg-paper-dim/60 px-6 py-5 text-sm font-semibold text-ink">
                    {g.col1}
                  </div>
                  <div className="divide-y divide-line">
                    {g.rows.map((r, i) => (
                      <div
                        key={i}
                        className="grid gap-2 px-6 py-5 sm:grid-cols-[200px_1fr] sm:gap-6"
                      >
                        <span className="text-sm font-medium text-accent-ink">
                          {r.col2}
                        </span>
                        <span className="text-[0.95rem] leading-relaxed text-muted">
                          {r.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Announcement ──────────────────────────────────── */}
      <section className="bg-paper-dim py-20 sm:py-24">
        <Container>
          <Reveal>
            <span className="kicker text-accent-ink">
              <span className="mr-2 inline-block h-px w-6 bg-accent align-middle" />
              Announcement
            </span>
            <h2 className="text-display mt-5">{announcement.title}</h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">
              {announcement.body}
            </p>
          </Reveal>
          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2" stagger={0.06}>
            {announcement.rows.map((r) => (
              <RevealItem key={r.label}>
                <div className="surface-card flex flex-col gap-2 rounded-card p-7">
                  <span className="text-sm font-semibold text-accent-ink">
                    {r.label}
                  </span>
                  <span className="text-base leading-relaxed text-ink/85">
                    {r.content}
                  </span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── Essay & Speech Contest ────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-20 text-paper sm:py-28">
        <span className="grain-overlay" />
        <Container className="relative">
          <Reveal>
            <span className="kicker text-accent">
              <span className="mr-2 inline-block h-px w-6 bg-accent/70 align-middle" />
              Contest
            </span>
            <h2 className="text-display mt-5 text-paper">{contest.title}</h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-ink">
              {contest.intro}
            </p>
          </Reveal>

          {/* contest 표 */}
          <Reveal delay={0.08}>
            <div className="mt-10 overflow-hidden rounded-card border border-paper/12 bg-paper/[0.04]">
              {/* head */}
              <div className="hidden grid-cols-[1fr_1.2fr] gap-px bg-paper/10 text-xs font-semibold uppercase tracking-wider text-muted-ink sm:grid sm:grid-cols-[180px_1.2fr_1fr_1fr]">
                <div className="bg-ink px-5 py-3">구분</div>
                <div className="bg-ink px-5 py-3"> </div>
                <div className="bg-ink px-5 py-3">Essay</div>
                <div className="bg-ink px-5 py-3">Speech</div>
              </div>
              {contestGroups.map((g) => (
                <div
                  key={g.col1}
                  className="border-t border-paper/10 first:border-t-0"
                >
                  {g.rows.map((r, i) => (
                    <div
                      key={i}
                      className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1.2fr_1fr_1fr] sm:gap-4 sm:px-0"
                    >
                      <div className="px-0 text-sm font-semibold text-accent sm:px-5">
                        {i === 0 ? g.col1 : ""}
                      </div>
                      <div className="text-sm font-medium text-paper sm:px-0">
                        {r.col2}
                      </div>
                      {(r.essay || r.speech) && (
                        <>
                          <div className="text-sm leading-relaxed text-muted-ink sm:px-0">
                            {r.essay && (
                              <>
                                <span className="font-mono text-[0.65rem] text-accent sm:hidden">
                                  ESSAY{" "}
                                </span>
                                {r.essay}
                              </>
                            )}
                          </div>
                          <div className="text-sm leading-relaxed text-muted-ink sm:px-0">
                            {r.speech && r.speech !== "(동일)" ? (
                              <>
                                <span className="font-mono text-[0.65rem] text-accent sm:hidden">
                                  SPEECH{" "}
                                </span>
                                {r.speech}
                              </>
                            ) : r.speech === "(동일)" ? (
                              <span className="text-muted-ink/70">(동일)</span>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-accent">{contest.note}</p>
          </Reveal>

          {/* 일정 */}
          <Reveal delay={0.1}>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    {contestSchedule.headers.map((h, i) => (
                      <th
                        key={i}
                        className="border-b border-paper/15 px-5 py-3 text-left font-semibold text-accent"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[contestSchedule.essay, contestSchedule.speech].map(
                    (row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={
                              ci === 0
                                ? "border-b border-paper/10 px-5 py-4 font-semibold text-paper"
                                : "border-b border-paper/10 px-5 py-4 leading-relaxed text-muted-ink"
                            }
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </Reveal>

          {/* 심사위원 */}
          <Reveal delay={0.12}>
            <div className="mt-14">
              <p className="mb-6 font-mono text-[0.7rem] tracking-[0.25em] text-accent">
                JUDGES
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {judges.map((j) => (
                  <div
                    key={j.name}
                    className="rounded-card border border-paper/12 bg-paper/[0.04] p-6"
                  >
                    <h3 className="text-lg font-semibold text-paper">{j.name}</h3>
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {j.credentials.map((c, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm leading-relaxed text-muted-ink"
                        >
                          <span className="mt-2 inline-block size-1 shrink-0 rounded-full bg-accent/60" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-24">
        <Container>
          <div className="surface-card relative overflow-hidden rounded-lg p-10 sm:p-14">
            <BrandScene
              variant="campus"
              tone="light"
              className="absolute inset-0 opacity-40"
            />
            <div className="relative">
              <Reveal>
                <p className="serif-italic text-lg text-accent-ink">
                  Be the Bridge
                </p>
                <h2 className="text-display mt-4 max-w-2xl">
                  나눔의 철학을
                  <br />
                  함께 만들어갈 사람을 찾습니다
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button href="/company/philosophy" variant="primary" size="lg" arrow>
                    아르코에듀 철학 보기
                  </Button>
                  <Button href="/company/sharing" variant="outline" size="lg">
                    나눔 활동 보기
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>

          <CompanyPager current="/company/scholarship" />
        </Container>
      </section>
    </>
  );
}
