import type { Metadata } from "next";
import { SEED_INTERVIEWS } from "@/lib/hr/seed";
import { EvalRoom } from "@/components/hr/eval-room";

export const metadata: Metadata = {
  title: "면접 평가 | 아르코에듀 HR",
  description: "면접관 전용 평가 화면 — 로그인 없이 링크로 접속해 평가합니다.",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return SEED_INTERVIEWS.map((iv) => ({ id: iv.id }));
}

export default async function EvalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EvalRoom interviewId={id} />;
}
