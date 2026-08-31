"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  PartyPopper,
  CircleAlert,
} from "lucide-react";
import { JOB_POSTINGS } from "@/lib/data/jobs";
import type { ApplicationPayload } from "@/lib/types";
import { submitApplicationToHr, type SubmitOutcome } from "@/lib/hr/receive";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Field, TextInput, TextArea, Select } from "./form-fields";
import { FileDropzone } from "./file-dropzone";
import { currentApplicant } from "@/lib/applicant-auth";
import {
  applicationSchema,
  type ApplicationFormValues,
  type ApplicationFormOutput,
  STEPS,
  type StepField,
  DEFAULT_VALUES,
  EMPTY_EDUCATION,
  EMPTY_EXPERIENCE,
  STORAGE_KEY,
  EDU_STATUS,
} from "./application-schema";

/**
 * 멀티스텝 입사지원서 (데모).
 * 실제 사이트는 로그인 후 작성하지만, 본 폼은 동작하는 데모로 보존한다.
 * - RHF + zod 단계별 검증
 * - localStorage 자동저장/복원
 * - 진행률 표시
 * - 파일 드래그앤드롭(recruit.uploadApplicationFile)
 * - 미리보기 후 submitApplicationToHr 제출 → HR 콘솔 스토어에 실접수
 */
export function ApplyForm({ initialJobId = "" }: { initialJobId?: string }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitOutcome | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const restoredRef = useRef(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    mode: "onBlur",
    defaultValues: { ...DEFAULT_VALUES, jobId: initialJobId },
  });

  const {
    control,
    register,
    handleSubmit,
    trigger,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const eduArray = useFieldArray({ control, name: "educations" });
  const expArray = useFieldArray({ control, name: "experiences" });
  const saveTimer = useRef<number>(0);

  // ── localStorage 복원 (+ 로그인 계정 기본정보 프리필) ──
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // 임시저장이 없으면 로그인 계정의 본인인증 정보로 기본값 채움
      const account = currentApplicant();
      const prefill = account
        ? {
            name: account.name,
            email: account.email,
            phone: account.phone,
            birth: account.birth,
          }
        : {};
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ApplicationFormValues>;
        reset({
          ...DEFAULT_VALUES,
          ...prefill,
          ...parsed,
          jobId: initialJobId || parsed.jobId || "",
        });
      } else if (account) {
        reset({ ...DEFAULT_VALUES, ...prefill, jobId: initialJobId });
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── localStorage 자동저장 (디바운스) ──────────────────
  useEffect(() => {
    const sub = watch((values) => {
      if (typeof window === "undefined") return;
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
          setSavedAt(
            new Date().toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        } catch {
          /* noop */
        }
      }, 600);
    });
    return () => sub.unsubscribe();
  }, [watch]);

  // ── 단계 이동 ─────────────────────────────────────────
  const goNext = async () => {
    const fields = STEPS[step].fields as readonly StepField[];
    const valid = await trigger(fields as Parameters<typeof trigger>[0]);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values: ApplicationFormValues) => {
    setSubmitting(true);
    const out = values as unknown as ApplicationFormOutput;
    const payload: ApplicationPayload = {
      jobId: out.jobId,
      name: out.name,
      email: out.email,
      phone: out.phone,
      birth: out.birth || undefined,
      educations: out.educations,
      experiences: out.experiences,
      coverLetter: out.coverLetter,
      portfolioUrl: out.portfolioUrl || undefined,
      files: out.files,
      agreePrivacy: out.agreePrivacy,
    };
    try {
      // HR 콘솔 스토어에 실제 접수 — 칸반·대시보드·/my에 즉시 나타난다
      const res = await submitApplicationToHr(payload);
      setResult(res);
      // 대기 중인 디바운스 저장까지 끊어야 draft가 되살아나지 않는다
      window.clearTimeout(saveTimer.current);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setSubmitting(false);
    }
  };

  const manualSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getValues()));
      setSavedAt(
        new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      /* noop */
    }
  };

  // ── 제출 완료 화면 ────────────────────────────────────
  if (result) {
    return <SubmittedScreen result={result} />;
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="rounded-card border border-line bg-pure p-6 sm:p-9">
      {/* ── 헤더 + 진행률 ────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="kicker text-accent-ink">지원서 작성 (데모)</span>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {STEPS[step].title}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          {savedAt && (
            <span className="inline-flex items-center gap-1.5">
              <Save className="size-3.5" /> {savedAt} 임시저장됨
            </span>
          )}
          <span className="font-semibold text-ink">
            {step + 1} / {STEPS.length}
          </span>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-paper-dim">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* 단계 인디케이터 */}
      <ol className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              "flex items-center gap-2 text-sm tracking-tight transition-colors",
              i === step
                ? "font-semibold text-ink"
                : i < step
                  ? "text-accent-ink"
                  : "text-muted-ink",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border text-xs",
                i === step
                  ? "border-accent bg-accent text-ink"
                  : i < step
                    ? "border-accent-ink bg-accent-soft text-accent-ink"
                    : "border-line text-muted-ink",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            {s.title}
          </li>
        ))}
      </ol>

      {/* 임시저장 안내 (1시간 정책) */}
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-paper-dim/60 px-4 py-3 text-xs leading-relaxed text-muted">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-accent-ink" />
        지원서 작성 중, 1시간 이상 작업이 없는 경우 임시저장되지 않은 모든 내용이
        삭제되므로 수시로 임시저장을 하시기 바랍니다.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={STEPS[step].id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ── STEP 0 : 기본정보 ─────────────────────── */}
            {step === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="지원공고" required error={errors.jobId?.message}>
                    <Select error={!!errors.jobId} {...register("jobId")}>
                      <option value="">지원하실 공고를 선택하세요</option>
                      {JOB_POSTINGS.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="이름" required error={errors.name?.message}>
                  <TextInput
                    error={!!errors.name}
                    placeholder="홍길동"
                    {...register("name")}
                  />
                </Field>
                <Field label="생년월일" error={errors.birth?.message} hint="예: 1996-03-21">
                  <TextInput
                    error={!!errors.birth}
                    placeholder="YYYY-MM-DD"
                    {...register("birth")}
                  />
                </Field>
                <Field label="이메일" required error={errors.email?.message}>
                  <TextInput
                    error={!!errors.email}
                    type="email"
                    placeholder="name@example.com"
                    {...register("email")}
                  />
                </Field>
                <Field label="연락처" required error={errors.phone?.message}>
                  <TextInput
                    error={!!errors.phone}
                    placeholder="010-1234-5678"
                    {...register("phone")}
                  />
                </Field>
              </div>
            )}

            {/* ── STEP 1 : 학력·경력 ────────────────────── */}
            {step === 1 && (
              <div className="space-y-8">
                {/* 학력 */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-ink">학력</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => eduArray.append({ ...EMPTY_EDUCATION })}
                    >
                      <Plus className="size-4" /> 학력 추가
                    </Button>
                  </div>
                  {typeof errors.educations?.message === "string" && (
                    <p className="mb-3 text-xs font-medium text-accent-ink">
                      {errors.educations.message}
                    </p>
                  )}
                  <div className="space-y-4">
                    {eduArray.fields.map((f, i) => (
                      <div
                        key={f.id}
                        className="rounded-xl border border-line bg-paper-dim/40 p-5"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-semibold text-muted">
                            학력 {i + 1}
                          </span>
                          {eduArray.fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => eduArray.remove(i)}
                              className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent-ink"
                            >
                              <Trash2 className="size-3.5" /> 삭제
                            </button>
                          )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label="학교명"
                            required
                            error={errors.educations?.[i]?.school?.message}
                          >
                            <TextInput
                              error={!!errors.educations?.[i]?.school}
                              placeholder="○○대학교"
                              {...register(`educations.${i}.school`)}
                            />
                          </Field>
                          <Field
                            label="전공"
                            required
                            error={errors.educations?.[i]?.major?.message}
                          >
                            <TextInput
                              error={!!errors.educations?.[i]?.major}
                              placeholder="○○학과"
                              {...register(`educations.${i}.major`)}
                            />
                          </Field>
                          <Field
                            label="학적 상태"
                            required
                            error={errors.educations?.[i]?.status?.message}
                          >
                            <Select
                              error={!!errors.educations?.[i]?.status}
                              {...register(`educations.${i}.status`)}
                            >
                              <option value="">선택</option>
                              {EDU_STATUS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </Select>
                          </Field>
                          <Field
                            label="재학 기간"
                            required
                            error={errors.educations?.[i]?.period?.message}
                          >
                            <TextInput
                              error={!!errors.educations?.[i]?.period}
                              placeholder="2015.03 ~ 2019.02"
                              {...register(`educations.${i}.period`)}
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 경력 */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-ink">
                      경력 <span className="text-sm font-normal text-muted">(선택)</span>
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => expArray.append({ ...EMPTY_EXPERIENCE })}
                    >
                      <Plus className="size-4" /> 경력 추가
                    </Button>
                  </div>
                  {expArray.fields.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line px-5 py-6 text-center text-sm text-muted">
                      경력 사항이 있다면 추가해주세요.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {expArray.fields.map((f, i) => (
                        <div
                          key={f.id}
                          className="rounded-xl border border-line bg-paper-dim/40 p-5"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-muted">
                              경력 {i + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => expArray.remove(i)}
                              className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent-ink"
                            >
                              <Trash2 className="size-3.5" /> 삭제
                            </button>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                              label="회사명"
                              required
                              error={errors.experiences?.[i]?.company?.message}
                            >
                              <TextInput
                                error={!!errors.experiences?.[i]?.company}
                                {...register(`experiences.${i}.company`)}
                              />
                            </Field>
                            <Field
                              label="담당 직무"
                              required
                              error={errors.experiences?.[i]?.role?.message}
                            >
                              <TextInput
                                error={!!errors.experiences?.[i]?.role}
                                {...register(`experiences.${i}.role`)}
                              />
                            </Field>
                            <Field
                              label="근무 기간"
                              required
                              error={errors.experiences?.[i]?.period?.message}
                            >
                              <TextInput
                                error={!!errors.experiences?.[i]?.period}
                                placeholder="2020.01 ~ 2023.12"
                                {...register(`experiences.${i}.period`)}
                              />
                            </Field>
                            <div className="sm:col-span-2">
                              <Field label="주요 업무">
                                <TextArea
                                  rows={2}
                                  placeholder="담당하신 업무를 간단히 적어주세요."
                                  {...register(`experiences.${i}.desc`)}
                                />
                              </Field>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2 : 자기소개 ─────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <Field
                  label="자기소개서"
                  required
                  error={errors.coverLetter?.message}
                  hint="지원 동기와 본인의 강점을 자유롭게 작성해주세요. (30자 이상)"
                >
                  <TextArea
                    error={!!errors.coverLetter}
                    rows={10}
                    placeholder="아르코에듀에 지원하게 된 동기와 본인의 역량을 작성해주세요."
                    {...register("coverLetter")}
                  />
                </Field>
                <Field
                  label="포트폴리오 URL"
                  error={errors.portfolioUrl?.message}
                  hint="GitHub, 노션 등 포트폴리오 링크 (선택)"
                >
                  <TextInput
                    error={!!errors.portfolioUrl}
                    placeholder="https://"
                    {...register("portfolioUrl")}
                  />
                </Field>
              </div>
            )}

            {/* ── STEP 3 : 파일첨부 ─────────────────────── */}
            {step === 3 && (
              <div>
                <p className="mb-4 text-sm leading-relaxed text-muted">
                  이력서·포트폴리오 등 첨부파일을 업로드해주세요. (선택)
                </p>
                <Controller
                  control={control}
                  name="files"
                  render={({ field }) => (
                    <FileDropzone
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}

            {/* ── STEP 4 : 미리보기·제출 ────────────────── */}
            {step === 4 && (
              <ReviewPanel
                values={getValues()}
                agreeError={
                  typeof errors.agreePrivacy?.message === "string"
                    ? errors.agreePrivacy.message
                    : undefined
                }
                onAgreeChange={(v) =>
                  setValue("agreePrivacy", v as unknown as true, {
                    shouldValidate: true,
                  })
                }
                agreed={!!watch("agreePrivacy")}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── 하단 컨트롤 ──────────────────────────────── */}
        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={manualSave}
          >
            <Save className="size-4" /> 임시저장
          </Button>

          <div className="flex gap-3">
            {step > 0 && (
              <Button type="button" variant="outline" size="md" onClick={goPrev}>
                <ArrowLeft className="size-4" /> 이전
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" variant="primary" size="md" onClick={goNext}>
                다음 <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="accent"
                size="md"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> 제출 중...
                  </>
                ) : (
                  "최종제출"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// ── 미리보기 패널 ────────────────────────────────────────
function ReviewPanel({
  values,
  agreed,
  agreeError,
  onAgreeChange,
}: {
  values: ApplicationFormValues;
  agreed: boolean;
  agreeError?: string;
  onAgreeChange: (v: boolean) => void;
}) {
  const job = JOB_POSTINGS.find((j) => j.id === values.jobId);
  return (
    <div className="space-y-6">
      <div className="rounded-card border border-line bg-paper-dim/40 p-6">
        <ReviewRow label="지원공고" value={job?.title ?? "—"} />
        <ReviewRow label="이름" value={values.name || "—"} />
        <ReviewRow label="생년월일" value={values.birth || "—"} />
        <ReviewRow label="이메일" value={values.email || "—"} />
        <ReviewRow label="연락처" value={values.phone || "—"} />
        <ReviewRow
          label="학력"
          value={
            values.educations
              ?.map((e) => `${e.school} ${e.major} (${e.status})`)
              .join(" · ") || "—"
          }
        />
        <ReviewRow
          label="경력"
          value={
            values.experiences && values.experiences.length > 0
              ? values.experiences
                  .map((e) => `${e.company} ${e.role}`)
                  .join(" · ")
              : "—"
          }
        />
        <ReviewRow label="포트폴리오" value={values.portfolioUrl || "—"} />
        <ReviewRow
          label="첨부파일"
          value={
            values.files && values.files.length > 0
              ? values.files.map((f) => f.name).join(", ")
              : "없음"
          }
        />
        <div className="pt-3">
          <p className="text-sm font-medium text-muted">자기소개서</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {values.coverLetter || "—"}
          </p>
        </div>
      </div>

      {/* 정책 안내 */}
      <p className="rounded-xl bg-accent-soft/50 px-4 py-3 text-xs leading-relaxed text-ink/90">
        최종제출 후에는 지원서를 확인/수정할 수 없으니 유의하시기 바랍니다.
      </p>

      {/* 개인정보 동의 */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-pure p-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreeChange(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-accent)]"
        />
        <span className="text-sm leading-relaxed text-ink">
          개인정보 수집·이용 및 인재DB 등록에 동의합니다. 입력하신 정보는 채용
          전형 목적으로만 활용됩니다.
        </span>
      </label>
      {agreeError && (
        <p className="text-xs font-medium text-accent-ink">{agreeError}</p>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-line py-2.5 last:border-0">
      <span className="w-24 shrink-0 text-sm font-medium text-muted">
        {label}
      </span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

// ── 제출 완료 화면 ───────────────────────────────────────
function SubmittedScreen({ result }: { result: SubmitOutcome }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-line bg-pure p-10 text-center sm:p-14"
    >
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-signal/12 text-signal">
        <PartyPopper className="size-8" />
      </span>
      <h3 className="mt-6 text-2xl font-bold tracking-tight text-ink">
        {result.duplicate
          ? "이미 접수된 지원서가 있습니다"
          : "지원서가 정상적으로 제출되었습니다"}
      </h3>
      <p className="mt-3 text-muted">
        접수번호{" "}
        <span className="font-semibold text-ink">{result.applicationId}</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        {result.duplicate
          ? "같은 공고에 접수된 지원서가 있어 기존 접수번호를 안내드립니다."
          : "제출 결과는 「나의 지원결과 확인」에서 조회하실 수 있습니다."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/apply/result" variant="primary" size="md" arrow>
          나의 지원결과 확인
        </Button>
        <Button href="/apply" variant="outline" size="md">
          입사지원 홈으로
        </Button>
      </div>
    </motion.div>
  );
}
