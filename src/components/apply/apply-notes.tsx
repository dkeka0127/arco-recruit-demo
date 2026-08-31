"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { ApplyType } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * 유형별 안내문(리드/※참고/○ 섹션) 렌더러.
 * 정책·안내 문구는 데이터(apply.ts)에서 원문 그대로 받아 1:1 출력.
 * ○ 섹션은 접기/펼치기(아코디언)로 제공하되 기본 펼침 상태.
 */
export function ApplyNotes({ type }: { type: ApplyType }) {
  return (
    <div className="space-y-8">
      {/* ── 리드 문구 ─────────────────────────────────── */}
      {type.lead && type.lead.length > 0 && (
        <div className="rounded-card border border-line bg-pure p-7 sm:p-9">
          <p className="text-lg font-medium leading-relaxed tracking-tight text-ink sm:text-xl">
            {type.lead.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* ── ※ 참고 (notes) ────────────────────────────── */}
      {type.notes && type.notes.length > 0 && (
        <div className="rounded-card border border-accent/30 bg-accent-soft/60 p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-accent-ink" />
            <span className="kicker text-accent-ink">참고</span>
          </div>
          <ul className="mt-4 space-y-2">
            {type.notes.map((note, i) => (
              <li
                key={i}
                className="text-[0.95rem] leading-relaxed text-ink/90"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── ○ 안내 섹션 (아코디언) ─────────────────────── */}
      {type.sections && type.sections.length > 0 && (
        <div className="space-y-3">
          {type.sections.map((sec, i) => (
            <NoteSection key={i} heading={sec.heading} items={sec.items} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteSection({
  heading,
  items,
}: {
  heading: string;
  items: string[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-card border border-line bg-pure">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left transition-colors hover:bg-paper-dim/50"
        aria-expanded={open}
      >
        <span className="text-base font-semibold tracking-tight text-ink">
          {heading}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <ul className="space-y-2.5 border-t border-line px-6 py-5">
            {items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                />
                <span className="text-[0.95rem] leading-relaxed text-muted">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
