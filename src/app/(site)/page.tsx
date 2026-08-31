import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  FileText,
  Search,
  HelpCircle,
  MessageCircle,
  Bell,
} from "lucide-react";
import { SITE } from "@/lib/data/site";
import {
  JOB_POSTINGS_NEW,
  JOB_POSTINGS_CAREER,
  JOB_POSTINGS_INTERN,
} from "@/lib/data/jobs";
import { NOTICES } from "@/lib/data/notices";
import { Container, Kicker, SectionHead } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { Hero } from "@/components/home/hero";
import { OngoingJobs } from "@/components/home/ongoing-jobs";
import { BrandScene } from "@/components/visuals/brand-scene";

export const metadata: Metadata = {
  title: "아르코채용 | 바른 교육의 실현, 밝은 나눔의 실천",
  description:
    "아르코에듀는 내일을 만들어갑니다. 일반직·영어연구원·전문강사 채용 정보와 입사지원 안내를 확인하세요.",
};

const QUICK_BLOCKS = [
  {
    label: "입사지원서 작성",
    href: "/apply",
    desc: "일반직·영어연구원·전문강사 입사지원서를 작성합니다.",
    Icon: FileText,
  },
  {
    label: "지원결과 조회",
    href: "/apply/result",
    desc: "제출한 지원서의 전형 결과를 조회합니다.",
    Icon: Search,
  },
  {
    label: "FAQ",
    href: "/faq",
    desc: "채용 절차와 지원에 관한 자주 묻는 질문을 확인합니다.",
    Icon: HelpCircle,
  },
  {
    label: "Q&A",
    href: "/qna",
    desc: "궁금한 점을 인사팀에 직접 문의합니다.",
    Icon: MessageCircle,
  },
];

const STATS = [
  {
    value: 13,
    suffix: "건",
    label: "진행중인 일반직 채용",
    desc: "개발·기획·연구·학사 등 전 사업분야에서 상시 모집 중입니다.",
  },
  {
    value: 22,
    suffix: "개",
    label: "전문 강사 모집 분야",
    desc: "어학·자격증·공무원 등 분야별 전문 강사를 모십니다.",
  },
  {
    value: 17,
    suffix: "개",
    label: "교육 사업 브랜드",
    desc: "공무원부터 어학·유학까지, 폭넓은 교육 브랜드를 운영합니다.",
  },
  {
    value: 13,
    suffix: "년",
    label: "교육 서비스 운영",
    desc: "2013년 설립 이후 학습자와 함께 성장해 온 에듀테크 기업입니다.",
  },
];

export default function HomePage() {
  const ongoingBuckets = [
    { key: "new", label: "신입", jobs: JOB_POSTINGS_NEW },
    { key: "career", label: "경력", jobs: JOB_POSTINGS_CAREER },
    { key: "intern", label: "인턴", jobs: JOB_POSTINGS_INTERN },
    { key: "teacher", label: "전문 강사", href: "/jobs/teacher" },
  ];

  const latestNotices = NOTICES.slice(0, 3);

  return (
    <>
      <Hero />

      {/* ── 진행중인 채용 ──────────────────────────────────── */}
      <section className="bg-paper py-24 sm:py-32">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHead
              kicker="Open Positions"
              title={
                <>
                  지금 진행중인
                  <br />
                  채용을 만나보세요
                </>
              }
            />
            <Button
              href="/jobs/general"
              variant="outline"
              arrow
              className="self-start sm:self-auto"
            >
              전체 채용공고
            </Button>
          </div>

          <div className="mt-14">
            <OngoingJobs buckets={ongoingBuckets} />
          </div>
        </Container>
      </section>

      {/* ── 빠른 진입 (입사지원/조회/FAQ/Q&A) ────────────────── */}
      <section className="border-y border-line bg-paper-dim py-24 sm:py-32">
        <Container>
          <SectionHead
            kicker="Quick Access"
            title={
              <>
                지원에 필요한
                <br />
                모든 메뉴를 한 곳에
              </>
            }
          />
          <RevealGroup
            className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.06}
          >
            {QUICK_BLOCKS.map(({ label, href, desc, Icon }) => (
              <RevealItem key={label}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-card border border-line bg-pure p-7 transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-ink transition-colors duration-300 group-hover:bg-accent group-hover:text-ink">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-bold tracking-tight">
                    {label}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {desc}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink">
                    바로가기
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 통계 / 브랜드 신뢰 ──────────────────────────────── */}
      <section className="bg-sky-veil bg-grid py-20 sm:py-24">
        <Container>
          <Reveal>
            <Kicker>By the Numbers</Kicker>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              숫자로 보는 아르코에듀. 지금 이 순간에도 다양한 분야에서
              함께할 사람을 찾고 있습니다.
            </p>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <RevealItem key={s.label} className="flex flex-col bg-pure p-7 sm:p-8">
                <p className="text-5xl font-extrabold tracking-tight text-ink sm:text-6xl">
                  <CountUp
                    to={s.value}
                    suffix={s.suffix}
                    className="tabular-nums"
                  />
                </p>
                <p className="mt-4 text-base font-bold tracking-tight text-ink">
                  {s.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.desc}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── 센터 배너 ─────────────────────────────────────── */}
      <section className="bg-paper pb-24 sm:pb-32">
        <Container>
          <Reveal>
            <Link
              href="/jobs"
              className="group mesh-ink grain relative flex flex-col items-start justify-between gap-8 overflow-hidden rounded-lg p-10 text-paper transition-transform duration-500 hover:-translate-y-1 sm:flex-row sm:items-center sm:p-14"
            >
              <span className="grain-overlay" />
              <div className="relative">
                <Kicker dark>ARCO Careers Guide</Kicker>
                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                  {SITE.centerBanner.title}
                </h2>
              </div>
              <span className="relative inline-flex items-center gap-2 text-lg font-semibold text-accent">
                {SITE.centerBanner.cta}
                <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* ── 공지사항 ──────────────────────────────────────── */}
      <section className="border-y border-line bg-paper-dim py-24 sm:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <SectionHead
                kicker="Notice"
                title={
                  <>
                    채용 관련
                    <br />
                    주요 소식
                  </>
                }
                lead="아르코에듀 채용과 관련된 주요 사항을 알려드립니다."
              />
              <Button href="/jobs/notices" variant="outline" arrow className="mt-8">
                공지사항 전체보기
              </Button>
            </div>

            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-pure">
              {latestNotices.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.body ? `/jobs/notices/${n.id}` : "/jobs/notices"}
                    className="group flex items-center gap-4 px-6 py-6 transition-colors hover:bg-paper sm:px-8"
                  >
                    <span
                      className={
                        n.no === "알림"
                          ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink"
                          : "w-9 shrink-0 text-center font-mono text-sm text-muted-ink"
                      }
                    >
                      {n.no === "알림" ? <Bell className="size-4" /> : n.no}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          "truncate font-medium tracking-tight " +
                          (n.highlight ? "text-accent-ink" : "text-ink")
                        }
                      >
                        {n.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">{n.date}</p>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-ink transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* ── 인재상 / 문화 티저 ──────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-32">
        <span className="grain-overlay" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <Link
                href="/people"
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-10 transition-colors duration-500 hover:bg-white/[0.06] sm:p-12"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-[55%] opacity-60 transition-opacity duration-500 group-hover:opacity-90 [mask-image:linear-gradient(to_right,transparent,black_70%)]"
                >
                  <BrandScene variant="people" tone="dark" />
                </span>
                <div className="relative">
                  <Kicker dark>ARCO People</Kicker>
                  <h3 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                    아르코에듀가 함께하고
                    <br />
                    싶은 인재
                  </h3>
                  <p className="mt-5 max-w-md leading-relaxed text-muted-ink">
                    바른 교육을 실현하고 밝은 나눔을 실천하는 사람들. 아르코에듀의
                    인재상을 만나보세요.
                  </p>
                </div>
                <span className="relative mt-10 inline-flex items-center gap-2 font-semibold text-accent">
                  인재상 보기
                  <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </Link>
            </Reveal>
            <Reveal delay={0.08}>
              <Link
                href="/people/culture"
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-10 transition-colors duration-500 hover:bg-white/[0.06] sm:p-12"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-[55%] opacity-60 transition-opacity duration-500 group-hover:opacity-90 [mask-image:linear-gradient(to_right,transparent,black_70%)]"
                >
                  <BrandScene variant="share" tone="dark" />
                </span>
                <div className="relative">
                  <Kicker dark>Culture</Kicker>
                  <h3 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                    아르코에듀에서
                    <br />
                    일한다는 것
                  </h3>
                  <p className="mt-5 max-w-md leading-relaxed text-muted-ink">
                    작게 실험하고 빠르게 배우는 문화. 아르코에듀의 일하는 방식을
                    들여다보세요.
                  </p>
                </div>
                <span className="relative mt-10 inline-flex items-center gap-2 font-semibold text-accent">
                  아르코 컬처 보기
                  <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </Link>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── 최종 CTA ──────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-32 text-paper sm:py-44">
        <span className="grain-overlay" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(circle_at_50%_40%,black,transparent_72%)]"
        >
          <BrandScene variant="growth" tone="dark" />
        </span>
        <Container className="relative text-center">
          <Reveal>
            <p className="serif-italic text-2xl text-accent">
              Bright Education, Brighter Sharing
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-display mx-auto mt-7 max-w-3xl text-balance">
              내일을 만들어가는 길,
              <br />
              아르코에듀에서 시작하세요
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-ink">
              당신의 한 걸음이 누군가의 더 나은 내일이 됩니다. 교육의 가치를
              함께 키워갈 동료를 기다립니다.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/jobs/general" variant="accent" size="lg" arrow>
                일반직 채용공고 보기
              </Button>
              <Button
                href="/apply"
                size="lg"
                className="border border-white/25 bg-white/5 text-paper backdrop-blur-sm hover:bg-white/10"
              >
                입사지원 바로가기
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
