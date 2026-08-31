"use client";

// ════════════════════════════════════════════════════════════════
//  설정 — 채용 프로세스 · 지원자 공개 정책 · 멤버 권한 · 템플릿 · 데이터
//  "지원자 공개" 설정은 지원자 사이트 /my 페이지 표시와 실시간 연동된다.
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  RotateCcw,
  Mail,
  Send,
  Link2,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHrState, hrActions } from "@/lib/hr/store";
import { Panel, Avatar, StageBadge, EmptyState } from "@/components/hr/ui";
import { AuditLogPanel } from "@/components/hr/audit-log";
import { channelStatus } from "@/lib/hr/sender";
import { mailStatus } from "@/lib/hr/mail";
import { supabaseEnabled } from "@/lib/hr/supabase";
import {
  ROLE_CAPABILITIES,
  CAPABILITY_LABELS,
  type Capability,
  type MemberRole,
  type TemplateType,
  type MessageKind,
  type MessageTemplate,
} from "@/lib/hr/types";
import { confirmAction, toast } from "@/components/hr/feedback";

const TEMPLATE_TYPES: TemplateType[] = ["메일", "문자", "평가표", "면접", "지원서"];

// ── 멤버 및 권한 — 운영진 + 면접관 풀 관리 (800명 조직 스케일) ────

const MEMBER_ROLES: MemberRole[] = ["관리자", "실무진", "면접관", "열람"];

function MembersPanel({ s }: { s: ReturnType<typeof useHrState> }) {
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("전체");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", team: "", role: "면접관" as MemberRole });
  const [showInactive, setShowInactive] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);

  const teams = ["전체", ...new Set(s.members.map((m) => m.team))];
  const q = query.trim().toLowerCase();
  const list = s.members.filter(
    (m) =>
      (showInactive || m.active !== false) &&
      (teamFilter === "전체" || m.team === teamFilter) &&
      (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)),
  );
  const staffCount = s.members.filter((m) => m.role !== "면접관" && m.active !== false).length;
  const interviewerCount = s.members.filter((m) => m.role === "면접관" && m.active !== false).length;
  const inactiveCount = s.members.filter((m) => m.active === false).length;

  function submitAdd() {
    if (!draft.name.trim() || !draft.email.trim() || !draft.team.trim()) {
      alert("이름·이메일·팀을 모두 입력하세요.");
      return;
    }
    if (s.members.some((m) => m.email.trim().toLowerCase() === draft.email.trim().toLowerCase())) {
      alert("이미 등록된 이메일입니다.");
      return;
    }
    hrActions.addMember(draft);
    setDraft({ name: "", email: "", team: draft.team, role: draft.role });
    setAdding(false);
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-accent-ink" /> 멤버 및 권한
          <span className="ml-1 font-mono text-[0.65rem] font-medium text-muted">
            운영진 {staffCount} · 면접관 {interviewerCount}
          </span>
        </span>
      }
      action={
        <button
          onClick={() => setAdding(!adding)}
          className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-ink-700"
        >
          {adding ? "닫기" : "+ 멤버 추가"}
        </button>
      }
      bodyClassName="flex flex-col gap-2 p-4"
    >
      {/* 추가 폼 */}
      {adding && (
        <div className="rounded-xl border border-accent bg-accent-soft/40 p-3.5">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="이름"
              className="h-9 rounded-lg border border-line bg-pure px-3 text-[0.82rem] focus:border-accent focus:outline-none"
            />
            <input
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              placeholder="이메일 (사내 계정)"
              className="h-9 rounded-lg border border-line bg-pure px-3 text-[0.82rem] focus:border-accent focus:outline-none"
            />
            <input
              value={draft.team}
              onChange={(e) => setDraft({ ...draft, team: e.target.value })}
              placeholder="팀/본부"
              list="hr-team-list"
              className="h-9 rounded-lg border border-line bg-pure px-3 text-[0.82rem] focus:border-accent focus:outline-none"
            />
            <datalist id="hr-team-list">
              {teams.filter((t) => t !== "전체").map((t) => <option key={t} value={t} />)}
            </datalist>
            <select
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value as MemberRole })}
              className="h-9 rounded-lg border border-line bg-pure px-3 text-[0.82rem] focus:border-accent focus:outline-none"
            >
              {MEMBER_ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-[0.68rem] text-muted">
              면접관 = 콘솔 접근 없이 포털 링크만 발급 (현업 면접 참여자)
            </p>
            <button
              onClick={submitAdd}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {/* 검색 + 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름·이메일 검색"
          className="h-9 min-w-36 flex-1 rounded-full border border-line bg-pure px-4 text-[0.8rem] focus:border-accent focus:outline-none"
        />
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="h-9 rounded-full border border-line bg-pure px-3 text-[0.78rem] font-medium focus:border-accent focus:outline-none"
        >
          {teams.map((t) => <option key={t}>{t}</option>)}
        </select>
        {inactiveCount > 0 && (
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={cn(
              "h-9 rounded-full border px-3 text-[0.72rem] font-bold transition-colors",
              showInactive
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-line bg-pure text-muted hover:text-ink",
            )}
          >
            비활성 {inactiveCount}
          </button>
        )}
      </div>

      {/* 멤버 목록 */}
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
        {list.length === 0 && <EmptyState text="조건에 맞는 멤버가 없습니다." />}
        {list.map((m) => {
          const inactive = m.active === false;
          return (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-line bg-pure px-4 py-3",
                inactive && "opacity-50",
              )}
            >
              <Avatar name={m.name} size="sm" dark={m.role === "관리자"} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold tracking-tight text-ink">
                  {m.name}
                  <span className="ml-2 text-xs font-medium text-muted">{m.team}</span>
                  {inactive && (
                    <span className="ml-2 rounded-full bg-paper-dim px-2 py-0.5 text-[0.6rem] font-bold text-muted">
                      비활성
                    </span>
                  )}
                </p>
                <p className="truncate font-mono text-[0.65rem] text-muted-ink">{m.email}</p>
              </div>
              <select
                value={m.role}
                onChange={(e) => hrActions.updateMember(m.id, { role: e.target.value as MemberRole })}
                disabled={inactive}
                className={cn(
                  "cursor-pointer rounded-full border-0 px-2.5 py-1 text-[0.68rem] font-bold focus:outline-none",
                  m.role === "관리자" && "bg-ink text-paper",
                  m.role === "실무진" && "bg-accent-soft text-accent-ink",
                  m.role === "면접관" && "bg-signal/12 text-signal",
                  m.role === "열람" && "bg-paper-dim text-muted",
                )}
              >
                {MEMBER_ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              {!inactive && (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/interviewer/${m.portalToken}`,
                      );
                      alert(
                        `${m.name}님의 면접관 포털 링크가 복사되었습니다.\n배정된 면접·평가·알림을 로그인 없이 확인하는 개인 전용 링크입니다.`,
                      );
                    }}
                    title="면접관 포털 링크 복사"
                    aria-label={`${m.name} 면접관 포털 링크 복사`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent-ink"
                  >
                    <Link2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        !confirm(
                          `${m.name}님의 포털 링크를 재발급할까요?\n기존 링크는 즉시 무효화됩니다 (유출 시 회수 용도).`,
                        )
                      )
                        return;
                      hrActions.rotatePortalToken(m.id);
                      alert("재발급되었습니다. 🔗 버튼으로 새 링크를 복사해 전달하세요.");
                    }}
                    title="포털 링크 재발급 (기존 링크 무효화)"
                    aria-label={`${m.name} 포털 링크 재발급`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent-ink"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  if (inactive) {
                    hrActions.setMemberActive(m.id, true);
                    return;
                  }
                  if (
                    confirm(
                      `${m.name}님을 비활성화할까요?\n면접관 선택·포털 접근이 차단되고, 평가 이력은 보존됩니다. (퇴사자 처리)`,
                    )
                  )
                    hrActions.setMemberActive(m.id, false);
                }}
                title={inactive ? "재활성화" : "비활성화 (퇴사자 처리)"}
                aria-label={`${m.name} ${inactive ? "재활성화" : "비활성화"}`}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                  inactive
                    ? "border-signal/40 text-signal hover:bg-signal/10"
                    : "border-line text-muted hover:border-red-300 hover:text-red-500",
                )}
              >
                {inactive ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">
        관리자·실무진·열람 = HR 콘솔 운영진 / <b>면접관 = 포털 전용</b> (콘솔
        접근 없음) · 🔗 포털 링크 복사 · ↺ 재발급 · 👁 비활성화(퇴사)
      </p>

      {/* 역할별 권한 매트릭스 (접이식) */}
      <button
        onClick={() => setMatrixOpen(!matrixOpen)}
        className="mt-1 w-fit text-[0.72rem] font-bold text-accent-ink hover:underline"
      >
        역할별 권한 매트릭스 {matrixOpen ? "닫기" : "보기"}
      </button>
      {matrixOpen && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-2 pr-3 font-mono text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted">
                  권한
                </th>
                {MEMBER_ROLES.map((r) => (
                  <th
                    key={r}
                    className="px-2 py-2 text-center font-mono text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted"
                  >
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(CAPABILITY_LABELS) as Capability[]).map((cap) => (
                <tr key={cap} className="border-b border-line/60 last:border-0">
                  <td className="py-2 pr-3 text-[0.8rem] text-ink">
                    {CAPABILITY_LABELS[cap]}
                  </td>
                  {MEMBER_ROLES.map((r) => (
                    <td key={r} className="px-2 py-2 text-center">
                      {ROLE_CAPABILITIES[r].includes(cap) ? (
                        <span className="text-signal">●</span>
                      ) : (
                        <span className="text-line-strong">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function TemplatesPanel() {
  const s = useHrState();
  const [tab, setTab] = useState<TemplateType>("메일");
  /** 편집 대상 — "new"=신규, string=기존 템플릿 id */
  const [editing, setEditing] = useState<"new" | string | null>(null);
  const list = s.templates.filter((t) => (t.templateType ?? "메일") === tab);
  const countOf = (tt: TemplateType) =>
    s.templates.filter((t) => (t.templateType ?? "메일") === tt).length;

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <Mail className="size-4 text-accent-ink" /> 템플릿
        </span>
      }
      action={
        <button
          onClick={() => setEditing("new")}
          className="rounded-full bg-ink px-3.5 py-1.5 text-[0.72rem] font-bold text-paper transition-colors hover:bg-ink-800"
        >
          + 새 템플릿
        </button>
      }
      bodyClassName="flex flex-col gap-3 p-4"
    >
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_TYPES.map((tt) => (
          <button
            key={tt}
            onClick={() => setTab(tt)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors",
              tab === tt
                ? "bg-ink text-paper"
                : "bg-paper text-muted hover:text-ink",
            )}
          >
            {tt}
            <span
              className={cn(
                "font-mono text-[0.62rem]",
                tab === tt ? "text-accent" : "text-muted-ink",
              )}
            >
              {countOf(tt)}
            </span>
          </button>
        ))}
      </div>

      {editing !== null && (
        <TemplateEditor
          key={editing}
          initial={
            editing === "new"
              ? null
              : (s.templates.find((t) => t.id === editing) ?? null)
          }
          defaultType={tab}
          onClose={() => setEditing(null)}
        />
      )}

      {list.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          이 유형의 템플릿이 아직 없습니다. 우측 상단 &quot;새 템플릿&quot;으로 추가하세요.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((t) => (
            <details
              key={t.id}
              className="group rounded-xl border border-line bg-pure open:border-accent"
            >
              <summary className="flex cursor-pointer items-center gap-2.5 px-4 py-3 text-sm font-bold tracking-tight text-ink [&::-webkit-details-marker]:hidden">
                <span className="rounded-md bg-paper-dim px-2 py-0.5 font-mono text-[0.6rem] font-semibold text-muted">
                  {t.kind}
                </span>
                {t.name}
                <span className="ml-auto flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-open:opacity-100">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(t.id);
                    }}
                    className="text-[0.7rem] font-semibold text-muted hover:text-accent-ink"
                  >
                    수정
                  </button>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      const ok = await confirmAction({
                        title: `'${t.name}' 템플릿을 삭제할까요?`,
                        lines: ["삭제 후 되돌리기가 가능합니다."],
                        confirmLabel: "삭제",
                        danger: true,
                      });
                      if (ok) hrActions.removeTemplate(t.id);
                    }}
                    className="text-[0.7rem] font-semibold text-muted hover:text-red-500"
                  >
                    삭제
                  </button>
                </span>
              </summary>
              <div className="border-t border-line px-4 py-3">
                <p className="text-[0.8rem] font-semibold text-ink">
                  {t.subject}
                </p>
                <p className="mt-2 whitespace-pre-line text-[0.78rem] leading-relaxed text-muted">
                  {t.body}
                </p>
              </div>
            </details>
          ))}
        </div>
      )}
    </Panel>
  );
}

/** 템플릿 추가/수정 폼 — 변수({{이름}} 등) 안내 포함 */
function TemplateEditor({
  initial,
  defaultType,
  onClose,
}: {
  initial: MessageTemplate | null;
  defaultType: TemplateType;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<MessageKind>(initial?.kind ?? "기타");
  const [templateType, setTemplateType] = useState<TemplateType>(
    initial?.templateType ?? defaultType,
  );
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "");

  const KINDS: MessageKind[] = [
    "접수확인", "서류합격", "면접안내", "최종합격", "불합격", "기타",
  ];

  function save() {
    if (!name.trim()) return toast.show("템플릿 이름을 입력하세요.");
    if (!subject.trim()) return toast.show("제목을 입력하세요.");
    if (!body.trim()) return toast.show("본문을 입력하세요.");
    const payload = {
      name: name.trim(),
      kind,
      templateType,
      subject: subject.trim(),
      body,
    };
    if (initial) hrActions.updateTemplate(initial.id, payload);
    else hrActions.addTemplate(payload);
    toast.show(`템플릿을 ${initial ? "수정" : "추가"}했습니다.`);
    onClose();
  }

  return (
    <div className="rounded-xl border border-accent bg-accent-soft/40 p-4">
      <p className="text-[0.82rem] font-bold text-ink">
        {initial ? `템플릿 수정 — ${initial.name}` : "새 템플릿"}
      </p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="템플릿 이름 (예: 필기 합격 안내)"
          className="rounded-lg border border-line bg-pure px-3 py-2 text-[0.82rem] focus:border-accent focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as MessageKind)}
            className="flex-1 rounded-lg border border-line bg-pure px-2.5 py-2 text-[0.82rem] focus:border-accent focus:outline-none"
          >
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value as TemplateType)}
            className="flex-1 rounded-lg border border-line bg-pure px-2.5 py-2 text-[0.82rem] focus:border-accent focus:outline-none"
          >
            {TEMPLATE_TYPES.map((tt) => (
              <option key={tt}>{tt}</option>
            ))}
          </select>
        </div>
      </div>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="제목 (예: [아르코에듀] 필기 전형 합격 안내)"
        className="mt-2.5 w-full rounded-lg border border-line bg-pure px-3 py-2 text-[0.82rem] focus:border-accent focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={"본문 — 아래 변수가 발송 시 자동 치환됩니다:\n{{이름}} {{공고명}} {{기한}} {{링크}} {{일시}} {{장소}}"}
        rows={6}
        className="mt-2.5 w-full rounded-lg border border-line bg-pure px-3 py-2 text-[0.82rem] leading-relaxed focus:border-accent focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[0.65rem] font-semibold text-muted">사용 가능 변수:</span>
        {["{{이름}}", "{{공고명}}", "{{기한}}", "{{링크}}", "{{일시}}", "{{장소}}"].map((v) => (
          <button
            key={v}
            onClick={() => setBody((b) => b + v)}
            title="본문 끝에 삽입"
            className="rounded-full bg-pure px-2 py-0.5 font-mono text-[0.65rem] font-bold text-accent-ink transition-colors hover:bg-accent hover:text-ink"
          >
            {v}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-full border border-line px-4 py-2 text-[0.78rem] font-semibold text-muted hover:text-ink"
        >
          취소
        </button>
        <button
          onClick={save}
          className="rounded-full bg-ink px-5 py-2 text-[0.78rem] font-bold text-paper transition-colors hover:bg-ink-800"
        >
          {initial ? "수정 저장" : "템플릿 추가"}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  on,
  onChange,
  label,
  desc,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-pure px-4 py-3.5 text-left transition-colors hover:border-accent"
    >
      <span>
        <span className="block text-[0.9rem] font-bold tracking-tight text-ink">
          {label}
        </span>
        {desc && (
          <span className="mt-0.5 block text-[0.78rem] leading-snug text-muted">
            {desc}
          </span>
        )}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300",
          on ? "bg-accent" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] duration-300",
            on ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function HrSettings() {
  const s = useHrState();
  const [labelDraft, setLabelDraft] = useState<Record<string, string>>({});
  const [nameDraft, setNameDraft] = useState<Record<string, string>>({});

  const stages = [...s.stages].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      {/* 지원자 공개 정책 */}
      <Panel
        title={
          <span className="flex items-center gap-1.5">
            <Eye className="size-4 text-accent-ink" /> 지원자 공개 정책
          </span>
        }
        bodyClassName="grid gap-4 p-5 lg:grid-cols-2"
      >
        <div className="flex flex-col gap-3">
          <Toggle
            on={s.settings.showStageToCandidate}
            onChange={(v) => hrActions.updateSettings({ showStageToCandidate: v })}
            label="현재 전형 단계 공개"
            desc="지원자 마이페이지에 현재 진행 단계를 표시합니다."
          />
          <Toggle
            on={s.settings.showTimelineToCandidate}
            onChange={(v) =>
              hrActions.updateSettings({ showTimelineToCandidate: v })
            }
            label="전형 타임라인 공개"
            desc="단계별 진행 이력(날짜 포함)을 타임라인으로 보여줍니다."
          />
          <Toggle
            on={s.settings.notifyOnStageChange}
            onChange={(v) =>
              hrActions.updateSettings({ notifyOnStageChange: v })
            }
            label="단계 변경 자동 알림"
            desc="공개 단계로 이동하면 지원자에게 메일이 자동 발송됩니다."
          />
        </div>

        {/* live preview */}
        <div className="rounded-card bg-ink p-5 text-paper">
          <p className="kicker text-accent">지원자 화면 미리보기 — /my</p>
          <div className="mt-4 rounded-xl bg-white/5 p-4">
            <p className="text-sm font-bold">[개발] AI 풀스택개발자 채용</p>
            {s.settings.showStageToCandidate ? (
              <p className="mt-2 inline-flex rounded-full bg-accent px-3 py-1 text-[0.72rem] font-bold text-ink">
                면접진행
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-1.5 text-[0.78rem] text-white/50">
                <EyeOff className="size-3.5" /> 전형 단계 비공개 상태
              </p>
            )}
            {s.settings.showTimelineToCandidate ? (
              <div className="mt-4 flex items-center gap-1.5">
                {["접수", "서류", "면접", "발표"].map((st, i) => (
                  <span key={st} className="flex flex-1 flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        "h-1 w-full rounded-full",
                        i < 3 ? "bg-accent" : "bg-white/15",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[0.62rem]",
                        i < 3 ? "text-accent" : "text-white/40",
                      )}
                    >
                      {st}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[0.72rem] text-white/40">
                타임라인이 표시되지 않습니다.
              </p>
            )}
          </div>
          <p className="mt-3 text-[0.68rem] leading-relaxed text-white/50">
            설정 변경은 지원자 사이트 마이페이지에 즉시 반영됩니다. 새 탭에서{" "}
            <a href="/my" target="_blank" className="text-accent underline">
              /my
            </a>
            를 열어 확인해 보세요.
          </p>
        </div>
      </Panel>

      {/* 채용 프로세스 */}
      <Panel
        title="채용 프로세스 단계"
        action={
          <button
            onClick={() => {
              const name = prompt("추가할 단계 이름 (예: 3차 면접)")?.trim();
              if (name) hrActions.addStage(name);
            }}
            className="rounded-full bg-ink px-3.5 py-1.5 text-[0.72rem] font-bold text-paper transition-colors hover:bg-ink-800"
          >
            + 단계 추가
          </button>
        }
        bodyClassName="flex flex-col gap-2.5 p-5"
      >
        {stages.map((st) => {
          const activeStages = stages.filter((x) => x.kind === "active");
          const activeIdx = activeStages.findIndex((x) => x.id === st.id);
          const isActive = st.kind === "active";
          return (
            <div
              key={st.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-pure px-4 py-3"
            >
              <span className="w-8 font-mono text-[0.68rem] text-muted-ink">
                {String(st.order + 1).padStart(2, "0")}
              </span>
              {/* 순서 이동 — 활성 단계만, 터미널(합격/불합격)은 고정 */}
              <span className="flex flex-col">
                <button
                  onClick={() => hrActions.reorderStage(st.id, -1)}
                  disabled={!isActive || activeIdx <= 0}
                  aria-label="위로"
                  className="text-muted-ink transition-colors hover:text-ink disabled:opacity-25"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  onClick={() => hrActions.reorderStage(st.id, 1)}
                  disabled={!isActive || activeIdx >= activeStages.length - 1}
                  aria-label="아래로"
                  className="text-muted-ink transition-colors hover:text-ink disabled:opacity-25"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </span>
              <StageBadge stage={st} className="min-w-24 justify-center" />
              {/* 내부 단계명 편집 (활성 단계만) */}
              {isActive ? (
                <input
                  value={nameDraft[st.id] ?? st.name}
                  onChange={(e) =>
                    setNameDraft((prev) => ({ ...prev, [st.id]: e.target.value }))
                  }
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== st.name) hrActions.updateStage(st.id, { name: v });
                  }}
                  className="h-8 w-28 rounded-lg border border-line bg-paper px-2.5 text-[0.78rem] font-semibold text-ink focus:border-accent focus:outline-none"
                  title="내부 단계명"
                />
              ) : (
                <span className="w-28 text-[0.78rem] font-semibold text-muted-ink">
                  {st.name} (고정)
                </span>
              )}
              <label className="ml-auto flex items-center gap-2 text-[0.75rem] text-muted">
                지원자 표기
                <input
                  value={labelDraft[st.id] ?? st.candidateLabel ?? st.name}
                  onChange={(e) =>
                    setLabelDraft((prev) => ({ ...prev, [st.id]: e.target.value }))
                  }
                  onBlur={(e) =>
                    hrActions.updateStage(st.id, {
                      candidateLabel: e.target.value,
                    })
                  }
                  className="h-8 w-28 rounded-lg border border-line bg-paper px-2.5 text-[0.78rem] text-ink focus:border-accent focus:outline-none"
                />
              </label>
              <button
                onClick={() =>
                  hrActions.updateStage(st.id, {
                    visibleToCandidate: !st.visibleToCandidate,
                  })
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.72rem] font-bold transition-colors",
                  st.visibleToCandidate
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-line bg-paper-dim text-muted",
                )}
              >
                {st.visibleToCandidate ? (
                  <>
                    <Eye className="size-3.5" /> 공개
                  </>
                ) : (
                  <>
                    <EyeOff className="size-3.5" /> 비공개
                  </>
                )}
              </button>
              {/* 삭제 — 활성 단계만, 지원자 있으면 액션이 거부 */}
              {isActive && (
                <button
                  onClick={async () => {
                    const r = hrActions.removeStage(st.id);
                    if (!r.ok) toast.show(r.reason ?? "삭제할 수 없습니다.");
                  }}
                  aria-label="단계 삭제"
                  className="flex size-7 items-center justify-center rounded-full text-muted-ink transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}
        <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">
          진행 단계는 추가·삭제·순서 변경할 수 있습니다(최종합격·불합격은 고정).
          지원자가 있는 단계는 삭제되지 않으며, 비공개 단계로 이동한 지원자의
          마이페이지에는 직전 공개 단계가 유지 표시됩니다.
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 멤버 권한 */}
        <MembersPanel s={s} />

        {/* 템플릿 (5종 분류) */}
        <TemplatesPanel />
      </div>

      {/* 데이터 정책 */}
      <Panel title="데이터 · 개인정보" bodyClassName="flex flex-wrap items-center gap-4 p-5">
        <label className="flex items-center gap-3 text-sm font-semibold text-ink">
          인재풀 개인정보 보관기간
          <select
            value={s.settings.retentionYears}
            onChange={(e) =>
              hrActions.updateSettings({ retentionYears: +e.target.value })
            }
            className="h-10 rounded-full border border-line bg-pure px-4 text-sm focus:border-accent focus:outline-none"
          >
            {[1, 2, 3, 5].map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </label>
        <span className="text-[0.72rem] leading-relaxed text-muted">
          보관기한(만료일)이 지난 인재풀 항목은 콘솔이 자동 파기하고 감사
          로그에 남깁니다. 만료 30일 전부터 인재풀 화면에 임박 표시가 뜹니다.
        </span>
        {/* 데모 초기화 — 실데이터 리셋 사고 방지 위해 데모 모드에서만 노출 */}
        {!supabaseEnabled ? (
          <button
            onClick={async () => {
              const ok = await confirmAction({
                title: "모든 데모 데이터를 초기 상태로 되돌릴까요?",
                lines: ["작성한 공고·지원자·평가·시험이 모두 시드 상태로 초기화됩니다."],
                confirmLabel: "초기화",
                danger: true,
              });
              if (ok) hrActions.resetDemo();
            }}
            className="ml-auto flex h-10 items-center gap-2 rounded-full border border-line-strong bg-pure px-5 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
          >
            <RotateCcw className="size-4" /> 데모 데이터 초기화
          </button>
        ) : (
          <span className="ml-auto text-[0.72rem] text-muted-ink">
            운영(Supabase) 모드 — 데이터 초기화는 비활성화되어 있습니다
          </span>
        )}
      </Panel>

      {/* 발신 채널 연동 상태 */}
      <Panel
        title={
          <span className="flex items-center gap-1.5">
            <Send className="size-4 text-accent-ink" /> 발신 채널 연동
          </span>
        }
        bodyClassName="flex flex-col gap-2 p-4"
      >
        {(Object.keys(channelStatus) as (keyof typeof channelStatus)[]).map(
          (ch) => {
            const st = channelStatus[ch];
            return (
              <div
                key={ch}
                className="flex items-center gap-3 rounded-xl border border-line bg-pure px-4 py-3"
              >
                <Mail className="size-4 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold tracking-tight text-ink">
                    {ch}
                  </p>
                  <p className="font-mono text-[0.68rem] text-muted-ink">
                    {st.provider}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[0.68rem] font-bold",
                    st.ready
                      ? "bg-signal/12 text-signal"
                      : "bg-paper-dim text-muted",
                  )}
                >
                  {st.ready ? "연동됨" : "연동 대기"}
                </span>
              </div>
            );
          },
        )}
        <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">
          현재는 발송 이력만 기록하는 목업입니다. 각 채널의 발신 자격(SES IAM,
          NHN·카카오 발신프로필)이 준비되면 서버 라우트로 실발송을 연결합니다.
        </p>
      </Panel>

      {/* 워크스페이스 이메일 (지원자와 양방향 대화) */}
      <Panel
        title={
          <span className="flex items-center gap-1.5">
            <Mail className="size-4 text-accent-ink" /> 워크스페이스 이메일
          </span>
        }
        bodyClassName="flex flex-col gap-4 p-5"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8rem] font-bold text-ink">
            발신·수신 이메일 주소
          </span>
          <input
            value={s.settings.workspaceEmail ?? ""}
            onChange={(e) =>
              hrActions.updateSettings({ workspaceEmail: e.target.value })
            }
            placeholder="recruit@arco.example"
            className="h-11 max-w-sm rounded-xl border border-line bg-pure px-4 text-sm focus:border-accent focus:outline-none"
          />
          <span className="text-[0.72rem] text-muted">
            이 주소로 지원자에게 메일을 보내고, 지원자 회신을 받습니다.
          </span>
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { label: "발신", st: mailStatus.outbound, on: false },
            {
              label: "수신",
              st: mailStatus.inbound,
              on: Boolean(s.settings.mailInboundConnected),
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-xl border border-line bg-pure px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{row.label} 연동</p>
                <p className="font-mono text-[0.68rem] text-muted-ink">
                  {row.st.provider}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[0.68rem] font-bold",
                  row.on
                    ? "bg-signal/12 text-signal"
                    : "bg-paper-dim text-muted",
                )}
              >
                {row.on ? "연동됨" : "연동 대기"}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-line-strong bg-pure/60 px-4 py-3 text-[0.75rem] leading-relaxed text-muted">
          <b className="text-ink">운영 전환 시 필요한 설정 한 가지</b> — 로직·화면·수신
          웹훅(<span className="font-mono">/api/mail/inbound</span>)은 이미 완성되어
          있습니다. ① 발신: AWS SES 발신 자격, ② 수신: 도메인 MX를 메일 제공자에
          연결하고 수신 규칙을 위 웹훅으로 지정하면 지원자 실제 회신이 이
          대화 스레드로 자동 수신됩니다.
        </div>
      </Panel>

      {/* 감사 로그 — 검색·필터·CSV 내보내기 */}
      <AuditLogPanel />
    </div>
  );
}
