"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LoginGate } from "@/components/apply/login-gate";

/**
 * 나의 지원결과 확인 — 지원공고 선택 + 로그인하여 결과 조회.
 * 로그인된 사용자는 마이페이지(/my)에서 전형 현황을 확인할 수 있도록 연결.
 */
export function ResultGate({ labels }: { labels: string[] }) {
  const [jobId, setJobId] = useState("");

  return (
    <LoginGate
      labels={labels}
      brand="people"
      jobId={jobId}
      onJobChange={setJobId}
      heading="지원공고를 선택하고 결과를 조회하세요"
      intro="조회하실 지원공고를 우측에서 선택한 뒤 로그인하시면 해당 전형의 결과를 확인하실 수 있습니다. 전문강사·상시지원(인재DB) 지원자는 합격자에 한해 우선으로 개별 통보됩니다."
      extra={
        <Link
          href="/my"
          className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-pure px-4 py-3.5 transition-colors hover:border-accent/40 hover:bg-paper-dim/60"
        >
          <span>
            <span className="block text-[0.9rem] font-semibold text-ink">
              이미 로그인하셨나요?
            </span>
            <span className="block text-xs text-muted">
              나의 지원현황을 마이페이지에서 확인
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-accent-ink transition-transform group-hover:translate-x-1" />
        </Link>
      }
    />
  );
}
