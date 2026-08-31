import type { Metadata } from "next";
import { SEED_JOBS } from "@/lib/hr/seed";
import { JobReportView } from "@/components/hr/job-report-view";

export const metadata: Metadata = { title: "공고별 리포트" };

export function generateStaticParams() {
  return SEED_JOBS.map((j) => ({ id: j.id }));
}

export default async function JobReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobReportView jobId={id} />;
}
