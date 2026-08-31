import type { Metadata } from "next";
import {
  Mail,
  MapPin,
  Briefcase,
  ShieldCheck,
  Gift,
  ArrowUpRight,
} from "lucide-react";
import { recruit } from "@/lib/provider";
import { Container, Kicker } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { BrandScene } from "@/components/visuals/brand-scene";

export const metadata: Metadata = {
  title: "Foreign Recruiting | ARCO Careers",
  description:
    "Writer/Editor Position at ARCO Edu — develop and edit English content for test preparatory materials. Visa sponsorship, housing support, and more.",
};

export default async function ForeignRecruitingPage() {
  const data = await recruit.getForeignRecruit();
  const mailto = `mailto:${data.contact.email}`;

  return (
    <div lang="en">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden pt-32 pb-24 text-paper sm:pt-40 sm:pb-32">
        <span className="grain-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] opacity-90 [mask-image:linear-gradient(to_right,transparent,black_38%)] lg:block"
        >
          <BrandScene variant="global" tone="dark" />
        </div>
        <Container className="relative">
          <Reveal>
            <Kicker dark>ARCO Edu · Careers</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-hero mt-7 max-w-[12ch]">
              <span className="block">{data.pageTitle}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="serif-italic mt-6 text-2xl text-accent sm:text-3xl">
              {data.position}
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper/75">
              Join our team of native English researchers and help shape the
              test-preparation materials used by learners across Korea.
            </p>
          </Reveal>
          <Reveal delay={0.22}>
            <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href={mailto} variant="accent" size="lg" arrow>
                Apply via Email
              </Button>
              <Button
                href="/apply"
                size="lg"
                className="border border-white/25 bg-white/5 text-paper backdrop-blur-sm hover:bg-white/10"
              >
                Online Application
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Job Description ──────────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <Reveal>
              <div className="flex flex-col gap-5">
                <Kicker>Job Description</Kicker>
                <h2 className="text-display">
                  What you&rsquo;ll{" "}
                  <span className="serif-italic font-normal text-accent-ink">
                    do
                  </span>
                </h2>
              </div>
            </Reveal>
            <RevealGroup className="space-y-3">
              {data.jobDescription.map((item, i) => (
                <RevealItem
                  key={i}
                  className="flex items-start gap-4 rounded-card border border-line bg-pure p-5 transition-colors hover:border-accent/50"
                >
                  <Briefcase className="mt-0.5 size-5 shrink-0 text-accent-ink" />
                  <p className="leading-relaxed text-ink">{item}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </section>

      {/* ── Basic Qualifications ─────────────────────────────── */}
      <section className="bg-paper-dim py-20 sm:py-28">
        <Container>
          <Reveal>
            <div className="flex flex-col gap-5">
              <Kicker>Basic Qualifications</Kicker>
              <h2 className="text-display">Who we&rsquo;re looking for</h2>
            </div>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {data.basicQualifications.map((q, i) => (
              <RevealItem key={i} className="flex flex-col gap-4 bg-pure p-7">
                <span className="font-mono text-xs tracking-[0.18em] text-muted-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="leading-snug text-ink">{q}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── Benefits ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-20 text-paper sm:py-28">
        <div aria-hidden className="bg-grid-dark absolute inset-0" />
        <Container className="relative">
          <Reveal>
            <div className="flex flex-col gap-5">
              <Kicker dark>Benefits</Kicker>
              <h2 className="text-display text-paper">
                Taking care of{" "}
                <span className="serif-italic font-normal text-accent">
                  our people
                </span>
              </h2>
            </div>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-4 md:grid-cols-3">
            {data.benefits.map((b, i) => (
              <RevealItem
                key={i}
                className="flex flex-col gap-5 rounded-card border border-white/10 bg-white/[0.04] p-7"
              >
                <span className="grid size-12 place-items-center rounded-full bg-accent/15 text-accent">
                  {i === 0 ? (
                    <ShieldCheck className="size-6" />
                  ) : i === 1 ? (
                    <MapPin className="size-6" />
                  ) : (
                    <Gift className="size-6" />
                  )}
                </span>
                <h3 className="text-xl font-bold tracking-tight text-paper">
                  {b.label}
                </h3>
                <p className="leading-relaxed text-muted-ink">{b.detail}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ── Application Stages (1~5) — signature section ──────── */}
      <section className="bg-sky-veil py-20 sm:py-28">
        <Container>
          <Reveal>
            <div className="flex flex-col gap-5">
              <Kicker>Application Process</Kicker>
              <h2 className="text-display max-w-3xl">
                Five{" "}
                <span className="serif-italic font-normal text-accent-ink">
                  stages
                </span>{" "}
                to join
              </h2>
              <p className="max-w-xl text-lg leading-relaxed text-muted">
                From your first email to a signed contract — here is exactly
                what to expect.
              </p>
            </div>
          </Reveal>

          <RevealGroup className="relative mt-14">
            {/* vertical connector */}
            <div
              aria-hidden
              className="absolute left-[19px] top-3 bottom-3 hidden w-px bg-line-strong sm:block"
            />
            <div className="space-y-4">
              {data.applicationStages.map((s, i) => (
                <RevealItem
                  key={i}
                  className="surface-card relative grid gap-4 rounded-card p-7 sm:grid-cols-[200px_1fr] sm:gap-8 sm:p-8"
                >
                  <div className="flex items-center gap-4">
                    <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-ink font-mono text-sm font-semibold text-paper ring-4 ring-paper">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-lg font-bold tracking-tight text-ink">
                      {s.stage}
                    </span>
                  </div>
                  <p className="leading-relaxed text-muted">{s.description}</p>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>

          <Reveal delay={0.05}>
            <p className="mt-8 rounded-card bg-accent-soft px-5 py-4 text-sm leading-relaxed text-accent-ink">
              {data.applicationNote}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── Required Documents ───────────────────────────────── */}
      <section className="bg-paper-dim py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <Reveal>
              <div className="flex flex-col gap-5">
                <Kicker>Required Documents</Kicker>
                <h2 className="text-display">What to submit</h2>
                <p className="max-w-md leading-relaxed text-muted">
                  Send the documents below to{" "}
                  <a
                    href={mailto}
                    className="font-medium text-accent-ink underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                  >
                    {data.contact.email}
                  </a>
                  .
                </p>
              </div>
            </Reveal>

            <div>
              <RevealGroup className="grid gap-3 sm:grid-cols-2">
                {data.requiredDocuments.map((doc, i) => {
                  const [main, download] = doc.split(/\n\s*→\s*/);
                  return (
                    <RevealItem
                      key={i}
                      className="flex items-start gap-3 rounded-card border border-line bg-pure p-5"
                    >
                      <span className="mt-0.5 font-mono text-xs tracking-[0.16em] text-muted-ink">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="leading-relaxed text-ink">
                        {main}
                        {download && (
                          <a
                            href="#"
                            className="ml-1 inline-flex items-center gap-0.5 font-medium text-accent-ink underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                          >
                            {download}
                            <ArrowUpRight className="size-3.5" />
                          </a>
                        )}
                      </span>
                    </RevealItem>
                  );
                })}
              </RevealGroup>

              <RevealGroup className="mt-6 space-y-2.5">
                {data.documentNotes.map((note, i) => (
                  <RevealItem
                    key={i}
                    className="text-sm leading-relaxed text-muted"
                  >
                    {note}
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Contact + Map labels ─────────────────────────────── */}
      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            {/* Contact */}
            <Reveal>
              <div className="rounded-lg border border-line bg-pure p-8 shadow-lift sm:p-10">
                <Kicker>Contact</Kicker>
                <h2 className="text-display mt-5 text-3xl sm:text-4xl">
                  Get in touch
                </h2>
                <dl className="mt-8 space-y-6">
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted-ink">
                      Coordinator
                    </dt>
                    <dd className="mt-1.5 text-lg font-semibold text-ink">
                      {data.contact.person}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted-ink">
                      Email
                    </dt>
                    <dd className="mt-1.5">
                      <a
                        href={mailto}
                        className="inline-flex items-center gap-2 text-lg font-semibold text-accent-ink underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                      >
                        <Mail className="size-4" />
                        {data.contact.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted-ink">
                      Address
                    </dt>
                    <dd className="mt-1.5 flex items-start gap-2 leading-relaxed text-ink">
                      <MapPin className="mt-1 size-4 shrink-0 text-accent-ink" />
                      <span>
                        {data.contact.address}
                        <span className="mt-1 block text-sm text-muted">
                          {data.contact.addressKo}
                        </span>
                      </span>
                    </dd>
                  </div>
                </dl>
                <div className="mt-9">
                  <Button href={mailto} variant="primary" size="lg" arrow>
                    Apply via Email
                  </Button>
                </div>
              </div>
            </Reveal>

            {/* Map labels (landmark legend) */}
            <Reveal delay={0.08}>
              <div className="rounded-lg border border-line bg-paper-dim/60 p-8 sm:p-10">
                <Kicker>Finding us</Kicker>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-ink">
                  Nearby landmarks
                </h3>
                <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
                  {data.mapLabels.map((label, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-muted"
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-[10px] font-semibold text-accent-ink">
                        {i + 1}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <section className="mesh-ink grain relative overflow-hidden py-24 text-paper sm:py-32">
        <span className="grain-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]"
        >
          <BrandScene variant="people" tone="dark" />
        </div>
        <Container className="relative text-center">
          <Reveal>
            <p className="serif-italic text-2xl text-accent sm:text-3xl">
              Ready to write with us?
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-display mx-auto mt-6 max-w-3xl text-paper">
              Shape the materials that
              <br />
              power learning across Korea
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={mailto} variant="accent" size="lg" arrow>
                Apply via Email
              </Button>
              <Button
                href="/apply"
                size="lg"
                className="border border-white/25 bg-white/5 text-paper backdrop-blur-sm hover:bg-white/10"
              >
                Online Application
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-sm text-muted-ink">
              {data.contact.person} · {data.contact.email}
            </p>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
