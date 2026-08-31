import type {
  JobPosting,
  JobDetail,
  Notice,
  FaqItem,
  QnaInfo,
  TalentValue,
  JobIntro,
  BenefitBlock,
  EngResearch,
  TeacherRecruit,
  ForeignRecruit,
  ApplyType,
  ApplyMain,
  CompanyGroup,
  CompanyPhilosophy,
  CompanySharing,
  CompanyHistoryYear,
  BusinessCategory,
  BusinessBrand,
  Scholarship,
  Location,
  SiteData,
  ApplicationPayload,
  ApplicationResult,
  ApplicationRecord,
  UploadedFile,
} from "@/lib/types";

import {
  JOB_POSTINGS,
  JOB_POSTINGS_NEW,
  JOB_POSTINGS_INTERN,
  JOB_POSTINGS_CAREER,
  JOB_DETAILS,
} from "@/lib/data/jobs";
import { NOTICES } from "@/lib/data/notices";
import { FAQS, QNA } from "@/lib/data/faq";
import {
  TALENT_VALUES,
  JOB_INTROS,
  BENEFIT_BLOCKS,
} from "@/lib/data/people";
import {
  ENG_RESEARCH,
  TEACHER_RECRUIT,
  FOREIGN_RECRUIT,
} from "@/lib/data/channels";
import { APPLY_TYPES, APPLY_MAIN } from "@/lib/data/apply";
import {
  COMPANY_GROUP,
  COMPANY_PHILOSOPHY,
  COMPANY_SHARING,
  COMPANY_HISTORY,
  BUSINESS_CATEGORIES,
  BUSINESS_BRANDS,
  SCHOLARSHIP,
  LOCATION,
} from "@/lib/data/company";
import { SITE } from "@/lib/data/site";

/**
 * 백엔드 비종속 추상화 레이어.
 * 지금은 MockProvider. 추후 SupabaseProvider / LegacyAdapter로 교체 가능.
 */
export interface RecruitProvider {
  // 일반직 채용공고
  getJobs(): Promise<JobPosting[]>;
  getGeneralJobs(filter?: "전체" | "신입" | "경력" | "인턴"): Promise<JobPosting[]>;
  getJobDetail(id: string): Promise<JobDetail | null>;

  // 공지 / FAQ / Q&A
  getNotices(): Promise<Notice[]>;
  getNotice(id: string): Promise<Notice | null>;
  getFaqs(): Promise<FaqItem[]>;
  getQna(): Promise<QnaInfo>;

  // 아르코 피플
  getValues(): Promise<TalentValue[]>;
  getJobIntros(): Promise<JobIntro[]>;
  getJobIntro(id: string): Promise<JobIntro | null>;
  getBenefits(): Promise<BenefitBlock[]>;

  // 채널
  getEngResearch(): Promise<EngResearch>;
  getTeacherRecruit(): Promise<TeacherRecruit>;
  getForeignRecruit(): Promise<ForeignRecruit>;

  // 입사지원
  getApplyMain(): Promise<ApplyMain>;
  getApplyTypes(): Promise<ApplyType[]>;
  getApplyType(key: string): Promise<ApplyType | null>;

  // 회사소개
  getCompanyGroup(): Promise<CompanyGroup>;
  getCompanyPhilosophy(): Promise<CompanyPhilosophy>;
  getCompanySharing(): Promise<CompanySharing>;
  getCompanyHistory(): Promise<CompanyHistoryYear[]>;
  getBusinessCategories(): Promise<BusinessCategory[]>;
  getBusinessBrands(): Promise<BusinessBrand[]>;
  getScholarship(): Promise<Scholarship>;
  getLocation(): Promise<Location>;

  // 사이트 공통
  getSite(): Promise<SiteData>;

  // 지원 처리 / 마이페이지
  submitApplication(payload: ApplicationPayload): Promise<ApplicationResult>;
  uploadApplicationFile(file: File): Promise<UploadedFile>;
  getMyApplications(): Promise<ApplicationRecord[]>;
}

const wait = (ms: number) =>
  new Promise((r) => setTimeout(r, process.env.NODE_ENV === "test" ? 0 : ms));

class MockProvider implements RecruitProvider {
  async getJobs(): Promise<JobPosting[]> {
    return JOB_POSTINGS;
  }

  async getGeneralJobs(
    filter: "전체" | "신입" | "경력" | "인턴" = "전체",
  ): Promise<JobPosting[]> {
    switch (filter) {
      case "신입":
        return JOB_POSTINGS_NEW;
      case "경력":
        return JOB_POSTINGS_CAREER;
      case "인턴":
        return JOB_POSTINGS_INTERN;
      default:
        return JOB_POSTINGS;
    }
  }

  async getJobDetail(id: string): Promise<JobDetail | null> {
    return JOB_DETAILS[id] ?? null;
  }

  async getNotices(): Promise<Notice[]> {
    return NOTICES;
  }

  async getNotice(id: string): Promise<Notice | null> {
    return NOTICES.find((n) => n.id === id) ?? null;
  }

  async getFaqs(): Promise<FaqItem[]> {
    return FAQS;
  }

  async getQna(): Promise<QnaInfo> {
    return QNA;
  }

  async getValues(): Promise<TalentValue[]> {
    return TALENT_VALUES;
  }

  async getJobIntros(): Promise<JobIntro[]> {
    return JOB_INTROS;
  }

  async getJobIntro(id: string): Promise<JobIntro | null> {
    return JOB_INTROS.find((j) => j.id === id) ?? null;
  }

  async getBenefits(): Promise<BenefitBlock[]> {
    return BENEFIT_BLOCKS;
  }

  async getEngResearch(): Promise<EngResearch> {
    return ENG_RESEARCH;
  }

  async getTeacherRecruit(): Promise<TeacherRecruit> {
    return TEACHER_RECRUIT;
  }

  async getForeignRecruit(): Promise<ForeignRecruit> {
    return FOREIGN_RECRUIT;
  }

  async getApplyMain(): Promise<ApplyMain> {
    return APPLY_MAIN;
  }

  async getApplyTypes(): Promise<ApplyType[]> {
    return APPLY_TYPES;
  }

  async getApplyType(key: string): Promise<ApplyType | null> {
    return APPLY_TYPES.find((t) => t.key === key) ?? null;
  }

  async getCompanyGroup(): Promise<CompanyGroup> {
    return COMPANY_GROUP;
  }

  async getCompanyPhilosophy(): Promise<CompanyPhilosophy> {
    return COMPANY_PHILOSOPHY;
  }

  async getCompanySharing(): Promise<CompanySharing> {
    return COMPANY_SHARING;
  }

  async getCompanyHistory(): Promise<CompanyHistoryYear[]> {
    return COMPANY_HISTORY;
  }

  async getBusinessCategories(): Promise<BusinessCategory[]> {
    return BUSINESS_CATEGORIES;
  }

  async getBusinessBrands(): Promise<BusinessBrand[]> {
    return BUSINESS_BRANDS;
  }

  async getScholarship(): Promise<Scholarship> {
    return SCHOLARSHIP;
  }

  async getLocation(): Promise<Location> {
    return LOCATION;
  }

  async getSite(): Promise<SiteData> {
    return SITE;
  }

  async submitApplication(payload: ApplicationPayload): Promise<ApplicationResult> {
    await wait(900);
    return {
      applicationId: `ARC-${payload.jobId.toUpperCase()}-${Math.floor(
        100000 + Math.random() * 899999,
      )}`,
      status: "submitted",
      submittedAt: new Date().toISOString(),
    };
  }

  async uploadApplicationFile(file: File): Promise<UploadedFile> {
    await wait(700);
    return {
      id: `f-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: "#",
    };
  }

  async getMyApplications(): Promise<ApplicationRecord[]> {
    return MOCK_APPLICATIONS;
  }
}

export const recruit: RecruitProvider = new MockProvider();

// ── 마이페이지 목업 지원 현황 ─────────────────────────────────
const MOCK_APPLICATIONS: ApplicationRecord[] = [
  {
    applicationId: "ARC-AI-FULLSTACK-204815",
    jobId: "ai-fullstack",
    jobTitle: "[경력][개발] AI 풀스택개발자 채용",
    team: "아르코에듀",
    submittedAt: "2026-06-10T09:24:00Z",
    status: "면접진행",
    timeline: [
      { label: "접수완료", date: "2026-06-10", done: true },
      { label: "서류검토", date: "2026-06-12", done: true },
      { label: "서류합격", date: "2026-06-16", done: true },
      { label: "면접진행", date: "2026-06-24", done: true },
      { label: "최종발표", date: null, done: false },
    ],
  },
  {
    applicationId: "ARC-TEXTBOOK-SALES-118203",
    jobId: "textbook-sales",
    jobTitle: "[신입/경력][기획] 교재 영업사원 채용",
    team: "아르코에듀",
    submittedAt: "2026-06-05T13:10:00Z",
    status: "서류검토",
    timeline: [
      { label: "접수완료", date: "2026-06-05", done: true },
      { label: "서류검토", date: "2026-06-08", done: true },
      { label: "서류발표", date: null, done: false },
      { label: "면접진행", date: null, done: false },
      { label: "최종발표", date: null, done: false },
    ],
  },
];
