"use client";

import { ApplyTabs } from "@/components/apply/apply-tabs";
import { LoginGate } from "@/components/apply/login-gate";

/**
 * 상시지원(인재DB) — 「인재 DB등록 / 인재 DB수정」 탭 + 로그인 게이트.
 * "공고 없어도 등록" 상시 등록 성격을 강조. 정책 문구는 ApplyNotes에서 1:1 보존.
 */
export function TalentPoolClient({
  tabs,
  labels,
}: {
  tabs: string[];
  labels: string[];
}) {
  return (
    <ApplyTabs tabs={tabs}>
      {(active) => (
        <LoginGate
          labels={labels}
          brand="share"
          heading={
            active === 0
              ? "인재 DB에 지원서를 상시 등록하세요"
              : "등록한 인재 DB를 불러와 수정하세요"
          }
          intro={
            active === 0 ? (
              <>
                인재 DB는{" "}
                <strong className="font-semibold text-ink">
                  채용공고 없이도 언제든지 등록
                </strong>
                할 수 있습니다. 채용 소요 발생 시 최우선으로 검토하여 적합한
                지원자에게 개별 연락을 드립니다. 단, 전문강사 지원은 인재 DB 등록이
                불가합니다.
              </>
            ) : (
              <>
                로그인 후 기존에 등록한 인재 DB를 불러와 수정합니다. 수정 내용은
                마지막 단계인 ‘최종저장’ 버튼을 클릭해야 최종 적용됩니다.
              </>
            )
          }
        />
      )}
    </ApplyTabs>
  );
}
