import type { Metadata } from "next";
import { APPLY_TYPE_MAP } from "@/lib/data/apply";
import { ApplyShell } from "@/components/apply/apply-shell";
import { ApplyNotes } from "@/components/apply/apply-notes";
import { ApplyHighlight } from "@/components/apply/apply-highlight";
import { ApplyCta } from "@/components/apply/apply-cta";
import { TalentPoolClient } from "./talent-pool-client";

export const metadata: Metadata = {
  title: "상시지원 (인재 DB 등록) | 아르코채용",
  description:
    "채용공고 없이도 인재 DB에 입사지원서를 상시 등록하거나 수정하실 수 있습니다.",
};

const TYPE = APPLY_TYPE_MAP["talent-pool"];

export default function TalentPoolApplyPage() {
  return (
    <main className="bg-paper bg-grid pt-32 sm:pt-40">
      <ApplyShell active="상시지원 (인재 DB 등록)" banner={TYPE.banner}>
        <div className="space-y-10">
          <ApplyHighlight
            kicker="Talent Pool · Always Open"
            brand="share"
            title={
              <>
                지금 맞는 공고가 없어도 괜찮습니다
                <br />
                인재 DB에 미리 등록하세요
              </>
            }
            body="인재 DB는 실제 지원서 제출과 무관한 상시 지원 Database입니다. 채용공고 없이도 언제든지 등록할 수 있으며, 채용 소요 발생 시 최우선으로 검토하여 적합한 지원자에게 개별 연락을 드립니다. 채용공고가 발생하면 반드시 지원서 제출을 별도로 하셔야 합니다."
            stats={[
              { label: "등록 조건", value: "공고 없이도 가능" },
              { label: "연락", value: "소요 발생 시 개별" },
            ]}
          />
          <ApplyNotes type={TYPE} />
          <TalentPoolClient
            tabs={TYPE.tabs ?? []}
            labels={TYPE.loginLabels ?? []}
          />
          <ApplyCta
            title="진행중인 공고에 바로 지원하고 싶다면?"
            desc="현재 진행 중인 채용에 지원을 원하실 경우, 등록한 인재 DB를 불러온 후 채용공고에서 최종 제출해 주십시오."
            primary={{ label: "진행중인 채용공고 보기", href: "/jobs" }}
            secondary={{ label: "입사지원 홈", href: "/apply" }}
          />
        </div>
      </ApplyShell>
    </main>
  );
}
