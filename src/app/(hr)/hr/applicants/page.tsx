import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicantsBoard } from "@/components/hr/applicants-board";

export const metadata: Metadata = { title: "지원자 파이프라인" };

export default function ApplicantsPage() {
  return (
    <Suspense>
      <ApplicantsBoard />
    </Suspense>
  );
}
