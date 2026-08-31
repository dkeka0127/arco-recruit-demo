import type { Metadata } from "next";
import { SEED_MEMBERS } from "@/lib/hr/seed";
import { InterviewerPortal } from "@/components/hr/interviewer-portal";

export const metadata: Metadata = {
  title: "면접관 포털 | 아르코에듀 HR",
  description:
    "면접관 전용 워크스페이스 — 배정된 면접 확인, 평가 제출, 진행 공유.",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return SEED_MEMBERS.map((m) => ({ token: m.portalToken }));
}

export default async function InterviewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InterviewerPortal token={token} />;
}
