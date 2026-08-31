"use client";

// ════════════════════════════════════════════════════════════════
//  HR 콘솔 앱 셸 — "컨트롤 룸" 컨셉.
//  다크 네이비 관제 사이드바 + 쿨 페이퍼 작업면.
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Megaphone,
  Users,
  CalendarClock,
  FileCheck,
  FolderHeart,
  BarChart3,
  Settings2,
  Search,
  Bell,
  ExternalLink,
  RotateCcw,
  Menu,
  X,
  LogOut,
  Database,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useHrState,
  hrActions,
  isRemoteMode,
  CURRENT_MEMBER_ID,
  unreadNoticeCount,
} from "@/lib/hr/store";
import { getSupabase, supabaseEnabled } from "@/lib/hr/supabase";
import { fmtDateTime } from "@/components/hr/ui";
import { FeedbackHost, toast } from "@/components/hr/feedback";

const NAV = [
  { href: "/hr", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/hr/my-work", label: "내 업무", icon: ClipboardList },
  { href: "/hr/jobs", label: "공고 관리", icon: Megaphone },
  { href: "/hr/applicants", label: "지원자", icon: Users },
  { href: "/hr/interviews", label: "면접 일정", icon: CalendarClock },
  { href: "/hr/exams", label: "필기시험", icon: FileCheck },
  { href: "/hr/talent", label: "인재풀", icon: FolderHeart },
  { href: "/hr/analytics", label: "리포트", icon: BarChart3 },
  { href: "/hr/settings", label: "설정", icon: Settings2 },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const s = useHrState();
  const activeApps = s.applications.filter(
    (a) => s.stages.find((st) => st.id === a.stageId)?.kind === "active",
  ).length;

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.9rem] font-medium tracking-tight transition-colors duration-200",
              active
                ? "bg-white/10 text-white"
                : "text-white/55 hover:bg-white/5 hover:text-white/90",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent transition-opacity duration-200",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <item.icon
              className={cn(
                "size-[18px] transition-colors",
                active ? "text-accent" : "text-white/40 group-hover:text-white/70",
              )}
            />
            {item.label}
            {item.href === "/hr/applicants" && (
              <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[0.68rem] text-accent">
                {activeApps}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function GlobalSearch() {
  const s = useHrState();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const query = q.trim();
    if (!query) return [];
    return s.applications
      .map((a) => ({
        app: a,
        candidate: s.candidates.find((c) => c.id === a.candidateId),
        job: s.jobs.find((j) => j.id === a.jobId),
      }))
      .filter(
        ({ candidate, job }) =>
          candidate?.name.includes(query) ||
          candidate?.tags.some((t) =>
            t.toLowerCase().includes(query.toLowerCase()),
          ) ||
          job?.title.includes(query),
      )
      .slice(0, 6);
  }, [q, s]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={boxRef} className="relative hidden w-full max-w-sm md:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="지원자·공고·태그 검색"
        className="h-10 w-full rounded-full border border-line bg-pure pl-10 pr-4 text-sm tracking-tight text-ink placeholder:text-muted-ink focus:border-accent focus:outline-none"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-card border border-line bg-pure shadow-pop">
          {results.map(({ app, candidate, job }) => (
            <button
              key={app.id}
              onClick={() => {
                setOpen(false);
                setQ("");
                router.push(`/hr/applicants/${app.id}`);
              }}
              className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-accent-soft/50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-ink">
                {candidate?.name.slice(0, 1)}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">
                  {candidate?.name}
                </span>
                <span className="block truncate text-xs text-muted">
                  {job?.title}
                </span>
              </span>
              <span className="ml-auto font-mono text-[0.68rem] text-accent-ink">
                {app.ai.matchScore}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const s = useHrState();
  const me = s.members.find((m) => m.id === CURRENT_MEMBER_ID);

  return (
    <div className="mesh-ink grain relative flex h-full flex-col text-white">
      <div className="grain-overlay" />
      <div className="relative flex h-full flex-col px-4 py-6">
        {/* brand */}
        <Link href="/hr" onClick={onNavigate} className="px-2">
          <span className="kicker block text-accent">ARCO Talent OS</span>
          <span className="mt-1.5 block text-xl font-extrabold tracking-tight">
            HR 콘솔
          </span>
        </Link>

        <div className="mt-8 flex-1">
          <NavList onNavigate={onNavigate} />
        </div>

        {/* footer */}
        <div className="relative flex flex-col gap-3 border-t border-white/10 pt-4">
          <span className="flex items-center gap-2 px-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/35">
            {isRemoteMode() ? (
              <>
                <Database className="size-3 text-accent" /> Supabase 연결됨
              </>
            ) : (
              <>
                <HardDrive className="size-3" /> 로컬 데모 모드
              </>
            )}
          </span>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.8rem] text-white/50 transition-colors hover:text-white/90"
          >
            <ExternalLink className="size-3.5" />
            지원자 사이트 보기
          </a>
          {supabaseEnabled && (
            <button
              onClick={() => void getSupabase()?.auth.signOut()}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[0.8rem] text-white/50 transition-colors hover:text-white/90"
            >
              <LogOut className="size-3.5" />
              로그아웃
            </button>
          )}
          {/* 데모 초기화 — 실데이터 리셋 사고 방지 위해 데모(localStorage) 모드에서만 노출 */}
          {!supabaseEnabled && (
            <button
              onClick={() => {
                if (confirm("데모 데이터를 초기 상태로 되돌릴까요?")) {
                  hrActions.resetDemo();
                }
              }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[0.8rem] text-white/50 transition-colors hover:text-white/90"
            >
              <RotateCcw className="size-3.5" />
              데모 초기화
            </button>
          )}
          <div className="mt-1 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent font-bold text-ink">
              {me?.name.slice(0, 1)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{me?.name}</p>
              <p className="text-[0.72rem] text-white/50">
                {me?.team} · {me?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 알림 벨 — 내 통지함 (배정·확정·취소·평가요청) ────────────────

const NOTICE_ICON: Record<string, string> = {
  일정조율: "🗓",
  면접확정: "✅",
  면접취소: "⛔",
  평가요청: "📝",
};

function NotificationBell() {
  const s = useHrState();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 내 통지만, 최신순 (상한은 store에서 300)
  const mine = s.notices
    .filter((n) => n.memberId === CURRENT_MEMBER_ID)
    .sort((a, b) => b.at.localeCompare(a.at));
  const unread = unreadNoticeCount(s, CURRENT_MEMBER_ID);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function goTo(applicationId?: string) {
    if (applicationId) {
      router.push(`/hr/applicants/${applicationId}`);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-9 items-center justify-center rounded-full border border-line bg-pure text-muted transition-colors hover:text-ink"
        aria-label={`알림 ${unread > 0 ? `(안읽음 ${unread})` : ""}`}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[0.6rem] font-bold text-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-card border border-line bg-pure shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[0.85rem] font-bold text-ink">
              알림{unread > 0 && <span className="ml-1.5 text-accent-ink">{unread}</span>}
            </span>
            {unread > 0 && (
              <button
                onClick={() => hrActions.markNoticesRead(CURRENT_MEMBER_ID)}
                className="text-[0.72rem] font-semibold text-muted transition-colors hover:text-accent-ink"
              >
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {mine.length === 0 ? (
              <p className="px-4 py-10 text-center text-[0.8rem] text-muted">
                받은 알림이 없습니다.
              </p>
            ) : (
              mine.slice(0, 30).map((n) => (
                <button
                  key={n.id}
                  onClick={() => goTo(n.applicationId)}
                  className={cn(
                    "flex w-full gap-2.5 border-b border-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-paper-dim",
                    !n.read && "bg-accent-soft/30",
                  )}
                >
                  <span className="text-base leading-none">
                    {NOTICE_ICON[n.kind] ?? "🔔"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {!n.read && (
                        <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                      )}
                      <span className="truncate text-[0.8rem] font-bold text-ink">
                        {n.title}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[0.72rem] leading-snug text-muted">
                      {n.body}
                    </span>
                    <span className="mt-1 block font-mono text-[0.62rem] text-muted-ink">
                      {fmtDateTime(n.at)}
                      {!n.mailedLive && " · 메일 목업"}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function HrShell({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  // 콘솔이 열려 있는 동안 30초마다: ① 예약 발송 처리 ② 좀비 시험 세션 정리
  // ③ 보관기한 만료 인재 자동 파기.
  // (데모 모드의 스케줄러 대체 — 운영 전환 시 서버 크론으로 이관)
  useEffect(() => {
    const tick = () => {
      const n = hrActions.flushScheduledMessages();
      if (n > 0)
        toast.show(`예약 메시지 ${n}건이 예정 시각에 맞춰 발송되었습니다.`);
      const swept = hrActions.sweepExamSessions();
      if (swept.autoSubmitted > 0)
        toast.show(
          `제한 시간이 지난 미제출 응시 ${swept.autoSubmitted}건을 자동 제출 처리했습니다.`,
        );
      const purged = hrActions.sweepTalentRetention();
      if (purged > 0)
        toast.show(
          `보관기한이 만료된 인재 ${purged}명의 개인정보를 자동 파기했습니다 (감사 로그 기록).`,
        );
    };
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  const pageTitle =
    [...NAV].sort((a, b) => b.href.length - a.href.length).find((n) =>
      n.exact ? pathname === n.href : pathname.startsWith(n.href),
    )?.label ?? "HR 콘솔";

  return (
    <div className="flex min-h-screen w-full bg-paper-dim pt-7">
      {/* desktop sidebar — 데모 배너(h-7) 아래에 고정 */}
      <aside className="sticky top-7 hidden h-[calc(100vh-1.75rem)] w-[248px] shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-x-0 bottom-0 top-7 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[280px]">
            <Sidebar onNavigate={() => setDrawer(false)} />
            <button
              onClick={() => setDrawer(false)}
              className="absolute right-3 top-5 text-white/70"
              aria-label="메뉴 닫기"
            >
              <X className="size-5" />
            </button>
          </aside>
        </div>
      )}

      {/* workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-7 z-40 flex h-16 items-center gap-4 border-b border-line bg-paper/85 px-5 backdrop-blur-md sm:px-8">
          <button
            onClick={() => setDrawer(true)}
            className="text-ink lg:hidden"
            aria-label="메뉴 열기"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="shrink-0 text-[1.05rem] font-bold tracking-tight">
            {pageTitle}
          </h1>
          <div className="flex flex-1 justify-center">
            <GlobalSearch />
          </div>
          <NotificationBell />
        </header>
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
      <FeedbackHost />
    </div>
  );
}
