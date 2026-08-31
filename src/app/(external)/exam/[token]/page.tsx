import type { Metadata } from "next";
import { SEED_EXAM_SESSIONS } from "@/lib/hr/seed";
import { ExamRoom } from "@/components/hr/exam-room";

export const metadata: Metadata = {
  title: "온라인 필기시험 | 아르코 채용",
  description:
    "아르코 채용 온라인 필기시험 — 카메라·화면 감독 하에 응시합니다.",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return SEED_EXAM_SESSIONS.map((x) => ({ token: x.token }));
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ExamRoom token={token} />;
}
