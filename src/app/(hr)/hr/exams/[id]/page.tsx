import type { Metadata } from "next";
import { SEED_EXAM_SESSIONS } from "@/lib/hr/seed";
import { ExamReview } from "@/components/hr/exam-review";

export const metadata: Metadata = { title: "필기시험 채점" };

export function generateStaticParams() {
  return SEED_EXAM_SESSIONS.map((x) => ({ id: x.id }));
}

export default async function ExamReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExamReview id={id} />;
}
