"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, MessageCircleQuestion, Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { FaqItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const TOPIC_TONE: Record<string, string> = {
  온라인입사지원: "bg-accent-soft text-accent-ink",
  채용일반사항: "bg-signal/12 text-signal",
  채용프로세스: "bg-ink/[0.06] text-ink/80",
};

const PAGE_SIZE = 8;

/**
 * FAQ — 상단 "자주 찾는 질문 5개" + 주제 필터(뱃지 강화)·검색 + 더보기 페이지네이션.
 * 답변은 motion/AnimatePresence로 펼쳐지며, whitespace-pre-line으로 "\n" 보존.
 * 콘텐츠 1:1 보존: 번호(no)·주제(topic)·질문(title)·답변(answer) 모두 원문 그대로.
 */
export function FaqList({
  faqs,
  topics,
  faqButtonLabel,
  featuredNos,
}: {
  faqs: FaqItem[];
  topics: readonly string[];
  faqButtonLabel?: string;
  /** 자주 찾는 질문으로 노출할 no 목록 (없으면 상위 5개) */
  featuredNos?: number[];
}) {
  const [topic, setTopic] = useState<string>("전체");
  const [query, setQuery] = useState("");
  const [openNo, setOpenNo] = useState<number | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const featured = useMemo(() => {
    if (featuredNos && featuredNos.length > 0) {
      const map = new Map(faqs.map((f) => [f.no, f]));
      return featuredNos
        .map((n) => map.get(n))
        .filter((f): f is FaqItem => Boolean(f));
    }
    return faqs.slice(0, 5);
  }, [faqs, featuredNos]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: faqs.length };
    for (const f of faqs) c[f.topic] = (c[f.topic] ?? 0) + 1;
    return c;
  }, [faqs]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => {
      const okTopic = topic === "전체" || f.topic === topic;
      const okQuery =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q);
      return okTopic && okQuery;
    });
  }, [faqs, topic, query]);

  const filtering = query.trim() !== "" || topic !== "전체";
  const shown = results.slice(0, visible);
  const hasMore = visible < results.length;

  function resetView() {
    setOpenNo(null);
    setVisible(PAGE_SIZE);
  }

  return (
    <div>
      {/* ── 자주 찾는 질문 5개 (필터/검색 전, 기본 화면에만) ── */}
      {!filtering && (
        <div className="mb-14">
          <div className="flex items-center gap-3">
            <span className="kicker text-accent-ink">자주 찾는 질문</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {featured.map((f) => (
              <li key={f.no}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenNo(f.no);
                    setVisible((v) => Math.max(v, indexOfNo(results, f.no) + 1));
                    document
                      .getElementById(`faq-item-${f.no}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="surface-card group flex h-full w-full items-start gap-3 rounded-card p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift"
                >
                  <span className="mt-0.5 font-mono text-lg font-bold text-accent-ink">
                    Q{String(f.no).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.95rem] font-semibold leading-snug tracking-tight text-ink">
                      {f.title}
                    </span>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
                        TOPIC_TONE[f.topic] ?? "bg-paper-dim text-muted",
                      )}
                    >
                      {f.topic}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 컨트롤: 주제 칩 + 검색 */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="FAQ 주제"
          className="no-scrollbar flex gap-2 overflow-x-auto"
        >
          {topics.map((t) => {
            const selected = t === topic;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setTopic(t);
                  resetView();
                }}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold tracking-tight transition-colors duration-300",
                  selected
                    ? "bg-ink text-paper"
                    : "border border-line bg-pure text-muted hover:border-accent/40 hover:text-ink",
                )}
              >
                {t}
                <span
                  className={cn(
                    "ml-2 rounded-full px-1.5 py-0.5 font-mono text-[0.65rem]",
                    selected ? "bg-white/15 text-paper/80" : "bg-paper-dim text-muted-ink",
                  )}
                >
                  {counts[t] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetView();
            }}
            placeholder="질문·답변 검색"
            aria-label="질문 및 답변 검색"
            className="h-11 w-full rounded-full border border-line bg-pure pl-11 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-muted-ink focus:border-accent lg:w-72"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                resetView();
              }}
              aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-8 text-sm text-muted">
        총 <span className="font-semibold text-ink">{results.length}</span>개의
        질문
      </p>

      {/* 답변 아코디언 */}
      {results.length > 0 ? (
        <>
          <ul className="mt-6 divide-y divide-line overflow-hidden rounded-card border border-line bg-pure">
            <AnimatePresence initial={false}>
              {shown.map((f) => {
                const open = openNo === f.no;
                const panelId = `faq-panel-${f.no}`;
                const btnId = `faq-btn-${f.no}`;
                return (
                  <motion.li
                    id={`faq-item-${f.no}`}
                    key={f.no}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(open && "bg-paper")}
                  >
                    <h3>
                      <button
                        id={btnId}
                        type="button"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpenNo(open ? null : f.no)}
                        className="group flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-paper sm:px-7"
                      >
                        <span
                          className={cn(
                            "hidden w-10 shrink-0 font-mono text-sm sm:block",
                            open ? "text-accent-ink" : "text-muted-ink",
                          )}
                        >
                          {String(f.no).padStart(2, "0")}
                        </span>
                        <span
                          className={cn(
                            "hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight sm:inline-flex",
                            TOPIC_TONE[f.topic] ?? "bg-paper-dim text-muted",
                          )}
                        >
                          {f.topic}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 flex-1 text-[0.95rem] font-medium leading-relaxed tracking-tight transition-colors",
                            open ? "text-accent-ink" : "text-ink",
                          )}
                        >
                          {f.title}
                        </span>
                        <Plus
                          className={cn(
                            "size-4 shrink-0 transition-transform duration-300",
                            open
                              ? "rotate-45 text-accent-ink"
                              : "text-muted-ink group-hover:text-accent-ink",
                          )}
                        />
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          key="content"
                          id={panelId}
                          role="region"
                          aria-labelledby={btnId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 sm:px-7 sm:pl-[5.5rem]">
                            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                              {f.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-pure px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent/40 hover:bg-paper-dim"
              >
                질문 더보기
                <span className="font-mono text-xs text-muted-ink">
                  +{Math.min(PAGE_SIZE, results.length - visible)}
                </span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-6 flex min-h-[180px] flex-col items-center justify-center rounded-card border border-dashed border-line bg-pure text-center">
          <p className="text-lg font-semibold text-ink">
            조건에 맞는 질문이 없습니다
          </p>
          <p className="mt-2 text-sm text-muted">
            다른 검색어나 주제를 선택해 보세요.
          </p>
          {filtering && (
            <button
              onClick={() => {
                setQuery("");
                setTopic("전체");
                resetView();
              }}
              className="mt-5 rounded-full border border-line px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-dim"
            >
              필터 초기화
            </button>
          )}
        </div>
      )}

      {/* 원하는 답을 못 찾으셨나요? → Q&A 유도 */}
      <div className="mt-10 flex flex-col items-start gap-4 rounded-card border border-line bg-paper-dim p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
            <MessageCircleQuestion className="size-5" />
          </span>
          <div>
            <p className="text-base font-bold tracking-tight text-ink">
              원하는 답을 못 찾으셨나요?
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              자주 묻는 질문 외에 궁금한 점은 Q&amp;A로 문의하시면 인사담당자가
              답변해 드립니다.
            </p>
          </div>
        </div>
        <Link
          href="/qna"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink-700"
        >
          {faqButtonLabel ?? "Q&A로 문의하기"}
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function indexOfNo(list: FaqItem[], no: number) {
  const i = list.findIndex((f) => f.no === no);
  return i < 0 ? 0 : i;
}
