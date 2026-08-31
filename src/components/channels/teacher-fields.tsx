"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Search } from "lucide-react";
import type { TeacherField } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * 전문강사 모집분야 22개 — 프리미엄 리치 리스트.
 * 분야별 번호 · 카테고리 · 대표 과목 · 모집상태 메타를 노출하고,
 * 클릭 시 content(과목/우대 등 원문)를 펼친다. content 원문은 그대로 보존.
 */

type Category = "어학" | "공무원·임용" | "전문자격" | "진학·취업·기타";

const CATEGORY_STYLE: Record<Category, string> = {
  어학: "bg-accent-soft text-accent-ink",
  "공무원·임용": "bg-ink text-paper",
  전문자격: "border border-accent-ink/30 text-accent-ink",
  "진학·취업·기타": "bg-paper-dim text-muted",
};

/** 분야명 → 카테고리 + 대표 과목(요약 라벨). 원문 content는 별도 보존. */
const FIELD_META: Record<string, { category: Category; lead: string }> = {
  영어: { category: "어학", lead: "TOEIC · TOEFL · GRE · IELTS 외" },
  중국어: { category: "어학", lead: "HSK · TSC · HSKK · BCT 외" },
  일본어: { category: "어학", lead: "JLPT · 회화 · 문법 · 독해" },
  "중·고등영어": { category: "어학", lead: "중등·고등 영어 (문법·독해·어휘)" },
  공무원: { category: "공무원·임용", lead: "9·7급 · 경찰 · 소방 전 과목" },
  로스쿨: { category: "진학·취업·기타", lead: "언어이해 · 추리논증 · 논술 · 면접" },
  공인중개사: { category: "전문자격", lead: "공인중개사 · 주택관리사 · 부동산실무" },
  금융: { category: "전문자격", lead: "AFPK/CFP · 금융투자 · 회계/세무" },
  교원임용: { category: "공무원·임용", lead: "유아·특수·국어·역사·음악·미술 외" },
  편입: { category: "진학·취업·기타", lead: "편입영어 · 편입수학" },
  취업: { category: "진학·취업·기타", lead: "자소서 · 면접 · NCS · 인적성" },
  한국사능력검정: { category: "진학·취업·기타", lead: "심화 · 기본" },
  "기업/대학 출강": {
    category: "어학",
    lead: "TOEIC · OPIc · 비즈니스 회화",
  },
  학점은행: {
    category: "진학·취업·기타",
    lead: "사회복지·아동·경영·심리·청소년학",
  },
  "회계사/세무사": { category: "전문자격", lead: "재무·원가·세무회계 · 상법 · 세법" },
  기사자격증: { category: "전문자격", lead: "전기·정보처리·소방설비 · IT" },
  변호사: { category: "전문자격", lead: "민사법 · 공법 · 형사법 · 선택법" },
  공인노무사: { category: "전문자격", lead: "노동법 · 인사노무 · 경영·경제학" },
  감정평가사: { category: "전문자격", lead: "감정평가실무·이론 · 법규 · 회계" },
  법무사: { category: "전문자격", lead: "헌법 · 민법 · 등기법 · 민사집행법" },
  변리사: { category: "전문자격", lead: "특허·상표·디자인보호법 · 자연과학" },
  행정사: { category: "전문자격", lead: "민법 · 행정법 · 행정사실무법" },
};

const FILTERS: ("전체" | Category)[] = [
  "전체",
  "어학",
  "공무원·임용",
  "전문자격",
  "진학·취업·기타",
];

function metaOf(name: string): { category: Category; lead: string } {
  return FIELD_META[name] ?? { category: "진학·취업·기타", lead: "" };
}

export function TeacherFields({
  fields,
  note,
}: {
  fields: TeacherField[];
  note: string;
}) {
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<"전체" | Category>("전체");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fields
      .map((field, index) => ({ field, index }))
      .filter(({ field }) => {
        const cat = metaOf(field.field).category;
        if (active !== "전체" && cat !== active) return false;
        if (!q) return true;
        return (
          field.field.toLowerCase().includes(q) ||
          metaOf(field.field).lead.toLowerCase().includes(q) ||
          field.content.some((c) => c.toLowerCase().includes(q))
        );
      });
  }, [fields, query, active]);

  return (
    <div>
      {/* 컨트롤 바 — 카운트 · 검색 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-xs tracking-[0.2em] text-muted-ink">
          RECRUITING FIELDS · {String(fields.length).padStart(2, "0")}
        </span>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="분야·과목 검색 (예: TOEIC, 공무원, 변호사)"
            className="h-11 w-full rounded-full border border-line bg-pure pl-11 pr-4 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-accent"
          />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = active === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActive(f)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium tracking-tight transition-colors",
                isActive
                  ? "bg-ink text-paper"
                  : "border border-line bg-pure text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* 리치 리스트 */}
      <div className="mt-7 overflow-hidden rounded-card border border-line bg-pure">
        {filtered.map(({ field, index }, rowIdx) => {
          const isOpen = open === index;
          const meta = metaOf(field.field);
          return (
            <div
              key={index}
              className={cn(
                "transition-colors",
                rowIdx !== 0 && "border-t border-line",
                isOpen && "bg-accent-soft/30",
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-5 py-5 text-left sm:gap-6 sm:px-7"
              >
                <span
                  className={cn(
                    "font-mono text-sm tabular-nums transition-colors",
                    isOpen ? "text-accent-ink" : "text-muted-ink",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-lg font-bold tracking-tight text-ink sm:w-44 sm:shrink-0">
                    {field.field}
                  </span>
                  {meta.lead && (
                    <span className="truncate text-sm text-muted">
                      {meta.lead}
                    </span>
                  )}
                </span>

                <span
                  className={cn(
                    "hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight sm:inline-flex",
                    CATEGORY_STYLE[meta.category],
                  )}
                >
                  {meta.category}
                </span>

                <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-signal lg:inline-flex">
                  <span className="size-1.5 rounded-full bg-signal" />
                  모집중
                </span>

                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border transition-all duration-300",
                    isOpen
                      ? "rotate-45 border-accent bg-accent text-ink"
                      : "border-line text-muted",
                  )}
                >
                  <Plus className="size-4" />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-6 sm:px-7">
                      {/* 모바일에서도 카테고리 노출 */}
                      <span
                        className={cn(
                          "mb-4 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight sm:hidden",
                          CATEGORY_STYLE[meta.category],
                        )}
                      >
                        {meta.category}
                      </span>
                      <ul className="space-y-2.5 border-t border-line pt-5">
                        {field.content.map((line, li) => (
                          <ContentLine key={li} line={line} />
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="px-7 py-12 text-center text-muted">
            ‘{query}’ 에 해당하는 모집분야가 없습니다.
          </p>
        )}
      </div>

      {/* fieldsNote 원문 */}
      <p className="mt-8 whitespace-pre-wrap rounded-card bg-accent-soft px-5 py-4 text-sm leading-relaxed text-accent-ink sm:px-6">
        {note}
      </p>
    </div>
  );
}

/** [우대]/[필수] 머리표를 칩으로 분리해 강조 (원문 텍스트 보존). */
function ContentLine({ line }: { line: string }) {
  const match = line.match(/^\[(우대|필수)\]\s*([\s\S]*)$/);
  if (match) {
    const [, tag, rest] = match;
    return (
      <li className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
        <span
          className={cn(
            "mt-0.5 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            tag === "필수"
              ? "bg-ink text-paper"
              : "bg-accent-soft text-accent-ink",
          )}
        >
          {tag}
        </span>
        <span>{rest}</span>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
      <span>{line}</span>
    </li>
  );
}
