import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { NOTICES } from "@/lib/data/notices";
import type { NoticeBlock } from "@/lib/types";
import { Container, Kicker } from "@/components/ui/primitives";

export function generateStaticParams() {
  return NOTICES.filter((n) => n.body).map((n) => ({ id: n.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const notice = NOTICES.find((n) => n.id === id);
  if (!notice) return { title: "공지를 찾을 수 없습니다 | 아르코채용" };
  return {
    title: `${notice.title} | 아르코채용`,
    description: notice.body?.title ?? notice.title,
  };
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = NOTICES.find((n) => n.id === id);
  if (!notice || !notice.body) notFound();

  const { body } = notice;

  return (
    <main className="pt-32 sm:pt-40">
      <section className="bg-paper pb-24 sm:pb-28">
        <Container size="narrow">
          <Link
            href="/jobs/notices"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" /> 공지사항
          </Link>

          <div className="mt-8 border-b border-line pb-8">
            {notice.category && (
              <Kicker>{notice.category}</Kicker>
            )}
            <h1 className="mt-5 text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">
              {body.title}
            </h1>
            <p className="mt-4 text-sm text-muted">
              {body.date ?? notice.date}
            </p>
          </div>

          <article className="mt-10 space-y-6">
            {body.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </article>
        </Container>
      </section>
    </main>
  );
}

function Block({ block }: { block: NoticeBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className="pt-4 text-lg font-bold tracking-tight text-ink">
          {block.text}
        </h2>
      );
    case "paragraph":
      return (
        <p className="leading-relaxed text-muted">{block.text}</p>
      );
    case "list":
      return (
        <ul className="space-y-3 rounded-card border border-line bg-pure p-6">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 leading-relaxed text-muted">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      );
    case "button":
      return (
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-700"
        >
          {block.label}
        </button>
      );
    case "note":
      return (
        <div className="flex gap-3 rounded-card bg-paper-dim px-5 py-4 text-sm leading-relaxed text-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-accent-ink" />
          <span className="min-w-0 break-words">{block.text}</span>
        </div>
      );
    default:
      return null;
  }
}
