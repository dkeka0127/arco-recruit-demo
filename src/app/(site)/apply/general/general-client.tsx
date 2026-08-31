"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { JOB_POSTINGS } from "@/lib/data/jobs";
import { LoginGate } from "@/components/apply/login-gate";
import { ApplyForm } from "@/components/apply/apply-form";

/**
 * 일반직 — 진행중 채용공고 선택 + 로그인 게이트 + "데모 지원서 작성" 멀티스텝 진입.
 * ?job= 쿼리로 초기 지원공고를 선택할 수 있다.
 */
export function GeneralClient({ labels }: { labels: string[] }) {
  const params = useSearchParams();
  const jobParam = params.get("job") ?? "";
  const openCount = JOB_POSTINGS.filter((j) => j.status === "지원하기").length;
  const initialJobId = JOB_POSTINGS.some(
    (j) => j.id === jobParam && j.status === "지원하기",
  )
    ? jobParam
    : "";

  const [jobId, setJobId] = useState(initialJobId);
  const [demoOpen, setDemoOpen] = useState(false);

  if (demoOpen) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setDemoOpen(false)}
          className="text-sm font-medium text-accent-ink hover:underline"
        >
          ← 로그인 화면으로 돌아가기
        </button>
        <ApplyForm key={jobId} initialJobId={jobId} />
      </div>
    );
  }

  return (
    <LoginGate
      labels={labels}
      brand="growth"
      jobId={jobId}
      onJobChange={setJobId}
      onDemo={() => setDemoOpen(true)}
      heading="지원할 공고를 선택하고 지원을 시작하세요"
      intro={
        <>
          현재 진행중인 일반직 채용공고는{" "}
          <strong className="font-semibold text-ink">{openCount}건</strong>입니다.
          우측에서 지원공고를 선택해 로그인하면 입사지원서 작성으로 이어집니다.
          진행중인 여러 채용 분야에 중복 지원은 불가능합니다.
        </>
      }
    />
  );
}
