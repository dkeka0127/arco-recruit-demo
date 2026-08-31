"use client";

// ════════════════════════════════════════════════════════════════
//  안전장치 UI — 확인 다이얼로그 + 되돌리기 토스트.
//  모듈 스토어(useSyncExternalStore)로 어디서든 호출 가능:
//    confirmAction({ title, ... }) → Promise<boolean>
//    toast.show(...) 는 store가 registerToast로 자동 연결
//  <FeedbackHost/>를 HR 셸에 1회 마운트한다.
// ════════════════════════════════════════════════════════════════

import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Undo2, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { hrActions, registerToast } from "@/lib/hr/store";

// ── 확인 다이얼로그 ──────────────────────────────────────────────

export interface ConfirmSpec {
  title: string;
  /** 본문 설명 라인들 */
  lines?: string[];
  /** 상세 정보 표 (라벨→값) — 무엇이 바뀌는지 명시 */
  facts?: { label: string; value: string }[];
  confirmLabel?: string;
  /** 위험(파괴적) 액션이면 빨강 강조 */
  danger?: boolean;
  /** 되돌릴 수 없는 액션 경고 */
  irreversible?: boolean;
}

type ConfirmState =
  | { open: false }
  | { open: true; spec: ConfirmSpec; resolve: (ok: boolean) => void };

let confirmState: ConfirmState = { open: false };
const confirmListeners = new Set<() => void>();
function emitConfirm() {
  confirmListeners.forEach((l) => l());
}

/** 어디서든 호출 — 사용자가 확인/취소할 때까지 대기 */
export function confirmAction(spec: ConfirmSpec): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState = { open: true, spec, resolve };
    emitConfirm();
  });
}

function useConfirmState() {
  return useSyncExternalStore(
    (l) => {
      confirmListeners.add(l);
      return () => confirmListeners.delete(l);
    },
    () => confirmState,
    () => confirmState as ConfirmState,
  );
}

function ConfirmDialog() {
  const state = useConfirmState();

  function close(ok: boolean) {
    if (state.open) state.resolve(ok);
    confirmState = { open: false };
    emitConfirm();
  }

  return (
    <AnimatePresence>
      {state.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
            onClick={() => close(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-md overflow-hidden rounded-card bg-paper shadow-pop"
          >
            <div className="flex items-start gap-3 p-6">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  state.spec.danger
                    ? "bg-ink text-paper"
                    : "bg-accent-soft text-accent-ink",
                )}
              >
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold tracking-tight text-ink">
                  {state.spec.title}
                </h2>
                {state.spec.lines?.map((l) => (
                  <p key={l} className="mt-1.5 text-[0.88rem] leading-relaxed text-muted">
                    {l}
                  </p>
                ))}
                {state.spec.facts && state.spec.facts.length > 0 && (
                  <dl className="mt-3 divide-y divide-line rounded-xl border border-line bg-pure">
                    {state.spec.facts.map((f) => (
                      <div
                        key={f.label}
                        className="flex items-center justify-between gap-3 px-3.5 py-2"
                      >
                        <dt className="text-[0.78rem] text-muted">{f.label}</dt>
                        <dd className="text-[0.82rem] font-semibold text-ink">
                          {f.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {state.spec.irreversible && (
                  <p className="mt-3 rounded-lg bg-ink/6 px-3 py-2 text-[0.78rem] font-semibold text-ink">
                    ⚠ 이 작업은 되돌릴 수 없습니다.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2.5 border-t border-line bg-pure/60 p-4">
              <button
                onClick={() => close(false)}
                className="h-11 flex-1 rounded-full border border-line-strong bg-pure text-sm font-semibold text-ink transition-colors hover:border-ink"
              >
                취소
              </button>
              <button
                onClick={() => close(true)}
                className={cn(
                  "h-11 flex-1 rounded-full text-sm font-bold text-paper transition-colors",
                  state.spec.danger
                    ? "bg-ink hover:bg-ink-700"
                    : "bg-accent text-ink hover:bg-accent-deep hover:text-white",
                )}
              >
                {state.spec.confirmLabel ?? "확인"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── 토스트 (되돌리기) ────────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  undoable: boolean;
}
let toasts: ToastItem[] = [];
let toastSeq = 1;
const toastListeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emitToast() {
  toastListeners.forEach((l) => l());
}
function pushToast(t: Omit<ToastItem, "id">) {
  const id = toastSeq++;
  toasts = [...toasts, { ...t, id }].slice(-3);
  emitToast();
  timers.set(
    id,
    setTimeout(() => dismissToast(id), t.undoable ? 7000 : 4000),
  );
}
function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  emitToast();
}

/** 정보성 토스트 (되돌리기 없음) */
export const toast = {
  show(message: string) {
    pushToast({ message, undoable: false });
  },
};

function useToasts() {
  return useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => toastListeners.delete(l);
    },
    () => toasts,
    () => toasts,
  );
}

function ToastStack() {
  const items = useToasts();
  return (
    <div className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-paper shadow-pop"
          >
            <CheckCircle2 className="size-4 shrink-0 text-accent" />
            <span className="text-[0.85rem] font-medium">{t.message}</span>
            {t.undoable && (
              <button
                onClick={() => {
                  const label = hrActions.undoLastAction();
                  dismissToast(t.id);
                  if (label) toast.show("되돌렸습니다.");
                }}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[0.78rem] font-bold text-accent transition-colors hover:bg-white/20"
              >
                <Undo2 className="size-3.5" /> 되돌리기
              </button>
            )}
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="닫기"
              className="text-white/50 transition-colors hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── 호스트 (셸에 1회 마운트) ────────────────────────────────────

export function FeedbackHost() {
  useEffect(() => {
    // store의 되돌리기 가능 액션 → 토스트 자동 표시
    return registerToast((t) => pushToast(t));
  }, []);
  return (
    <>
      <ConfirmDialog />
      <ToastStack />
    </>
  );
}
