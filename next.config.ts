import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // EKS 컨테이너 배포용 — 최소 실행 파일 세트만 출력
  output: "standalone",
  async redirects() {
    const q = (key: string, value: string) => [{ type: "query" as const, key, value }];
    return [
      // 채용공고
      { source: "/remNotice.php", destination: "/jobs/notices", permanent: true },
      { source: "/remNormalList.php", destination: "/jobs/general", permanent: true },
      { source: "/remEngResearchList.php", destination: "/jobs/english-research", permanent: true },
      { source: "/remTeacherList.php", destination: "/jobs/teacher", permanent: true },
      // 입사지원 (act 쿼리 기반)
      { source: "/remApply.php", has: q("act", "main"), destination: "/apply", permanent: true },
      { source: "/remApply.php", has: q("act", "inputForm"), destination: "/apply/general", permanent: true },
      { source: "/remApply.php", has: q("act", "engResearch"), destination: "/apply/english-research", permanent: true },
      { source: "/remApply.php", has: q("act", "inputFormTeacher"), destination: "/apply/teacher", permanent: true },
      { source: "/remApply.php", has: q("act", "registPeople"), destination: "/apply/talent-pool", permanent: true },
      { source: "/remApply.php", has: q("act", "modify"), destination: "/apply/modify", permanent: true },
      { source: "/remApply.php", has: q("act", "checkResult"), destination: "/apply/result", permanent: true },
      { source: "/remApply.php", destination: "/apply", permanent: true },
      // 아르코 피플
      { source: "/remPeople.php", has: q("act", "desirableCandidates"), destination: "/people/values", permanent: true },
      { source: "/remPeople.php", has: q("act", "jobIntroduction"), destination: "/people/jobs", permanent: true },
      { source: "/remPeople.php", has: q("act", "benefits"), destination: "/people/culture", permanent: true },
      { source: "/remPeople.php", destination: "/people", permanent: true },
      // 회사소개
      { source: "/remGroupInfo.php", has: q("act", "groupinfo"), destination: "/company/group", permanent: true },
      { source: "/remGroupInfo.php", has: q("act", "philosophy"), destination: "/company/philosophy", permanent: true },
      { source: "/remGroupInfo.php", has: q("act", "history"), destination: "/company/history", permanent: true },
      { source: "/remGroupInfo.php", has: q("act", "company_divisions"), destination: "/company/business", permanent: true },
      { source: "/remGroupInfo.php", has: q("act", "scholarship"), destination: "/company/scholarship", permanent: true },
      { source: "/remGroupInfo.php", has: q("act", "directions"), destination: "/company/location", permanent: true },
      { source: "/remGroupInfo.php", destination: "/company", permanent: true },
      // FAQ / Q&A
      { source: "/remFaq.php", destination: "/faq", permanent: true },
      { source: "/remQna.php", destination: "/qna", permanent: true },
      // 구 관리자 프로토타입 → HR 콘솔
      { source: "/admin", destination: "/hr", permanent: false },
    ];
  },
};

export default nextConfig;
