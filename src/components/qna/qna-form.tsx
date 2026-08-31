"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, CheckCircle2, Lock, Send } from "lucide-react";
import type { QnaInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Q&A 문의 폼 — QNA 원문(라벨/안내/개인정보 문구/동의/버튼)을 1:1 보존.
 * 목업 제출: 실제 전송 없이 완료 상태만 표시한다.
 */
export function QnaForm({ qna }: { qna: QnaInfo }) {
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree || submitting) return;
    setSubmitting(true);
    // 목업 제출 — 실제 전송 없음
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 900);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-5 rounded-lg border border-line bg-pure px-6 py-20 text-center shadow-lift"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-signal/12 text-signal">
          <CheckCircle2 className="size-8" />
        </span>
        <div>
          <p className="text-xl font-bold tracking-tight text-ink">
            문의가 접수되었습니다
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            등록하신 채용관련 문의사항은 아르코에듀 인사담당자에게
            전달됩니다. 입력하신 이메일로 답변드리겠습니다.
          </p>
        </div>
        <button
          onClick={() => {
            setDone(false);
            setAgree(false);
          }}
          className="mt-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-dim"
        >
          새 문의 작성
        </button>
        <p className="text-xs text-muted-ink">
          본 폼은 데모용 목업입니다. 실제로 전송되지 않습니다.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-lg border border-line bg-pure shadow-lift"
    >
      {/* 입력 필드 (원문 라벨) */}
      <div className="flex flex-col gap-6 p-6 sm:p-9">
        {qna.fields.map((field) => {
          const isTextarea = field.label === "내용입력";
          return (
            <div key={field.label} className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-tight text-ink">
                {field.label}
                <span className="ml-1 text-accent-ink">*</span>
              </label>
              {isTextarea ? (
                <textarea
                  rows={7}
                  required
                  placeholder={`${field.label}란에 내용을 입력해 주세요.`}
                  className="w-full resize-y rounded-card border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-muted-ink focus:border-accent focus:bg-pure"
                />
              ) : (
                <input
                  type="text"
                  required
                  placeholder={`${field.label}을(를) 입력해 주세요.`}
                  className="h-12 w-full rounded-card border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted-ink focus:border-accent focus:bg-pure"
                />
              )}
              {field.hint && (
                <p className="text-xs leading-relaxed text-muted-ink">
                  {field.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 개인정보 수집·이용 (원문) */}
      <div className="border-t border-line bg-paper-dim p-6 sm:p-9">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-accent-ink" />
          <p className="text-sm font-bold tracking-tight text-ink">
            {qna.privacyTitle}
          </p>
        </div>
        <div className="no-scrollbar mt-4 max-h-40 overflow-y-auto rounded-card border border-line bg-pure p-5">
          <ul className="flex flex-col gap-2.5">
            {qna.privacyItems.map((item, i) => (
              <li
                key={i}
                className="text-sm leading-relaxed text-muted"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 동의 체크 (원문 라벨) */}
        <button
          type="button"
          onClick={() => setAgree((v) => !v)}
          aria-pressed={agree}
          className="mt-5 flex items-center gap-3 text-left"
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
              agree
                ? "border-accent bg-accent text-ink"
                : "border-line-strong bg-pure text-transparent",
            )}
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span className="text-sm font-medium tracking-tight text-ink">
            {qna.agreeLabel}
          </span>
        </button>
      </div>

      {/* 제출 (원문 버튼 라벨) */}
      <div className="flex items-center justify-end gap-4 border-t border-line p-6 sm:p-9">
        <AnimatePresence>
          {!agree && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-ink"
            >
              개인정보 수집 및 이용에 동의해 주세요.
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="submit"
          disabled={!agree || submitting}
          className={cn(
            "group inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-medium tracking-tight transition-all duration-300",
            agree && !submitting
              ? "bg-accent text-ink hover:bg-accent-deep hover:text-white"
              : "cursor-not-allowed bg-paper-dim text-muted-ink",
          )}
        >
          {submitting ? (
            "전송 중…"
          ) : (
            <>
              <Send className="size-4 transition-transform group-hover:translate-x-0.5" />
              {qna.submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
