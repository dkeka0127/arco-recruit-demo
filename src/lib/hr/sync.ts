"use client";

// ════════════════════════════════════════════════════════════════
//  Supabase 동기화 레이어
//  - fetchRemoteState: DB 전체 → HrState 재구성 (하이드레이트)
//  - pushDiff: 액션 전/후 상태를 비교해 변경 행만 업서트/삭제
//  - subscribeRemote: Realtime 구독 → 다른 클라이언트 변경 반영
//  스토어(store.ts)는 이 모듈만 알면 되고, UI는 아무것도 모른다.
// ════════════════════════════════════════════════════════════════

import { getSupabase } from "./supabase";
import { createSeedState, HR_STATE_VERSION } from "./seed";
import type { HrState } from "./types";

/** 테이블 ↔ HrState 컬렉션 필드 매핑 */
const COLLECTIONS = [
  ["hr_stages", "stages"],
  ["hr_jobs", "jobs"],
  ["hr_candidates", "candidates"],
  ["hr_applications", "applications"],
  ["hr_interviews", "interviews"],
  ["hr_proposals", "proposals"],
  // hr_exam_*는 마이그레이션 0005 적용 후 영속. 미적용 시 관용 처리.
  ["hr_exam_templates", "examTemplates"],
  ["hr_exam_sessions", "examSessions"],
  // hr_notices는 마이그레이션 0004 적용 후 영속. 미적용 시 관용 처리(세션 로컬).
  ["hr_notices", "notices"],
  ["hr_talent", "talent"],
  ["hr_members", "members"],
  ["hr_templates", "templates"],
  // hr_audit는 마이그레이션 0003 적용 후 영속. 미적용 시 조회/푸시 오류는
  // 관용 처리되어 세션 로컬로만 유지된다(하이드레이트는 깨지지 않음).
  ["hr_audit", "auditLog"],
] as const;

type CollectionField = (typeof COLLECTIONS)[number][1];

/** 마지막 로컬 푸시 시각 — 자기 자신이 일으킨 Realtime 이벤트로
 *  불필요한 재조회가 일어나는 것을 줄이기 위한 힌트 */
let lastPushAt = 0;

export async function fetchRemoteState(): Promise<HrState | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const [rows, settingsRes] = await Promise.all([
    Promise.all(
      COLLECTIONS.map(([table]) => sb.from(table).select("id,data")),
    ),
    sb.from("hr_settings").select("settings,dismissed_dupes").eq("id", 1).maybeSingle(),
  ]);

  // 핵심 테이블(stages/settings) 조회 실패나 미시드면 원격 사용 불가 → 로컬 폴백.
  // 개별 부가 테이블 오류(예: 아직 없는 테이블)는 빈 배열로 관용 처리해
  // 전체 하이드레이트가 깨지지 않게 한다.
  if (rows[0].error || settingsRes.error) {
    console.warn("[hr-sync] 원격 조회 실패", rows[0].error ?? settingsRes.error);
    return null;
  }
  const stagesRows = rows[0].data ?? [];
  if (stagesRows.length === 0 || !settingsRes.data) {
    console.warn("[hr-sync] Supabase가 비어 있습니다. `npm run seed:supabase`로 시드하세요.");
    return null;
  }

  const base = createSeedState();
  const state: HrState = {
    ...base,
    version: HR_STATE_VERSION,
    settings: settingsRes.data.settings,
    dismissedDupes: settingsRes.data.dismissed_dupes ?? [],
  };
  COLLECTIONS.forEach(([, field], i) => {
    // 개별 테이블 오류는 시드 기본값 유지(관용). 정상 조회분만 덮어쓴다.
    if (rows[i].error) return;
    // 행의 jsonb data가 곧 TS 객체 — 그대로 컬렉션으로 조립
    (state[field as CollectionField] as unknown[]) = (rows[i].data ?? []).map(
      (r) => r.data,
    );
  });
  // 스키마 진화 관용: 구버전에 시드된 멤버 행에는 portalToken이 없다.
  // 재시드 전까지 시드 토큰으로 보충해 면접관 포털이 끊기지 않게 한다.
  state.members = state.members.map((m) =>
    m.portalToken
      ? m
      : { ...m, portalToken: base.members.find((x) => x.id === m.id)?.portalToken ?? `ivp-${m.id.replace(/^m-/, "")}-legacy` },
  );
  return state;
}

/** 변경 diff를 원격에 반영 (fire-and-forget, 실패는 콘솔 경고) */
export function pushDiff(prev: HrState, next: HrState) {
  const sb = getSupabase();
  if (!sb) return;
  lastPushAt = Date.now();

  const jobs: PromiseLike<unknown>[] = [];

  for (const [table, field] of COLLECTIONS) {
    const before = prev[field as CollectionField] as { id: string }[];
    const after = next[field as CollectionField] as { id: string }[];
    if (before === after) continue;

    const beforeMap = new Map(before.map((x) => [x.id, x]));
    const changed = after.filter((x) => {
      const old = beforeMap.get(x.id);
      return !old || JSON.stringify(old) !== JSON.stringify(x);
    });
    const afterIds = new Set(after.map((x) => x.id));
    const removed = before.filter((x) => !afterIds.has(x.id)).map((x) => x.id);

    if (changed.length > 0) {
      jobs.push(
        sb
          .from(table)
          .upsert(
            changed.map((x) => ({
              id: x.id,
              data: x,
              updated_at: new Date().toISOString(),
            })),
          )
          .then(({ error }) => {
            if (error) console.warn(`[hr-sync] ${table} upsert 실패`, error);
          }),
      );
    }
    if (removed.length > 0) {
      jobs.push(
        sb
          .from(table)
          .delete()
          .in("id", removed)
          .then(({ error }) => {
            if (error) console.warn(`[hr-sync] ${table} delete 실패`, error);
          }),
      );
    }
  }

  if (
    prev.settings !== next.settings ||
    prev.dismissedDupes !== next.dismissedDupes
  ) {
    jobs.push(
      sb
        .from("hr_settings")
        .upsert({
          id: 1,
          settings: next.settings,
          dismissed_dupes: next.dismissedDupes,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("[hr-sync] settings upsert 실패", error);
        }),
    );
  }

  void Promise.all(jobs);
}

/** Realtime 구독 — 다른 클라이언트의 변경을 감지해 onRemoteChange 호출 */
export function subscribeRemote(onRemoteChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;
  const channel = sb
    .channel("hr-state")
    .on("postgres_changes", { event: "*", schema: "public" }, () => {
      // 자기 푸시 직후의 에코 이벤트는 한 박자 늦게 한 번만 처리
      if (timer) clearTimeout(timer);
      const delay = Date.now() - lastPushAt < 1500 ? 2000 : 400;
      timer = setTimeout(onRemoteChange, delay);
    })
    .subscribe();

  return () => {
    if (timer) clearTimeout(timer);
    sb.removeChannel(channel);
  };
}
