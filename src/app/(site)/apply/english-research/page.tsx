import type { Metadata } from "next";
import { APPLY_TYPE_MAP } from "@/lib/data/apply";
import { ApplyShell } from "@/components/apply/apply-shell";
import { ApplyNotes } from "@/components/apply/apply-notes";
import { ApplyHighlight } from "@/components/apply/apply-highlight";
import { ApplyCta } from "@/components/apply/apply-cta";
import { EnglishResearchClient } from "./english-research-client";

export const metadata: Metadata = {
  title: "영어연구원 입사지원 | 아르코채용",
  description: "영어연구원 DB에 입사지원서를 등록하거나 수정하실 수 있습니다.",
};

const TYPE = APPLY_TYPE_MAP["english-research"];

export default function EnglishResearchApplyPage() {
  return (
    <main className="bg-paper bg-grid pt-32 sm:pt-40">
      <ApplyShell active="영어연구원 입사지원" banner={TYPE.banner}>
        <div className="space-y-10">
          <ApplyHighlight
            kicker="English Research · Talent Database"
            brand="global"
            title={
              <>
                채용은 언제나 열려 있습니다
                <br />
                영어연구원 상시 지원 DB
              </>
            }
            body="영어연구원 모집은 실제 지원서 제출과 무관한 상시 Database입니다. 미리 등록해 두시면 채용 소요 발생 시 최우선으로 검토하여 적합한 지원자에게 개별 연락을 드립니다. 채용공고가 발생하면 반드시 지원서 제출을 별도로 하셔야 합니다."
            stats={[
              { label: "성격", value: "상시 지원 DB" },
              { label: "등록 조건", value: "공고 없이도 가능" },
            ]}
          />
          <ApplyNotes type={TYPE} />
          <EnglishResearchClient
            tabs={TYPE.tabs ?? []}
            labels={TYPE.loginLabels ?? []}
          />
          <ApplyCta
            title="진행중인 영어연구원 채용에 지원하시려면?"
            desc="현재 진행 중인 채용에 지원을 원하실 경우, 등록된 DB를 불러온 후 채용공고에서 최종 제출해 주십시오."
            primary={{
              label: "영어연구원 채용공고 보기",
              href: "/jobs/english-research",
            }}
          />
        </div>
      </ApplyShell>
    </main>
  );
}
