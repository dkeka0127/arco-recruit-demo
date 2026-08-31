"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 유형 내 탭 (영어연구원 지원/DB 수정, 인재 DB등록/수정).
 * 탭 라벨은 원문 1:1, 패널은 render prop 으로 주입.
 */
export function ApplyTabs({
  tabs,
  children,
}: {
  tabs: string[];
  /** 활성 탭 인덱스를 받아 해당 패널을 렌더 */
  children: (activeIndex: number) => ReactNode;
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div
        role="tablist"
        className="inline-flex rounded-full border border-line bg-pure p-1"
      >
        {tabs.map((tab, i) => {
          const isActive = i === active;
          return (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(i)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-medium tracking-tight transition-colors",
                isActive
                  ? "bg-ink text-paper"
                  : "text-muted hover:text-ink",
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>
      <div className="mt-7">{children(active)}</div>
    </div>
  );
}
