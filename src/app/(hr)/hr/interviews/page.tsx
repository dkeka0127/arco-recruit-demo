import type { Metadata } from "next";
import { HrInterviews } from "@/components/hr/interviews";

export const metadata: Metadata = { title: "면접 일정" };

export default function HrInterviewsPage() {
  return <HrInterviews />;
}
