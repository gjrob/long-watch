import CathedralArch from '@/components/layout/CathedralArch';
import SuiteFooter from '@/components/layout/SuiteFooter';

export const runtime = "nodejs";

export default function TrustPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-900">
      <CathedralArch position="top" />
      <h1 className="text-3xl font-semibold tracking-tight">
        Why The Long Watch Forbids Edits
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-neutral-700">
        The Long Watch is a long-duration verification instrument.
        Its purpose is not to persuade, optimize, or react in real time,
        but to preserve what was observed at a specific moment in history.
      </p>

      <section className="mt-10 space-y-6">
        <p className="leading-relaxed">
          Most modern systems allow past records to be edited, corrected,
          overwritten, or silently replaced. This improves convenience,
          but it destroys the ability to reconstruct what was actually
          known at an earlier point in time.
        </p>

        <p className="leading-relaxed">
          Once a record can be changed, history becomes ambiguous.
          Later knowledge contaminates earlier evidence.
          Trust shifts from verification to authority.
        </p>

        <p className="leading-relaxed">
          The Long Watch rejects this model.
        </p>

        <p className="leading-relaxed">
          Every signal recorded by the system is append-only.
          It is written once, time-anchored, and cryptographically linked
          to the signals that came before it.
          No edits. No deletions. No silent corrections.
        </p>

        <p className="leading-relaxed">
          If an observation was incomplete, uncertain, or later proven wrong,
          that fact is recorded as a new observation.
          The past remains intact.
        </p>

        <p className="leading-relaxed">
          This design allows anyone—now or years in the future—to answer
          a precise question:
        </p>

        <blockquote className="border-l-4 border-neutral-300 pl-4 italic text-neutral-600">
          “What did the system observe at that moment, using only the
          information available at that time?”
        </blockquote>

        <p className="leading-relaxed">
          Verification does not require trusting the interface,
          the operators, or the authors.
          The integrity of the record can be checked independently
          through public verification endpoints.
        </p>

        <p className="leading-relaxed">
          The Long Watch is not optimized for speed, alerts, or engagement.
          It is optimized for durability.
        </p>

        <p className="leading-relaxed font-medium">
          Truth that cannot be revised is harder to maintain—
          and therefore worth more.
        </p>
      </section>

      <footer className="mt-16 text-sm text-neutral-500">
        <p>
          Related endpoints:
        </p>
        <ul className="mt-2 list-disc pl-5">
          <li><code>/api/signals/latest</code></li>
          <li><code>/api/verify/head</code></li>
          <li><code>/api/verify/series</code></li>
        </ul>
        <div className="mt-8">
          <SuiteFooter />
        </div>
      </footer>
      <CathedralArch position="bottom" />
    </main>
  );
}
