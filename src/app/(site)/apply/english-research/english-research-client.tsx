"use client";

import { ApplyTabs } from "@/components/apply/apply-tabs";
import { LoginGate } from "@/components/apply/login-gate";

/**
 * 영어연구원 — 「영어연구원 지원 / 영어연구원 DB 수정」 탭 + 로그인 게이트.
 * 상시 Database(DB) 성격을 강조하고, 탭별 안내 문구를 달리한다.
 */
export function EnglishResearchClient({
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
          brand="global"
          heading={
            active === 0
              ? "영어연구원 DB에 지원서를 등록하세요"
              : "등록한 영어연구원 DB를 불러와 수정하세요"
          }
          intro={
            active === 0 ? (
              <>
                영어연구원 모집은 채용공고 없이도 언제든지 등록 가능한{" "}
                <strong className="font-semibold text-ink">상시 지원 Database</strong>
                입니다. 채용 소요 발생 시 최우선으로 검토하여 적합한 지원자에게
                개별 연락을 드립니다.
              </>
            ) : (
              <>
                로그인 후 기존에 등록한 영어연구원 DB를 불러와 수정합니다. 현재
                진행 중인 채용에 지원을 원하실 경우, 등록된 지원서를 불러온 후 최종
                제출해 주십시오.
              </>
            )
          }
        />
      )}
    </ApplyTabs>
  );
}
