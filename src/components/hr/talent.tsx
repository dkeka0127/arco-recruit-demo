"use client";

// ════════════════════════════════════════════════════════════════
//  인재풀 — Talent Intelligence
//  "탈락자 보관함"이 아니라 회사가 계속 재활용하는 지능형 후보 자산.
//  AI는 코파일럿: 결정 X, 근거와 함께 놓칠 후보를 찾아준다.
//    ① AI 추천 대시보드(재접촉·보관임박·공고적합·실버)
//    ② 자연어 인재 검색
//    ③ 공고별 추천 후보 (근거/주의)
//    ④ 후보 카드 + AI 히스토리 요약 + 다음 액션
//    ⑤ 개인정보/보관 관리
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  Award,
  Clock,
  PhoneCall,
  Briefcase,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHrState, hrActions } from "@/lib/hr/store";
import { confirmAction } from "@/components/hr/feedback";
import {
  buildTalentProfiles,
  recommendForJob,
  summarizeProfile,
  searchProfiles,
  recontactQueue,
  daysSince,
  dDay,
  type TalentProfile,
  type TalentCategory,
} from "@/lib/hr/talent-intel";
import { Panel, Avatar, EmptyState } from "@/components/hr/ui";

const CAT_TONE: Record<TalentCategory, string> = {
  개발: "bg-accent-soft text-accent-ink",
  "기획/마케팅": "bg-accent-soft text-accent-ink",
  영어연구: "bg-accent-soft text-accent-ink",
  교재편집: "bg-accent-soft text-accent-ink",
  전문강사: "bg-accent-soft text-accent-ink",
  "운영/상담": "bg-accent-soft text-accent-ink",
  "디자인/퍼블리싱": "bg-accent-soft text-accent-ink",
  기타: "bg-paper-dim text-muted",
};

const STATUS_TONE: Record<string, string> = {
  "즉시 연락 가능": "bg-signal/12 text-signal",
  "우수 탈락자": "bg-ink text-paper",
  "추후 재검토": "bg-accent-soft text-accent-ink",
  "포지션 미스매치": "bg-paper-dim text-muted",
  보류: "bg-paper-dim text-muted",
};

export function HrTalent() {
  const s = useHrState();
  const profiles = useMemo(() => buildTalentProfiles(s), [s]);

  const [jobId, setJobId] = useState(
    s.jobs.find((j) => j.status === "게시중")?.id ?? "",
  );
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<TalentProfile | null>(null);

  const job = s.jobs.find((j) => j.id === jobId);
  const recs = useMemo(
    () => (job ? recommendForJob(job, profiles).slice(0, 6) : []),
    [job, profiles],
  );
  const recontact = useMemo(() => recontactQueue(profiles, s), [profiles, s]);
  const hits = useMemo(
    () => searchProfiles(query, profiles),
    [query, profiles],
  );

  const expiring = profiles.filter((p) => dDay(p.expiresAt) <= 30);
  const silver = profiles.filter((p) => p.status === "우수 탈락자");

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      {/* ── AI 추천 대시보드 (요약 카운트) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "다시 볼 후보", value: recontact.length, icon: PhoneCall, hint: "재접촉 추천" },
          { label: "보관기한 임박", value: expiring.length, icon: Clock, hint: "D-30 이내" },
          { label: "우수 탈락자", value: silver.length, icon: Award, hint: "실버 메달리스트" },
          { label: "전체 인재", value: profiles.length, icon: Briefcase, hint: `${s.settings.retentionYears}년 보관` },
        ].map((k) => (
          <div key={k.label} className="surface-card rounded-card p-5 shadow-lift">
            <div className="flex items-start justify-between">
              <p className="text-[0.78rem] font-semibold text-muted">{k.label}</p>
              <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                <k.icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold text-ink">
              {k.value}
            </p>
            <p className="mt-1 text-[0.72rem] text-muted">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* ── 오늘 재접촉 추천 ── */}
      <Panel
        title={
          <span className="flex items-center gap-1.5">
            <PhoneCall className="size-4 text-accent-ink" /> 오늘 재접촉 추천 후보
          </span>
        }
        bodyClassName="flex flex-col gap-2.5 p-4"
      >
        {recontact.length === 0 && (
          <EmptyState text="지금 재접촉을 추천할 후보가 없습니다." />
        )}
        {recontact.map((r) => (
          <button
            key={r.profile.id}
            onClick={() => setDetail(r.profile)}
            className="group flex items-center gap-3 rounded-xl border border-line bg-pure p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lift"
          >
            <Avatar name={r.profile.name} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-ink">
                  {r.profile.name}
                </span>
                {r.urgency === "high" && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6rem] font-bold text-ink">
                    우선
                  </span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {r.reason}
              </span>
            </span>
            <span className="shrink-0 text-[0.72rem] font-bold text-accent-ink">
              히스토리 보기
            </span>
          </button>
        ))}
      </Panel>

      {/* ── 자연어 인재 검색 ── */}
      <Panel
        title={
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-accent-ink" /> 자연어 인재 검색
          </span>
        }
        bodyClassName="p-5"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 영어 교재 편집 경험 있고 면접 평가 좋았던 사람"
            className="h-12 w-full rounded-full border border-line bg-pure pl-11 pr-4 text-sm tracking-tight placeholder:text-muted-ink focus:border-accent focus:outline-none"
          />
        </div>
        {!query && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "영어연구 경험 있고 평가 좋은 후보",
              "영상 콘텐츠 경험 있는 운영자",
              "불합격했지만 재검토 가능한 개발자",
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-[0.75rem] font-medium text-muted transition-colors hover:border-accent hover:text-accent-ink"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        {query && (
          <div className="mt-4 flex flex-col gap-2">
            {hits.length === 0 && (
              <p className="text-sm text-muted">일치하는 후보가 없습니다.</p>
            )}
            {hits.slice(0, 6).map((h) => (
              <button
                key={h.profile.id}
                onClick={() => setDetail(h.profile)}
                className="group flex items-center gap-3 rounded-xl border border-line bg-pure p-3.5 text-left transition-all hover:border-accent"
              >
                <Avatar name={h.profile.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="font-bold tracking-tight text-ink">
                    {h.profile.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {h.matched.join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[0.72rem] text-accent-ink">
                  {h.profile.category}
                </span>
              </button>
            ))}
            <p className="mt-1 font-mono text-[0.62rem] text-muted-ink">
              * 목업 검색입니다. Bedrock 연동 시 임베딩 기반 의미 검색으로
              고도화됩니다.
            </p>
          </div>
        )}
      </Panel>

      {/* ── 공고별 AI 후보 추천 ── */}
      <Panel
        title={
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-accent-ink" /> 공고별 AI 후보 추천
          </span>
        }
        action={
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="h-9 max-w-72 rounded-full border border-line bg-pure px-3.5 text-[0.8rem] font-medium focus:border-accent focus:outline-none"
          >
            {s.jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        }
        bodyClassName="grid gap-4 p-5 lg:grid-cols-2"
      >
        {recs.length === 0 && (
          <EmptyState text="이 공고에 추천할 인재풀 후보가 없습니다." className="lg:col-span-2" />
        )}
        {recs.map((r, i) => (
          <div
            key={r.profile.id}
            className={cn(
              "relative flex flex-col rounded-xl border p-4",
              i === 0 ? "border-accent bg-accent-soft/40" : "border-line bg-pure",
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar name={r.profile.name} />
              <div className="min-w-0 flex-1">
                <p className="font-bold tracking-tight text-ink">
                  {r.profile.name}
                </p>
                <p className="text-xs text-muted">{r.profile.role}</p>
              </div>
              <span className="text-right">
                <span className="font-mono text-2xl font-semibold text-accent-ink">
                  {r.score}
                </span>
                <span className="block text-[0.6rem] text-muted-ink">추천도</span>
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-signal">
                추천 이유
              </p>
              <ul className="mt-1 flex flex-col gap-1">
                {r.reasons.slice(0, 3).map((reason) => (
                  <li
                    key={reason}
                    className="flex items-start gap-1.5 text-[0.8rem] leading-snug text-ink"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-signal" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
            {r.cautions.length > 0 && (
              <div className="mt-2.5">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted">
                  주의
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {r.cautions.map((c) => (
                    <li
                      key={c}
                      className="flex items-start gap-1.5 text-[0.8rem] leading-snug text-muted"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-ink" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setDetail(r.profile)}
              className="mt-3 w-fit text-[0.75rem] font-bold text-accent-ink hover:underline"
            >
              히스토리·다음 액션 보기 →
            </button>
          </div>
        ))}
        <p className="font-mono text-[0.62rem] text-muted-ink lg:col-span-2">
          * AI는 후보를 추천할 뿐 결정하지 않습니다. 연락·전형 재개는 담당자가
          판단합니다.
        </p>
      </Panel>

      {/* ── 전체 인재풀 목록 ── */}
      <Panel title={`전체 인재풀 (${profiles.length})`} bodyClassName="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="surface-card group flex flex-col rounded-card p-4 shadow-lift transition-transform duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3">
              <Avatar name={p.name} />
              <div className="min-w-0 flex-1">
                <p className="font-bold tracking-tight text-ink">{p.name}</p>
                <p className="truncate text-xs text-muted">{p.role}</p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem] font-bold", CAT_TONE[p.category])}>
                {p.category}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem] font-bold", STATUS_TONE[p.status])}>
                {p.status}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="font-mono text-[0.62rem] text-muted-ink">
                마지막 접촉 {daysSince(p.lastContactAt)}일 전
              </span>
              <button
                onClick={() => setDetail(p)}
                className="text-[0.72rem] font-bold text-accent-ink hover:underline"
              >
                상세
              </button>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <EmptyState text="인재풀이 비어 있습니다." className="sm:col-span-2 xl:col-span-3" />
        )}
      </Panel>

      {detail && (
        <TalentDetailDrawer
          profile={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

// ── 후보 상세 드로어 (AI 요약 + 다음 액션) ──────────────────────

function TalentDetailDrawer({
  profile,
  onClose,
}: {
  profile: TalentProfile;
  onClose: () => void;
}) {
  const s = useHrState();
  const summary = useMemo(() => summarizeProfile(profile, s), [profile, s]);
  // 추천 가능 공고 (게시중, 직무군 일치)
  const suggestedJobs = s.jobs.filter(
    (j) => j.status === "게시중",
  );

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-paper shadow-pop">
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <Avatar name={profile.name} size="lg" />
            <div>
              <p className="text-xl font-extrabold tracking-tight">
                {profile.name}
              </p>
              <p className="text-sm text-muted">{profile.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex size-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
          {/* AI 요약 */}
          <section>
            <p className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-wider text-accent-ink">
              <Sparkles className="size-3.5" /> AI 히스토리 요약
            </p>
            <p className="mt-2 rounded-xl bg-accent-soft/50 p-4 text-[0.9rem] leading-relaxed text-ink">
              {summary}
            </p>
          </section>

          {/* 지표 */}
          <section className="grid grid-cols-2 gap-2">
            {[
              { label: "직무군", value: profile.category },
              { label: "상태", value: profile.status },
              {
                label: "평가 평균",
                value: profile.avgRating ? `${profile.avgRating.toFixed(1)} / 5` : "-",
              },
              {
                label: "이전 AI 매치",
                value: profile.aiScore ? `${profile.aiScore}점` : "-",
              },
              {
                label: "마지막 접촉",
                value: `${daysSince(profile.lastContactAt)}일 전`,
              },
              {
                label: "보관기한",
                value: `D-${Math.max(0, dDay(profile.expiresAt))}`,
              },
            ].map((f) => (
              <div key={f.label} className="rounded-lg bg-paper px-3 py-2">
                <p className="text-[0.62rem] text-muted-ink">{f.label}</p>
                <p className="mt-0.5 text-[0.85rem] font-bold text-ink">
                  {f.value}
                </p>
              </div>
            ))}
          </section>

          {profile.positiveComments.length > 0 && (
            <section>
              <p className="text-[0.72rem] font-bold uppercase tracking-wider text-signal">
                면접관 긍정 코멘트
              </p>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {profile.positiveComments.map((c) => (
                  <li
                    key={c}
                    className="rounded-lg border border-line bg-pure px-3 py-2 text-[0.82rem] text-ink"
                  >
                    “{c}”
                  </li>
                ))}
              </ul>
            </section>
          )}

          {profile.rejectReason && (
            <section>
              <p className="text-[0.72rem] font-bold uppercase tracking-wider text-muted">
                이전 불합격 사유
              </p>
              <p className="mt-1.5 rounded-lg bg-paper-dim px-3.5 py-2.5 text-[0.82rem] text-muted">
                {profile.rejectReason}
              </p>
            </section>
          )}

          {/* 추천 가능 공고 */}
          <section>
            <p className="text-[0.72rem] font-bold uppercase tracking-wider text-accent-ink">
              추천 가능 공고
            </p>
            <div className="mt-1.5 flex flex-col gap-2">
              {suggestedJobs.slice(0, 4).map((j) => (
                <Link
                  key={j.id}
                  href={`/hr/applicants?job=${j.id}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-pure px-3.5 py-2.5 text-[0.82rem] transition-colors hover:border-accent"
                >
                  <span className="truncate font-medium text-ink">
                    {j.title}
                  </span>
                  <span className="shrink-0 text-accent-ink">→</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* 다음 액션 */}
        <footer className="flex flex-wrap gap-2 border-t border-line p-5">
          <button
            onClick={() => alert("데모: 재접촉 메시지 작성 화면으로 연결 예정")}
            className="h-11 flex-1 rounded-full bg-ink text-sm font-semibold text-paper transition-colors hover:bg-ink-700"
          >
            연락하기
          </button>
          {profile.origin === "rejected" && (
            <button
              onClick={() => {
                hrActions.addTalent({
                  name: profile.name,
                  role: profile.role,
                  tags: [...profile.tags, "실버 메달리스트"],
                  addedAt: new Date().toISOString().slice(0, 10),
                  expiresAt: profile.expiresAt,
                  source: profile.source,
                  note: profile.note || "AI 추천 재발굴",
                  lastApplied: profile.lastAppliedJob,
                });
                onClose();
              }}
              className="h-11 flex-1 rounded-full border border-line-strong bg-pure text-sm font-semibold text-ink transition-colors hover:border-ink"
            >
              인재풀 정식 등록
            </button>
          )}
          {profile.origin === "entry" && (
            <button
              onClick={async () => {
                const ok = await confirmAction({
                  title: `${profile.name} 님의 정보를 파기할까요?`,
                  lines: ["개인정보가 삭제됩니다."],
                  facts: [{ label: "대상", value: `${profile.name} · ${profile.role}` }],
                  confirmLabel: "파기",
                  danger: true,
                });
                if (ok) {
                  hrActions.removeTalent(profile.id.replace(/^entry-/, ""));
                  onClose();
                }
              }}
              className="h-11 flex-1 rounded-full border border-line-strong bg-pure text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
            >
              파기
            </button>
          )}
        </footer>

        <p className="border-t border-line bg-pure/60 px-6 py-3 text-[0.62rem] leading-relaxed text-muted">
          <Info className="mr-1 inline size-3" />
          AI 요약·추천은 보조 정보입니다. 연락·전형 재개 여부는 담당자가
          판단합니다.
        </p>
      </aside>
    </div>
  );
}
