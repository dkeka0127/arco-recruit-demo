import type { Metadata } from "next";
import { APPLY_TYPE_MAP } from "@/lib/data/apply";
import { ApplyShell } from "@/components/apply/apply-shell";
import { ApplyNotes } from "@/components/apply/apply-notes";
import { ApplyHighlight } from "@/components/apply/apply-highlight";
import { ApplyCta } from "@/components/apply/apply-cta";
import { LoginGate } from "@/components/apply/login-gate";

export const metadata: Metadata = {
  title: "전문강사 입사지원 | 아르코채용",
  description: "전문강사 지원서를 작성하실 수 있습니다.",
};

const TYPE = APPLY_TYPE_MAP["teacher"];

export default function TeacherApplyPage() {
  return (
    <main className="bg-paper bg-grid pt-32 sm:pt-40">
      <ApplyShell active="전문강사 입사지원" banner={TYPE.banner}>
        <div className="space-y-10">
          <ApplyHighlight
            kicker="Instructor"
            brand="campus"
            title={
              <>
                교육에 대한 뜨거운 열정과 전문성을
                <br />
                가진 전문강사를 모십니다
              </>
            }
            body="아르코에듀는 교육에 대한 뜨거운 열정을 지닌 전문강사를 모집합니다. 채용 시 full-time 강의 가능한 전문 강사를 우대하며, 전형결과는 서류합격자에 한해 강사모집 담당자가 우선으로 알려드립니다. 한글·영문 중 편하신 방법으로 작성하실 수 있습니다."
            stats={[
              { label: "우대", value: "Full-time 강의 가능자" },
              { label: "작성 언어", value: "한글 또는 영문" },
            ]}
          />
          <ApplyNotes type={TYPE} />
          <LoginGate
            labels={TYPE.loginLabels ?? []}
            brand="campus"
            heading="전문강사 지원을 시작하세요"
            intro={
              <>
                전문강사 전형이 진행중인 지원자는 일반직·인재DB 지원이 불가능합니다.
                지원서는 한글 또는 영문 중 편하신 방법으로 작성하시면 됩니다.
                (영문 작성에 따른 가산점은 없습니다.)
              </>
            }
          />
          <ApplyCta
            title="전문강사 채용공고가 궁금하신가요?"
            desc="진행중인 전문강사 채용공고와 모집 분야를 확인하고 지원하세요."
            primary={{ label: "전문강사 채용공고 보기", href: "/jobs/teacher" }}
          />
        </div>
      </ApplyShell>
    </main>
  );
}
