"use client";

// ════════════════════════════════════════════════════════════════
//  프록터링 미디어 엔진 — 응시 화면(/exam/[token]) 전용.
//  · 캠+마이크(getUserMedia)·전체 화면(getDisplayMedia) 스트림 획득
//  · MediaRecorder 5초 청크 녹화 → IndexedDB 영속 (스토어 밖!)
//  · 주기 스냅샷(JPEG)·신분 확인 사진 캡처
//  · Supabase 모드면 제출 시 조립본을 Storage(exam-media)에 업로드
//  녹화 원본은 용량 때문에 절대 HrState(jsonb/localStorage)에 넣지 않는다.
// ════════════════════════════════════════════════════════════════

import { getSupabase } from "./supabase";

// ── IndexedDB (녹화 청크 · 스냅샷) ───────────────────────────────

const DB_NAME = "talent-os-exam-media";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("chunks"))
        db.createObjectStore("chunks"); // key: `${sessionId}|${kind}|${seq}`
      if (!db.objectStoreNames.contains("snaps"))
        db.createObjectStore("snaps"); // key: `${sessionId}|${seq}` → {at, blob}
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(store: string, key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function idbListByPrefix<T>(
  store: string,
  prefix: string,
): Promise<{ key: string; value: T }[]> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const out: { key: string; value: T }[] = [];
        const range = IDBKeyRange.bound(prefix, prefix + "￿");
        const req = db
          .transaction(store, "readonly")
          .objectStore(store)
          .openCursor(range);
        req.onsuccess = () => {
          const cur = req.result;
          if (cur) {
            out.push({ key: String(cur.key), value: cur.value as T });
            cur.continue();
          } else resolve(out);
        };
        req.onerror = () => reject(req.error);
      }),
  );
}

const seqKey = (n: number) => String(n).padStart(6, "0");

export type RecordingKind = "cam" | "screen";

export async function saveChunk(
  sessionId: string,
  kind: RecordingKind,
  seq: number,
  blob: Blob,
): Promise<void> {
  await idbPut("chunks", `${sessionId}|${kind}|${seqKey(seq)}`, blob);
}

/** 청크를 순서대로 이어붙인 재생 가능한 webm Blob (없으면 null) */
export async function assembleRecording(
  sessionId: string,
  kind: RecordingKind,
): Promise<Blob | null> {
  try {
    const rows = await idbListByPrefix<Blob>("chunks", `${sessionId}|${kind}|`);
    if (rows.length === 0) return null;
    rows.sort((a, b) => a.key.localeCompare(b.key));
    return new Blob(
      rows.map((r) => r.value),
      { type: "video/webm" },
    );
  } catch {
    return null;
  }
}

export interface ExamSnapshot {
  at: string;
  blob: Blob;
}

export async function saveSnapshot(
  sessionId: string,
  seq: number,
  snap: ExamSnapshot,
): Promise<void> {
  await idbPut("snaps", `${sessionId}|${seqKey(seq)}`, snap);
}

export async function listSnapshots(sessionId: string): Promise<ExamSnapshot[]> {
  try {
    const rows = await idbListByPrefix<ExamSnapshot>("snaps", `${sessionId}|`);
    rows.sort((a, b) => a.key.localeCompare(b.key));
    return rows.map((r) => r.value);
  } catch {
    return [];
  }
}

// ── 환경 점검 ────────────────────────────────────────────────────

export interface EnvSupport {
  ok: boolean;
  /** 응시 불가 사유 (ok=false일 때) */
  reason?: string;
  isMobile: boolean;
}

/**
 * 응시 가능 환경인지 사전 판정. 화면 공유가 필수인 시험은 모바일·
 * getDisplayMedia 미지원 브라우저(사파리 등)에서 시작조차 못 하게 막아
 * "시작 후 실패"로 인한 혼란을 없앤다.
 */
export function checkEnv(needScreen: boolean): EnvSupport {
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const hasGUM = Boolean(navigator.mediaDevices?.getUserMedia);
  const hasGDM = Boolean(navigator.mediaDevices?.getDisplayMedia);
  if (!hasGUM)
    return { ok: false, isMobile, reason: "이 브라우저는 카메라 접근을 지원하지 않습니다." };
  if (needScreen && (isMobile || !hasGDM))
    return {
      ok: false,
      isMobile,
      reason: isMobile
        ? "화면 공유 감독이 필요한 시험은 모바일에서 응시할 수 없습니다. PC(Windows·Mac)의 크롬·엣지 브라우저로 접속해 주세요."
        : "이 브라우저는 화면 공유를 지원하지 않습니다. 크롬(Chrome)·엣지(Edge) 최신 버전으로 접속해 주세요.",
    };
  return { ok: true, isMobile };
}

/** getUserMedia 실패 사유를 사람이 읽는 안내로 변환 */
export function mediaErrorMessage(err: unknown): string {
  const name = (err as { name?: string })?.name ?? "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "카메라·마이크 권한이 거부되었습니다. 주소창 왼쪽 자물쇠 아이콘에서 권한을 '허용'으로 바꾼 뒤 다시 시도해 주세요.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "카메라·마이크를 찾을 수 없습니다. 장치가 연결되어 있는지 확인해 주세요.";
    case "NotReadableError":
      return "다른 프로그램이 카메라를 사용 중입니다. 화상회의·카메라 앱을 모두 종료한 뒤 다시 시도해 주세요.";
    default:
      return "카메라·마이크를 켤 수 없습니다. 브라우저를 새로고침하거나 크롬 최신 버전으로 다시 시도해 주세요.";
  }
}

// ── 스트림 획득 ──────────────────────────────────────────────────

export async function getCamStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
    audio: true,
  });
}

/**
 * 전체 화면 공유 요청. 탭/창만 공유하면 거부한다(치팅 방지의 핵심).
 * displaySurface를 보고하지 않는 브라우저(사파리 등)는 관용 통과.
 */
export async function getScreenStream(): Promise<
  { stream: MediaStream } | { error: "not-monitor" | "denied" }
> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "monitor" } as MediaTrackConstraints,
      audio: false,
    });
    const surface = stream.getVideoTracks()[0]?.getSettings()?.displaySurface;
    if (surface && surface !== "monitor") {
      stream.getTracks().forEach((t) => t.stop());
      return { error: "not-monitor" };
    }
    return { stream };
  } catch {
    return { error: "denied" };
  }
}

/** 듀얼 모니터 감지 (Window Management API — 크롬 계열) */
export function hasExtendedScreens(): boolean {
  try {
    return Boolean((window.screen as { isExtended?: boolean }).isExtended);
  } catch {
    return false;
  }
}

// ── 녹화 ─────────────────────────────────────────────────────────

function pickMime(): string | undefined {
  for (const m of [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ]) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m))
      return m;
  }
  return undefined;
}

export interface ChunkRecorder {
  stop: () => Promise<number>; // 최종 청크 수
  chunkCount: () => number;
}

/**
 * 5초 단위 청크 녹화 시작 — 각 청크를 IndexedDB에 즉시 영속해
 * 브라우저 강제 종료에도 그때까지의 녹화가 남는다.
 */
export function startChunkRecorder(
  sessionId: string,
  kind: RecordingKind,
  stream: MediaStream,
): ChunkRecorder {
  let seq = 0;
  const rec = new MediaRecorder(stream, {
    mimeType: pickMime(),
    videoBitsPerSecond: kind === "cam" ? 500_000 : 1_000_000,
  });
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      void saveChunk(sessionId, kind, seq++, e.data);
    }
  };
  rec.start(5_000);
  return {
    chunkCount: () => seq,
    stop: () =>
      new Promise((resolve) => {
        rec.onstop = () => resolve(seq);
        try {
          rec.stop();
        } catch {
          resolve(seq);
        }
      }),
  };
}

/** <video>의 현재 프레임을 JPEG Blob으로 캡처 (스냅샷·신분 확인 공용) */
export function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      if (!video.videoWidth) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.6);
    } catch {
      resolve(null);
    }
  });
}

// ── 전체화면 ─────────────────────────────────────────────────────

/** 전체화면 진입 (사용자 제스처 필요) — 실패해도 시험은 계속(이벤트만 기록) */
export async function enterFullscreen(el: HTMLElement): Promise<boolean> {
  try {
    await el.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    return false;
  }
}

export function isFullscreen(): boolean {
  return Boolean(document.fullscreenElement);
}

// ── Supabase Storage 업로드 (선택 — env 설정 시) ─────────────────

const BUCKET = "exam-media";

/**
 * 제출 시 조립된 녹화본·신분 사진을 Storage에 업로드한다.
 * 버킷이 없거나 실패해도 응시 제출은 막지 않는다(fire-and-tolerate).
 */
export async function uploadExamMedia(
  sessionId: string,
  files: { path: string; blob: Blob; contentType: string }[],
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || files.length === 0) return false;
  try {
    const results = await Promise.all(
      files.map((f) =>
        sb.storage
          .from(BUCKET)
          .upload(`${sessionId}/${f.path}`, f.blob, {
            contentType: f.contentType,
            upsert: true,
          }),
      ),
    );
    return results.every((r) => !r.error);
  } catch {
    return false;
  }
}

/** HR 검토 화면 — Storage에 업로드된 녹화의 서명 URL (없으면 null) */
export async function remoteRecordingUrl(
  sessionId: string,
  kind: RecordingKind,
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(`${sessionId}/${kind}.webm`, 3600);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
