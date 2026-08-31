import type { Metadata } from "next";
import { HrJobs } from "@/components/hr/jobs";

export const metadata: Metadata = { title: "공고 관리" };

export default function HrJobsPage() {
  return <HrJobs />;
}
