import type { Metadata } from "next";
import { Suspense } from "react";
import { APPLY_TYPE_MAP } from "@/lib/data/apply";
import { ApplyShell } from "@/components/apply/apply-shell";
import { ApplyNotes } from "@/components/apply/apply-notes";
import { ApplyHighlight } from "@/components/apply/apply-highlight";
import { ApplyCta } from "@/components/apply/apply-cta";
import { GeneralClient } from "./general-client";

export const metadata: Metadata = {
  title: "일반직 입사지원 | 아르코채용",
  description:
    "진행중인 채용공고를 선택하고 일반직 입사지원서를 작성하실 수 있습니다.",
};

const TYPE = APPLY_TYPE_MAP["general"];

export default function GeneralApplyPage() {
  return (
    <main className="bg-paper bg-grid pt-32 sm:pt-40">
      <ApplyShell active="일반직 입사지원" banner={TYPE.banner}>
        <div className="space-y-10">
          <ApplyHighlight
            kicker="General"
            brand="growth"
            title={
              <>
                올바른 교육철학을 실천하는 아르코에듀에서
                <br />
                함께 성장할 일반직 인재를 찾습니다
              </>
            }
            body="진행중인 채용공고 중 하나를 선택해 지원합니다. 지원 분야의 상세 채용공고를 반드시 확인하시고, 진행중인 여러 분야에 중복 지원은 불가능합니다."
            stats={[
              { label: "지원 방식", value: "공고 선택 → 작성" },
              { label: "중복 지원", value: "불가" },
            ]}
          />
          <ApplyNotes type={TYPE} />
          <Suspense fallback={null}>
            <GeneralClient labels={TYPE.loginLabels ?? []} />
          </Suspense>
          <ApplyCta
            title="원하는 공고를 아직 못 찾으셨나요?"
            desc="진행중인 일반직 채용공고 전체를 둘러보고 지원할 분야를 선택하세요."
            primary={{ label: "일반직 채용공고 보기", href: "/jobs/general" }}
            secondary={{ label: "직무소개 보기", href: "/people" }}
          />
        </div>
      </ApplyShell>
    </main>
  );
}
