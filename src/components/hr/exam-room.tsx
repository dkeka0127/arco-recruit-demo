"use client";

// ════════════════════════════════════════════════════════════════
//  필기시험 응시 화면 (/exam/[token]) — 프로그래머스식 웹 프록터링.
//  동의 → 장비 점검(캠·마이크·전체 화면 공유)·신분 확인 → 전체화면 응시.
//  응시 중: 캠+화면 녹화(IndexedDB 청크), 주기 스냅샷, 탭 이탈·전체화면
//  이탈·복붙 차단·공유 중단 감지 → 전부 이벤트로 기록, 한도 초과 시
//  자동 제출. 답안은 자동 저장되어 새로고침에도 이어서 응시된다.
// ════════════════════════════════════════════════════════════════

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import {
  ShieldCheck,
  Camera,
  Monitor,
  Clock,
  TriangleAlert,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  Maximize2,
  Info,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useHrState,
  hrActions,
  examSessionByToken,
  examSpecOf,
} from "@/lib/hr/store";
import { supabaseEnabled } from "@/lib/hr/supabase";
import {
  orderedQuestions,
  examEndsAt,
  QUESTION_TYPE_LABEL,
} from "@/lib/hr/exam";
import {
  getCamStream,
  getScreenStream,
  hasExtendedScreens,
  startChunkRecorder,
  captureFrame,
  saveSnapshot,
  enterFullscreen,
  isFullscreen,
  assembleRecording,
  listSnapshots,
  uploadExamMedia,
  checkEnv,
  mediaErrorMessage,
  type ChunkRecorder,
} from "@/lib/hr/proctor";
import { confirmAction, FeedbackHost } from "@/components/hr/feedback";
import type { ExamQuestion, ExamEventType } from "@/lib/hr/types";

type Phase = "intro" | "check" | "exam";
type Overlay = null | "fullscreen" | "screen-lost" | "camera-lost";

const SNAPSHOT_INTERVAL_MS = 20_000;

// 렌더 순수성 규칙 밖 (모듈 스코프)
const nowMs = () => Date.now();
const emptySubscribe = () => () => {};

function fmtRemain(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

export function ExamRoom({ token }: { token: string }) {
  const s = useHrState();
  const session = examSessionByToken(s, token);
  const template = session ? examSpecOf(s, session) : undefined;
  const job = s.jobs.find(
    (j) =>
      j.id ===
      s.applications.find((a) => a.id === session?.applicationId)?.jobId,
  );
  const candidate = s.candidates.find(
    (c) =>
      c.id ===
      s.applications.find((a) => a.id === session?.applicationId)?.candidateId,
  );

  const [phase, setPhase] = useState<Phase>("intro");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);

  // 장비 상태
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // 응시 상태
  const [qIdx, setQIdx] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(nowMs);
  const [violations, setViolations] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const checkVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const camRec = useRef<ChunkRecorder | null>(null);
  const screenRec = useRef<ChunkRecorder | null>(null);
  const snapSeq = useRef(1); // 0 = 신분 확인 사진
  const fsActive = useRef(false);
  const submittingRef = useRef(false);
  const violationsRef = useRef(0);
  // 디바운스 저장 대기 중인 최신 입력값 — 제출 직전 flush해 유실 방지
  const pendingRef = useRef<Record<string, { selected?: number[]; text?: string }>>({});

  const sessionId = session?.id;
  const policy = template?.proctor;
  const questions = useMemo(
    () => (template && session ? orderedQuestions(template, session.id) : []),
    [template, session],
  );
  const q: ExamQuestion | undefined = questions[qIdx];
  const answerOf = useCallback(
    (qid: string) => session?.answers.find((a) => a.questionId === qid),
    [session],
  );

  const expired =
    session &&
    session.status === "발급" &&
    new Date(session.expiresAt).getTime() < now;

  // 기한 경과 세션은 만료 상태로 마킹
  useEffect(() => {
    if (expired && sessionId) hrActions.markExamExpired(sessionId);
  }, [expired, sessionId]);

  // 환경 점검 — 실제 브라우저에서만 판정 (SSR 하이드레이션 불일치 회피).
  // useSyncExternalStore: 서버 false → 클라 true, effect 내 setState 없이.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const envBlock =
    mounted && template
      ? (() => {
          const r = checkEnv(Boolean(template.proctor.screen));
          return r.ok ? null : (r.reason ?? "지원하지 않는 환경입니다.");
        })()
      : null;

  // 비디오 엘리먼트에 스트림 연결
  useEffect(() => {
    if (checkVideoRef.current && camStream)
      checkVideoRef.current.srcObject = camStream;
    if (pipVideoRef.current && camStream)
      pipVideoRef.current.srcObject = camStream;
  }, [camStream, phase]);

  // ── 위반 기록 (이탈·차단 이벤트 공용) ─────────────────────────
  const logViolation = useCallback(
    (type: ExamEventType, detail?: string) => {
      if (!sessionId || submittingRef.current) return;
      hrActions.logExamEvent(sessionId, type, detail);
      violationsRef.current += 1;
      setViolations(violationsRef.current);
    },
    [sessionId],
  );

  // ── 제출 (직접·시간초과·위반한도 공용) ────────────────────────
  const finishExam = useCallback(
    async (reason: "직접제출" | "시간초과" | "위반한도") => {
      if (!sessionId || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);

      // 디바운스 대기 중이던 답안을 제출 전에 확정 저장 (아직 status "진행중")
      for (const [qid, val] of Object.entries(pendingRef.current)) {
        hrActions.saveExamAnswer(sessionId, { questionId: qid, ...val });
      }
      pendingRef.current = {};

      const camN = camRec.current ? await camRec.current.stop() : 0;
      const scrN = screenRec.current ? await screenRec.current.stop() : 0;
      hrActions.updateExamRecording(sessionId, {
        camChunks: camN,
        screenChunks: scrN,
        snapshots: snapSeq.current - 1,
      });

      // Supabase 모드: 조립본을 Storage에 업로드 (실패해도 제출은 진행)
      if (supabaseEnabled) {
        try {
          const files: { path: string; blob: Blob; contentType: string }[] = [];
          const cam = await assembleRecording(sessionId, "cam");
          if (cam) files.push({ path: "cam.webm", blob: cam, contentType: "video/webm" });
          const scr = await assembleRecording(sessionId, "screen");
          if (scr) files.push({ path: "screen.webm", blob: scr, contentType: "video/webm" });
          const snaps = await listSnapshots(sessionId);
          if (snaps[0])
            files.push({ path: "id.jpg", blob: snaps[0].blob, contentType: "image/jpeg" });
          const ok = await uploadExamMedia(sessionId, files);
          if (ok) hrActions.updateExamRecording(sessionId, { uploaded: true });
        } catch {
          // 업로드 실패는 무시 — 로컬 IndexedDB에 원본이 남는다
        }
      }

      hrActions.submitExam(sessionId, reason);
      camStream?.getTracks().forEach((t) => t.stop());
      screenStream?.getTracks().forEach((t) => t.stop());
      if (isFullscreen()) void document.exitFullscreen().catch(() => {});
      setOverlay(null);
    },
    [sessionId, camStream, screenStream],
  );

  // ── 응시 중 프록터링 이벤트 배선 ──────────────────────────────
  useEffect(() => {
    if (phase !== "exam" || !sessionId || !policy) return;

    const onVisibility = () => {
      if (document.hidden) logViolation("탭이탈");
      else hrActions.logExamEvent(sessionId, "탭복귀");
    };
    const onFullscreen = () => {
      if (fsActive.current && !isFullscreen() && !submittingRef.current) {
        logViolation("전체화면이탈");
        setOverlay("fullscreen");
      }
    };
    const blocked =
      (type: ExamEventType) => (e: Event) => {
        if (!policy.blockCopyPaste) return;
        e.preventDefault();
        logViolation(type);
      };
    const onCopy = blocked("복사시도");
    const onPaste = blocked("붙여넣기시도");
    const onCut = blocked("복사시도");
    const onContext = blocked("우클릭차단");
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submittingRef.current) e.preventDefault();
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContext);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContext);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [phase, sessionId, policy, logViolation]);

  // 위반 한도 초과 → 자동 제출
  useEffect(() => {
    if (
      phase === "exam" &&
      policy &&
      violations > policy.maxViolations &&
      !submittingRef.current
    ) {
      void finishExam("위반한도");
    }
  }, [violations, phase, policy, finishExam]);

  // 스트림 중단 감지 (공유 중지 버튼·카메라 뽑기)
  useEffect(() => {
    if (phase !== "exam") return;
    const st = screenStream?.getVideoTracks()[0];
    const ct = camStream?.getVideoTracks()[0];
    if (st)
      st.onended = () => {
        if (submittingRef.current) return;
        logViolation("화면공유중단");
        setOverlay("screen-lost");
      };
    if (ct)
      ct.onended = () => {
        if (submittingRef.current) return;
        logViolation("카메라중단");
        setOverlay("camera-lost");
      };
    return () => {
      if (st) st.onended = null;
      if (ct) ct.onended = null;
    };
  }, [phase, screenStream, camStream, logViolation]);

  // 타이머 + 주기 스냅샷
  useEffect(() => {
    if (phase !== "exam") return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const snap = setInterval(() => {
      const v = pipVideoRef.current;
      if (!v || !sessionId) return;
      void captureFrame(v).then((blob) => {
        if (!blob) return;
        const seq = snapSeq.current++;
        void saveSnapshot(sessionId, seq, { at: new Date().toISOString(), blob });
        hrActions.updateExamRecording(sessionId, { snapshots: seq });
      });
    }, SNAPSHOT_INTERVAL_MS);
    return () => {
      clearInterval(tick);
      clearInterval(snap);
    };
  }, [phase, sessionId]);

  // 시간 초과 → 자동 제출
  const endsAt = session && template ? examEndsAt(session, template) : 0;
  useEffect(() => {
    if (
      phase === "exam" &&
      endsAt > 0 &&
      now >= endsAt &&
      !submittingRef.current
    ) {
      void finishExam("시간초과");
    }
  }, [phase, now, endsAt, finishExam]);

  // ── 장비 점검 핸들러 ──────────────────────────────────────────
  async function requestCam() {
    setCheckError(null);
    try {
      const stream = await getCamStream();
      setCamStream(stream);
    } catch (err) {
      setCheckError(mediaErrorMessage(err));
    }
  }

  async function requestScreen() {
    setCheckError(null);
    const r = await getScreenStream();
    if ("error" in r) {
      setCheckError(
        r.error === "not-monitor"
          ? "탭이나 창이 아닌 '전체 화면'을 공유해야 합니다. 다시 시도해 주세요."
          : "화면 공유가 거부되었습니다. 화면 공유 없이는 응시할 수 없습니다.",
      );
      return;
    }
    setScreenStream(r.stream);
  }

  async function captureIdPhoto() {
    const v = checkVideoRef.current;
    if (!v || !sessionId) return;
    const blob = await captureFrame(v);
    if (!blob) return;
    await saveSnapshot(sessionId, 0, { at: new Date().toISOString(), blob });
    setIdPhotoUrl(URL.createObjectURL(blob));
  }

  const camReady = !policy?.camera || Boolean(camStream);
  const screenReady = !policy?.screen || Boolean(screenStream);
  const idReady = !policy?.camera || Boolean(idPhotoUrl);
  const allReady = camReady && screenReady && idReady;

  async function startExam() {
    if (!sessionId || !template || !allReady) return;
    if (policy?.fullscreen && rootRef.current) {
      fsActive.current = await enterFullscreen(rootRef.current);
    }
    hrActions.startExamSession(sessionId);
    if (idPhotoUrl) {
      hrActions.logExamEvent(sessionId, "신분확인");
      hrActions.updateExamRecording(sessionId, { idPhoto: true });
    }
    hrActions.logExamEvent(sessionId, "장비점검완료");
    if (hasExtendedScreens())
      hrActions.logExamEvent(sessionId, "다중모니터감지", "모니터 2대 이상");
    if (camStream)
      camRec.current = startChunkRecorder(sessionId, "cam", camStream);
    if (screenStream)
      screenRec.current = startChunkRecorder(sessionId, "screen", screenStream);
    if (camStream || screenStream)
      hrActions.logExamEvent(
        sessionId,
        "녹화시작",
        [camStream && "캠", screenStream && "화면"].filter(Boolean).join("+"),
      );
    setNow(nowMs());
    setPhase("exam");
  }

  // 제출 — 미응답 문항이 있으면 경고 후 진행
  async function submitWithCheck() {
    if (submittingRef.current) return;
    const answered = (qid: string) => {
      const draft = pendingRef.current[qid];
      const a = draft ?? answerOf(qid);
      return a && ((a.selected?.length ?? 0) > 0 || (a.text ?? "").trim() !== "");
    };
    const unanswered = questions.filter((qq) => !answered(qq.id));
    const ok = await confirmAction({
      title:
        unanswered.length > 0
          ? `미응답 ${unanswered.length}문항이 있습니다`
          : "시험을 제출할까요?",
      lines:
        unanswered.length > 0
          ? [
              `${questions.length}문항 중 ${unanswered.length}문항이 비어 있습니다.`,
              "제출 후에는 수정할 수 없습니다. 그대로 제출할까요?",
            ]
          : ["제출 후에는 답안을 수정할 수 없습니다."],
      confirmLabel: "제출",
      danger: unanswered.length > 0,
    });
    if (ok) void finishExam("직접제출");
  }

  // 오버레이 복구 액션
  async function recoverFullscreen() {
    if (rootRef.current) {
      fsActive.current = await enterFullscreen(rootRef.current);
      if (fsActive.current && sessionId)
        hrActions.logExamEvent(sessionId, "전체화면복귀");
    }
    setOverlay(null);
  }
  async function recoverScreen() {
    const r = await getScreenStream();
    if ("error" in r || !sessionId) return;
    setScreenStream(r.stream);
    screenRec.current = startChunkRecorder(sessionId, "screen", r.stream);
    setOverlay(null);
  }
  async function recoverCam() {
    try {
      const stream = await getCamStream();
      setCamStream(stream);
      if (sessionId)
        camRec.current = startChunkRecorder(sessionId, "cam", stream);
      setOverlay(null);
    } catch {
      /* 재시도 대기 */
    }
  }

  // ── 가드 화면 ─────────────────────────────────────────────────
  if (!session || !template) {
    return (
      <GateScreen
        icon={<TriangleAlert className="size-7" />}
        title="유효하지 않은 응시 링크입니다"
        desc="링크가 만료되었거나 취소되었을 수 있습니다. 안내 메일의 링크를 다시 확인하거나 인사팀에 문의해 주세요."
      />
    );
  }
  if (session.status === "제출" || session.status === "채점완료") {
    return (
      <GateScreen
        icon={<CircleCheck className="size-7 text-signal" />}
        title="시험이 제출되었습니다"
        desc={`${template.title} 응시가 완료되었습니다. 결과는 채점 후 개별 안내드립니다. 녹화·활동 기록이 함께 제출되었습니다.`}
      />
    );
  }
  if (session.status === "만료" || expired) {
    return (
      <GateScreen
        icon={<Clock className="size-7" />}
        title="응시 기한이 지났습니다"
        desc={`이 시험의 응시 기한(${session.expiresAt.slice(0, 10)})이 지났습니다. 재응시가 필요하면 인사팀에 문의해 주세요.`}
      />
    );
  }
  // 응시 중이 아닌데 환경이 부적합하면 시작 자체를 막는다 (진행 중이면 통과)
  if (envBlock && phase === "intro" && session.status !== "진행중") {
    return (
      <GateScreen
        icon={<TriangleAlert className="size-7" />}
        title="이 기기·브라우저로는 응시할 수 없습니다"
        desc={envBlock}
      />
    );
  }

  const resuming = session.status === "진행중";
  const remaining = endsAt > 0 ? endsAt - now : template.durationMin * 60_000;
  const answeredCount = questions.filter((qq) => {
    const a = answerOf(qq.id);
    return a && ((a.selected?.length ?? 0) > 0 || (a.text ?? "").trim() !== "");
  }).length;

  return (
    <div ref={rootRef} className="min-h-dvh bg-paper text-ink">
      {/* ── 인트로: 안내 + 동의 ── */}
      {phase === "intro" && (
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-5 py-12">
          <p className="flex items-center gap-2 font-mono text-[0.72rem] font-semibold tracking-widest text-accent-ink">
            <ShieldCheck className="size-4" /> ARCO ONLINE TEST
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
            {template.title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {job?.title} · {candidate?.name ?? "지원자"} 님
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <InfoTile label="시험 시간" value={`${template.durationMin}분`} />
            <InfoTile label="문항 수" value={`${template.questions.length}문항`} />
            <InfoTile
              label="응시 기한"
              value={session.expiresAt.slice(5, 10).replace("-", "/")}
            />
          </div>

          {resuming && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-accent-soft p-4 text-sm text-accent-ink">
              <Info className="mt-0.5 size-4 shrink-0" />
              진행 중이던 시험입니다. 장비 점검 후 남은 시간 동안 이어서
              응시합니다. (작성한 답안은 저장되어 있습니다)
            </div>
          )}

          <div className="mt-7 surface-card rounded-card p-5">
            <p className="text-[0.82rem] font-bold">응시 유의사항</p>
            <ul className="mt-3 flex flex-col gap-2 text-[0.82rem] leading-relaxed text-muted">
              <li>· 시험 전 과정에서 <b className="text-ink">카메라·마이크{policy?.screen ? "·전체 화면" : ""}이 녹화</b>되며, 채점·부정행위 검토 목적으로만 사용됩니다.</li>
              <li>· 전체화면 이탈, 탭 전환, 복사·붙여넣기는 모두 기록되며 <b className="text-ink">경고 {policy?.maxViolations}회 초과 시 자동 제출</b>됩니다.</li>
              <li>· 조용한 독립 공간에서 혼자 응시하세요. 타인 개입·검색·메신저 사용은 부정행위로 간주됩니다.</li>
              <li>· 크롬(Chrome) 최신 버전 사용을 권장합니다. 시험 시작 후 새로고침해도 이어서 응시됩니다.</li>
            </ul>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm">
            <input type="checkbox" checked={agree1} onChange={(e) => setAgree1(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-accent)]" />
            (필수) 영상·음성·화면 녹화 및 응시 기록 수집에 동의합니다.
          </label>
          <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm">
            <input type="checkbox" checked={agree2} onChange={(e) => setAgree2(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-accent)]" />
            (필수) 유의사항을 확인했으며 부정행위 시 불이익에 동의합니다.
          </label>

          <button
            onClick={() => setPhase("check")}
            disabled={!agree1 || !agree2}
            className="mt-7 rounded-full bg-ink px-8 py-3.5 text-sm font-bold text-paper transition-all hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            장비 점검 시작 →
          </button>
        </div>
      )}

      {/* ── 장비 점검 + 신분 확인 ── */}
      {phase === "check" && (
        <div className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-5 py-12">
          <h2 className="text-2xl font-extrabold tracking-tight">장비 점검</h2>
          <p className="mt-1.5 text-sm text-muted">
            아래 항목을 모두 완료하면 시험이 시작됩니다. 시작과 동시에 녹화가
            시작됩니다.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="surface-card overflow-hidden rounded-card">
              <div className="aspect-video bg-ink">
                <video
                  ref={checkVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                <CheckRow
                  ok={Boolean(camStream)}
                  icon={<Camera className="size-4" />}
                  label="카메라·마이크"
                  action={
                    !camStream && (
                      <SmallBtn onClick={requestCam}>켜기</SmallBtn>
                    )
                  }
                />
                {policy?.camera && (
                  <CheckRow
                    ok={Boolean(idPhotoUrl)}
                    icon={<UserCheck className="size-4" />}
                    label="신분 확인 촬영 (정면 얼굴)"
                    action={
                      camStream && (
                        <SmallBtn onClick={captureIdPhoto}>
                          {idPhotoUrl ? "다시 촬영" : "촬영"}
                        </SmallBtn>
                      )
                    }
                  />
                )}
                {policy?.screen && (
                  <CheckRow
                    ok={Boolean(screenStream)}
                    icon={<Monitor className="size-4" />}
                    label="전체 화면 공유 (탭·창 불가)"
                    action={
                      !screenStream && (
                        <SmallBtn onClick={requestScreen}>공유</SmallBtn>
                      )
                    }
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {idPhotoUrl && (
                <div className="surface-card rounded-card p-4">
                  <p className="text-[0.72rem] font-bold text-muted">신분 확인 사진</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={idPhotoUrl}
                    alt="신분 확인"
                    className="mt-2 aspect-video w-full rounded-lg object-cover"
                  />
                </div>
              )}
              {hasExtendedScreens() && (
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-4 text-[0.82rem] text-amber-800">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  모니터가 2대 이상 감지되었습니다. 보조 모니터는 끄거나 연결을
                  해제해 주세요. 감지 기록은 시험 기록에 남습니다.
                </div>
              )}
              {checkError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-4 text-[0.82rem] text-red-700">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  {checkError}
                </div>
              )}
              <div className="flex items-start gap-2.5 rounded-xl bg-paper-dim p-4 text-[0.78rem] text-muted">
                <Maximize2 className="mt-0.5 size-4 shrink-0" />
                시험 시작을 누르면 전체화면으로 전환됩니다. 전체화면을 벗어나면
                경고가 기록됩니다.
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <button
              onClick={startExam}
              disabled={!allReady}
              className="rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {resuming ? "이어서 응시하기" : "시험 시작"} →
            </button>
            {!allReady && (
              <p className="text-[0.78rem] text-muted-ink">
                모든 점검 항목을 완료해야 시작할 수 있습니다.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── 응시 화면 ── */}
      {phase === "exam" && q && (
        <div className="flex min-h-dvh flex-col">
          {/* 헤더: 타이머 + 진행 */}
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-ink-700 bg-ink px-5 py-3 text-paper">
            <span className="flex items-center gap-2 font-mono text-[0.72rem] font-semibold tracking-widest text-accent">
              <ShieldCheck className="size-4" /> 감독 중
            </span>
            <span className="hidden text-[0.82rem] font-semibold tracking-tight sm:block">
              {template.title}
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[0.78rem] text-paper/60">
              {answeredCount}/{questions.length} 답변
            </span>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-sm font-bold tabular-nums",
                remaining < 5 * 60_000
                  ? "bg-red-500/20 text-red-300"
                  : "bg-white/10 text-paper",
              )}
            >
              <Clock className="size-4" /> {fmtRemain(remaining)}
            </span>
            <button
              onClick={() => void submitWithCheck()}
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[0.8rem] font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white disabled:opacity-50"
            >
              <Send className="size-3.5" /> {submitting ? "제출 중…" : "제출"}
            </button>
          </header>

          <div className="mx-auto flex w-full max-w-5xl flex-1 gap-6 px-5 py-6">
            {/* 문항 네비게이션 */}
            <aside className="hidden w-44 shrink-0 md:block">
              <p className="text-[0.7rem] font-bold text-muted">문항</p>
              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {questions.map((qq, i) => {
                  const a = answerOf(qq.id);
                  const answered =
                    a && ((a.selected?.length ?? 0) > 0 || (a.text ?? "").trim() !== "");
                  return (
                    <button
                      key={qq.id}
                      onClick={() => setQIdx(i)}
                      className={cn(
                        "relative flex h-9 items-center justify-center rounded-lg border font-mono text-[0.78rem] font-semibold transition-colors",
                        i === qIdx
                          ? "border-ink bg-ink text-paper"
                          : answered
                            ? "border-accent bg-accent-soft text-accent-ink"
                            : "border-line bg-pure text-muted hover:border-line-strong",
                      )}
                    >
                      {i + 1}
                      {flagged.has(qq.id) && (
                        <Flag className="absolute -right-1 -top-1 size-3 fill-amber-400 text-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
              {violations > 0 && (
                <div className="mt-5 rounded-xl bg-red-50 p-3 text-[0.72rem] leading-relaxed text-red-700">
                  <b>경고 {violations}회</b> / 한도 {policy?.maxViolations}회
                  <br />
                  초과 시 자동 제출됩니다.
                </div>
              )}
            </aside>

            {/* 문항 본문 */}
            <main className="min-w-0 flex-1">
              <div className="surface-card rounded-card p-6">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[0.68rem] font-bold text-paper">
                    Q{qIdx + 1}
                  </span>
                  <span className="rounded-full bg-paper-dim px-2.5 py-1 text-[0.68rem] font-semibold text-muted">
                    {QUESTION_TYPE_LABEL[q.type]}
                  </span>
                  <span className="text-[0.72rem] font-semibold text-muted-ink">
                    {q.points}점
                  </span>
                  <button
                    onClick={() =>
                      setFlagged((prev) => {
                        const next = new Set(prev);
                        if (next.has(q.id)) next.delete(q.id);
                        else next.add(q.id);
                        return next;
                      })
                    }
                    className={cn(
                      "ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold transition-colors",
                      flagged.has(q.id)
                        ? "bg-amber-100 text-amber-700"
                        : "bg-paper-dim text-muted hover:text-ink",
                    )}
                  >
                    <Flag className="size-3" /> 나중에
                  </button>
                </div>

                <p className="mt-5 select-none whitespace-pre-wrap text-[0.95rem] font-semibold leading-relaxed">
                  {q.prompt}
                </p>
                {q.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.imageUrl}
                    alt="문항 이미지"
                    draggable={false}
                    className="mt-4 max-h-80 select-none rounded-xl border border-line"
                  />
                )}

                <div className="mt-6">
                  <QuestionInput
                    key={q.id}
                    question={q}
                    sessionId={session.id}
                    initial={answerOf(q.id)}
                    onDraft={(partial) => {
                      pendingRef.current[q.id] = partial;
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setQIdx((i) => Math.max(0, i - 1))}
                  disabled={qIdx === 0}
                  className="flex items-center gap-1 rounded-full border border-line bg-pure px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:border-line-strong disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" /> 이전
                </button>
                <button
                  onClick={() =>
                    setQIdx((i) => Math.min(questions.length - 1, i + 1))
                  }
                  disabled={qIdx === questions.length - 1}
                  className="flex items-center gap-1 rounded-full border border-line bg-pure px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:border-line-strong disabled:opacity-40"
                >
                  다음 <ChevronRight className="size-4" />
                </button>
              </div>
            </main>
          </div>

          {/* 캠 PiP */}
          {camStream && (
            <div className="fixed bottom-4 right-4 z-30 overflow-hidden rounded-xl border-2 border-ink/80 shadow-lift">
              <video
                ref={pipVideoRef}
                autoPlay
                muted
                playsInline
                className="h-24 w-32 bg-ink object-cover"
              />
              <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[0.55rem] font-bold text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                REC
              </span>
            </div>
          )}

          {/* 위반 오버레이 */}
          {overlay && !submitting && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/95 px-5">
              <div className="max-w-md text-center text-paper">
                <TriangleAlert className="mx-auto size-10 text-amber-400" />
                <h3 className="mt-4 text-xl font-extrabold tracking-tight">
                  {overlay === "fullscreen" && "전체화면을 벗어났습니다"}
                  {overlay === "screen-lost" && "화면 공유가 중단되었습니다"}
                  {overlay === "camera-lost" && "카메라가 중단되었습니다"}
                </h3>
                <p className="mt-2 text-sm text-paper/70">
                  이 이탈은 시험 기록에 남았습니다 (경고 {violations}/
                  {policy?.maxViolations}회). 한도를 초과하면 자동 제출됩니다.
                </p>
                <button
                  onClick={
                    overlay === "fullscreen"
                      ? recoverFullscreen
                      : overlay === "screen-lost"
                        ? recoverScreen
                        : recoverCam
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white"
                >
                  <RefreshCw className="size-4" />
                  {overlay === "fullscreen" && "전체화면으로 돌아가기"}
                  {overlay === "screen-lost" && "전체 화면 다시 공유"}
                  {overlay === "camera-lost" && "카메라 다시 켜기"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 확인 모달·토스트 — (external) 라우트엔 HR 셸이 없어 여기서 마운트 */}
      <FeedbackHost />
    </div>
  );
}

// ── 답안 입력 (유형별) — 로컬 상태 + 자동 저장 ───────────────────

function QuestionInput({
  question: q,
  sessionId,
  initial,
  onDraft,
}: {
  question: ExamQuestion;
  sessionId: string;
  initial?: { selected?: number[]; text?: string };
  /** 디바운스 저장 전 최신 입력값을 부모에 알린다 (제출 직전 flush용) */
  onDraft: (partial: { selected?: number[]; text?: string }) => void;
}) {
  const [text, setText] = useState(
    initial?.text ?? (q.type === "코딩" ? (q.starterCode ?? "") : ""),
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = initial?.selected ?? [];

  function saveSelected(next: number[]) {
    onDraft({ selected: next });
    hrActions.saveExamAnswer(sessionId, { questionId: q.id, selected: next });
  }
  function onText(v: string) {
    setText(v);
    onDraft({ text: v });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      hrActions.saveExamAnswer(sessionId, { questionId: q.id, text: v });
    }, 600);
  }
  // 언마운트(문항 이동) 시 즉시 저장
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        hrActions.saveExamAnswer(sessionId, { questionId: q.id, text });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (q.type === "단일선택" || q.type === "다중선택") {
    return (
      <div className="flex flex-col gap-2">
        {(q.options ?? []).map((opt, i) => {
          const on = selected.includes(i);
          return (
            <button
              key={i}
              onClick={() =>
                saveSelected(
                  q.type === "단일선택"
                    ? [i]
                    : on
                      ? selected.filter((x) => x !== i)
                      : [...selected, i].sort((a, b) => a - b),
                )
              }
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[0.88rem] transition-colors",
                on
                  ? "border-accent bg-accent-soft font-semibold text-accent-ink"
                  : "border-line bg-pure text-ink hover:border-line-strong",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center border text-[0.62rem] font-bold",
                  q.type === "단일선택" ? "rounded-full" : "rounded-md",
                  on
                    ? "border-accent bg-accent text-white"
                    : "border-line-strong text-muted-ink",
                )}
              >
                {on ? "✓" : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
        {q.type === "다중선택" && (
          <p className="text-[0.7rem] text-muted-ink">
            해당하는 항목을 모두 선택하세요.
          </p>
        )}
      </div>
    );
  }

  if (q.type === "단답") {
    return (
      <input
        value={text}
        onChange={(e) => onText(e.target.value)}
        placeholder="답을 입력하세요"
        className="w-full rounded-xl border border-line bg-pure px-4 py-3 text-[0.88rem] outline-none transition-colors focus:border-accent"
      />
    );
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={q.type === "코딩" ? 14 : 10}
        placeholder={q.type === "코딩" ? "// 코드를 작성하세요" : "답안을 작성하세요"}
        spellCheck={false}
        className={cn(
          "w-full resize-y rounded-xl border border-line bg-pure px-4 py-3 text-[0.85rem] leading-relaxed outline-none transition-colors focus:border-accent",
          q.type === "코딩" && "bg-ink font-mono text-[0.8rem] text-paper",
        )}
      />
      <p className="mt-1.5 text-right text-[0.68rem] text-muted-ink">
        {text.trim().length.toLocaleString()}자 · 자동 저장됨
      </p>
    </div>
  );
}

// ── 소품 ─────────────────────────────────────────────────────────

function GateScreen({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-5">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-paper-dim text-muted-ink">
          {icon}
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">{desc}</p>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-card p-4">
      <p className="text-[0.68rem] font-semibold text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

function CheckRow({
  ok,
  icon,
  label,
  action,
}: {
  ok: boolean;
  icon: React.ReactNode;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[0.82rem]">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full",
          ok ? "bg-signal/12 text-signal" : "bg-paper-dim text-muted-ink",
        )}
      >
        {ok ? <CircleCheck className="size-4" /> : icon}
      </span>
      <span className={cn("font-semibold", ok ? "text-ink" : "text-muted")}>
        {label}
      </span>
      <span className="ml-auto">{action}</span>
    </div>
  );
}

function SmallBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-ink px-3.5 py-1.5 text-[0.72rem] font-bold text-paper transition-colors hover:bg-ink-800"
    >
      {children}
    </button>
  );
}
