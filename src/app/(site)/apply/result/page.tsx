import type { Metadata } from "next";
import { APPLY_TYPE_MAP } from "@/lib/data/apply";
import { ApplyShell } from "@/components/apply/apply-shell";
import { ApplyNotes } from "@/components/apply/apply-notes";
import { ApplyHighlight } from "@/components/apply/apply-highlight";
import { ApplyCta } from "@/components/apply/apply-cta";
import { ResultGate } from "./result-gate";

export const metadata: Metadata = {
  title: "나의 지원결과 확인 | 아르코채용",
  description: "나의 지원결과 및 합격여부를 조회하실 수 있습니다.",
};

const TYPE = APPLY_TYPE_MAP["result"];

export default function ResultApplyPage() {
  return (
    <main className="bg-paper bg-grid pt-32 sm:pt-40">
      <ApplyShell active="나의지원결과 확인" banner={TYPE.banner}>
        <div className="space-y-10">
          <ApplyHighlight
            kicker="My Result"
            brand="people"
            title={
              <>
                지원한 공고를 선택하고
                <br />
                전형 결과를 조회하세요
              </>
            }
            body="본인이 지원한 채용공고를 선택한 후 로그인하면 전형 결과 및 합격여부를 조회할 수 있습니다. 채용분야별 해당 전형의 합격자 발표가 있을 때 확인하실 수 있습니다."
            stats={[
              { label: "조회 방법", value: "공고 선택 → 로그인" },
              { label: "전문강사·상시", value: "개별 통보" },
            ]}
          />
          <ApplyNotes type={TYPE} />
          <ResultGate labels={TYPE.loginLabels ?? []} />
          <ApplyCta
            title="전형 현황을 한눈에 보고 싶다면?"
            desc="나의 지원현황과 전형 진행 상황을 마이페이지에서 한 번에 확인하세요."
            primary={{ label: "마이페이지로 이동", href: "/my" }}
            secondary={{ label: "입사지원 홈", href: "/apply" }}
          />
        </div>
      </ApplyShell>
    </main>
  );
}
