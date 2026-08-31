import type { Metadata } from "next";
import { MyLiveStatus } from "@/components/my/live-status";

export const metadata: Metadata = {
  title: "지원현황 조회 | 아르코채용",
  description: "지원하신 포지션의 전형 진행 상황을 단계별로 확인하세요.",
};

/**
 * 지원 현황은 HR 콘솔 스토어와 실시간 연동된다.
 * 인사팀이 /hr 에서 단계 이동·공개 설정을 바꾸면 즉시 반영. (데모)
 */
export default function MyPage() {
  return <MyLiveStatus />;
}
