import type { Metadata } from "next";
import { SEED_APPLICATIONS } from "@/lib/hr/seed";
import { ApplicantDetail } from "@/components/hr/applicant-detail";

export const metadata: Metadata = { title: "지원자 상세" };

export function generateStaticParams() {
  return SEED_APPLICATIONS.map((a) => ({ id: a.id }));
}

export default async function ApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicantDetail id={id} />;
}
