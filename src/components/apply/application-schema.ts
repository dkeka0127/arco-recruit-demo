import { z } from "zod";

/**
 * 데모 입사지원서 스키마 (RHF + zod).
 * ApplicationPayload(types.ts) 와 호환되는 형태로 정의한다.
 */

export const educationSchema = z.object({
  school: z.string().min(1, "학교명을 입력하세요."),
  major: z.string().min(1, "전공을 입력하세요."),
  status: z.string().min(1, "학적 상태를 선택하세요."),
  period: z.string().min(1, "재학 기간을 입력하세요."),
});

export const experienceSchema = z.object({
  company: z.string().min(1, "회사명을 입력하세요."),
  role: z.string().min(1, "담당 직무를 입력하세요."),
  period: z.string().min(1, "근무 기간을 입력하세요."),
  desc: z.string().optional().default(""),
});

export const uploadedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string().optional(),
});

export const applicationSchema = z.object({
  jobId: z.string().min(1, "지원공고를 선택하세요."),
  // 기본정보
  name: z.string().min(1, "이름을 입력하세요."),
  email: z.string().min(1, "이메일을 입력하세요.").email("올바른 이메일 형식이 아닙니다."),
  phone: z
    .string()
    .min(1, "연락처를 입력하세요.")
    .regex(/^[0-9-]{9,}$/, "숫자와 하이픈(-)만 입력하세요."),
  birth: z.string().optional().default(""),
  // 학력·경력
  educations: z.array(educationSchema).min(1, "최소 1개의 학력을 입력하세요."),
  experiences: z.array(experienceSchema).default([]),
  // 자기소개
  coverLetter: z.string().min(30, "자기소개서는 30자 이상 작성해주세요."),
  portfolioUrl: z
    .string()
    .optional()
    .default("")
    .refine(
      (v) => !v || /^https?:\/\/.+/.test(v),
      "http(s):// 로 시작하는 URL을 입력하세요.",
    ),
  // 파일첨부
  files: z.array(uploadedFileSchema).default([]),
  // 미리보기·제출
  agreePrivacy: z.literal(true, {
    message: "개인정보 수집·이용에 동의해야 제출할 수 있습니다.",
  }),
});

export type ApplicationFormValues = z.input<typeof applicationSchema>;
export type ApplicationFormOutput = z.output<typeof applicationSchema>;

/** 단계 정의 — 각 단계에서 검증할 필드 키 */
export const STEPS = [
  {
    id: "basic",
    title: "기본정보",
    fields: ["jobId", "name", "email", "phone", "birth"],
  },
  {
    id: "career",
    title: "학력·경력",
    fields: ["educations", "experiences"],
  },
  {
    id: "letter",
    title: "자기소개",
    fields: ["coverLetter", "portfolioUrl"],
  },
  {
    id: "files",
    title: "파일첨부",
    fields: ["files"],
  },
  {
    id: "review",
    title: "미리보기·제출",
    fields: ["agreePrivacy"],
  },
] as const;

export type StepField = (typeof STEPS)[number]["fields"][number];

export const EMPTY_EDUCATION = {
  school: "",
  major: "",
  status: "",
  period: "",
};

export const EMPTY_EXPERIENCE = {
  company: "",
  role: "",
  period: "",
  desc: "",
};

export const DEFAULT_VALUES: ApplicationFormValues = {
  jobId: "",
  name: "",
  email: "",
  phone: "",
  birth: "",
  educations: [{ ...EMPTY_EDUCATION }],
  experiences: [],
  coverLetter: "",
  portfolioUrl: "",
  files: [],
  agreePrivacy: false as unknown as true,
};

export const STORAGE_KEY = "talent-os:apply-draft";
export const EDU_STATUS = ["졸업", "졸업예정", "재학", "중퇴", "수료"] as const;
