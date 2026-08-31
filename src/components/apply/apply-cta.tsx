import { Button } from "@/components/ui/button";

/**
 * 입사지원 페이지 하단 강한 CTA 밴드 (다크).
 * 페이지 흐름의 마지막에서 다음 행동(공고 보기/마이페이지 등)으로 연결한다.
 */
export function ApplyCta({
  title,
  desc,
  primary,
  secondary,
}: {
  title: string;
  desc: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="mesh-ink grain-overlay relative overflow-hidden rounded-card p-8 text-paper sm:p-11">
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-paper sm:text-[1.6rem]">
            {title}
          </h3>
          <p className="mt-3 max-w-xl leading-relaxed text-paper/75">{desc}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button href={primary.href} variant="accent" size="md" arrow>
            {primary.label}
          </Button>
          {secondary && (
            <Button href={secondary.href} variant="light" size="md">
              {secondary.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
