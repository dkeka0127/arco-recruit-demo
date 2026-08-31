import type { Metadata } from "next";
import { APPLY_TYPE_MAP } from "@/lib/data/apply";
import { ApplyShell } from "@/components/apply/apply-shell";
import { ApplyNotes } from "@/components/apply/apply-notes";
import { ApplyHighlight } from "@/components/apply/apply-highlight";
import { ApplyCta } from "@/components/apply/apply-cta";
import { LoginGate } from "@/components/apply/login-gate";

export const metadata: Metadata = {
  title: "입사지원서 수정 | 아르코채용",
  description: "등록한 입사지원서를 확인하고 수정하실 수 있습니다.",
};

const TYPE = APPLY_TYPE_MAP["modify"];

export default function ModifyApplyPage() {
  return (
    <main className="bg-paper bg-grid pt-32 sm:pt-40">
      <ApplyShell active="입사지원서 수정" banner={TYPE.banner}>
        <div className="space-y-10">
          <ApplyHighlight
            kicker="Edit Application"
            brand="content"
            title={
              <>
                임시저장한 지원서를
                <br />
                확인하고 수정하세요
              </>
            }
            body="작성 중 임시저장한 지원서의 확인 및 수정이 가능합니다. 지원서 마지막 단계에서 ‘최종제출’ 버튼을 눌러야 지원서가 제출되며, 최종제출하지 않으면 서류전형 평가대상에 포함되지 않으니 유의하시기 바랍니다."
            stats={[
              { label: "수정 가능", value: "최종제출 전까지" },
              { label: "최종제출 후", value: "수정 불가" },
            ]}
          />
          <ApplyNotes type={TYPE} />
          <LoginGate
            labels={TYPE.loginLabels ?? []}
            brand="content"
            heading="로그인하고 지원서를 확인·수정하세요"
            intro={
              <>
                로그인 후 임시저장한 지원서를 불러와 수정할 수 있습니다. 단,{" "}
                <strong className="font-semibold text-ink">
                  최종제출 후에는 지원서를 수정할 수 없으니
                </strong>{" "}
                유의하시기 바랍니다.
              </>
            }
          />
          <ApplyCta
            title="제출한 지원의 결과가 궁금하신가요?"
            desc="최종제출한 지원서의 전형 진행 상황과 결과는 나의 지원결과 확인에서 조회하실 수 있습니다."
            primary={{ label: "나의 지원결과 확인", href: "/apply/result" }}
            secondary={{ label: "마이페이지", href: "/my" }}
          />
        </div>
      </ApplyShell>
    </main>
  );
}
