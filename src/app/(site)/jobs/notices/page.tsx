import Link from "next/link";
import type { Metadata } from "next";
import { Paperclip } from "lucide-react";
import { NOTICES, NOTICE_HEADER } from "@/lib/data/notices";
import { Container, Kicker } from "@/components/ui/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "공지사항 | 아르코채용",
  description: NOTICE_HEADER.desc,
};

type NoticeItem = (typeof NOTICES)[number];

/** [FAQ] → FAQ, 그 외 → 안내 라벨 */
function labelOf(notice: NoticeItem) {
  return notice.category ?? "안내";
}

export default function NoticesPage() {
  const pinned = NOTICES.filter((n) => n.no === "알림");
  const normal = NOTICES.filter((n) => n.no !== "알림");

  return (
    <main className="pt-32 sm:pt-40">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="bg-sky-veil pb-12 sm:pb-14">
        <Container>
          <Reveal>
            <Kicker>Notice</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6">{NOTICE_HEADER.title}</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {NOTICE_HEADER.desc}
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="bg-paper pb-24 sm:pb-28">
        <Container>
          {/* ── 중요 공지 (상단 강조 카드) ──────────────────── */}
          {pinned.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span className="kicker text-accent-ink">중요 공지</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <RevealGroup
                className="mt-6 grid gap-4 lg:grid-cols-3"
                stagger={0.06}
              >
                {pinned.map((n) => {
                  const hasBody = Boolean(n.body);
                  const card = (
                    <div className="surface-card group flex h-full flex-col rounded-card border-accent/25 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lift">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink">
                          {labelOf(n)}
                        </span>
                        {n.hasAttachment && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-ink">
                            <Paperclip className="size-3" /> 첨부
                          </span>
                        )}
                      </div>
                      <p className="mt-4 line-clamp-2 flex-1 font-semibold leading-snug tracking-tight text-ink">
                        {n.title}
                      </p>
                      <p className="mt-5 font-mono text-xs text-muted">
                        {n.date}
                      </p>
                    </div>
                  );
                  return (
                    <RevealItem key={n.id}>
                      {hasBody ? (
                        <Link href={`/jobs/notices/${n.id}`} className="block h-full">
                          {card}
                        </Link>
                      ) : (
                        card
                      )}
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            </>
          )}

          {/* ── 전체 공지 (얇은 정돈 리스트) ─────────────────── */}
          <div className="mt-16 flex items-center gap-3">
            <span className="kicker text-accent-ink">전체 공지</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <ul className="mt-6 divide-y divide-line border-t border-line">
            {normal.map((n) => (
              <li key={n.id}>
                <NoticeRow notice={n} />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  );
}

function NoticeRow({ notice }: { notice: NoticeItem }) {
  const hasBody = Boolean(notice.body);
  const inner = (
    <div className="flex items-center gap-3 py-4 transition-colors hover:bg-paper-dim/60 sm:gap-4">
      <span className="w-8 shrink-0 text-center font-mono text-sm text-muted-ink">
        {notice.no}
      </span>
      <span className="hidden shrink-0 rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-accent-ink sm:inline-flex">
        {labelOf(notice)}
      </span>
      <p
        className={
          "min-w-0 flex-1 truncate text-[0.95rem] tracking-tight " +
          (notice.highlight ? "font-semibold text-accent-ink" : "text-ink")
        }
      >
        {notice.title}
      </p>
      {notice.hasAttachment && (
        <Paperclip className="size-3.5 shrink-0 text-muted-ink" />
      )}
      <span className="shrink-0 font-mono text-xs text-muted">
        {notice.date}
      </span>
    </div>
  );

  if (hasBody) {
    return (
      <Link href={`/jobs/notices/${notice.id}`} className="group block px-1">
        {inner}
      </Link>
    );
  }
  return <div className="px-1">{inner}</div>;
}
