import type { Metadata } from "next";
import { HrExams } from "@/components/hr/exams";

export const metadata: Metadata = { title: "필기시험" };

export default function HrExamsPage() {
  return <HrExams />;
}
