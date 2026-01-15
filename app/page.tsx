import Header from '@/components/layout/Header';
import ViewToggle from '@/components/layout/ViewToggle';
import StatusCard from '@/components/status/StatusCard';
import MicroStats from '@/components/status/MicroStats';
import ChangeStrip from '@/components/timeline/ChangeStrip';
import PublicSummary from '@/components/public/PublicSummary';
import AnomalyLog from '@/components/expert/AnomalyLog';

export default function Page() {
  // Placeholder props; no server fetch (prevents SSR runtime failures)
  const latest = {
    observed_at: new Date().toISOString(),
    signal_value: 100,
    temperature_value: 20,
    environment_value: 0.5,
    integrity_flag: true,
    batch_hash: 'placeholder',
  };

  const anomalies = {
    items: [
      { detected_at: new Date().toISOString(), sigma: 2.4, status: 'resolved' },
    ],
  };

  return (
    <main className="min-h-screen bg-[#0E1116] text-[#E6EAF2]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Header />

        <div className="mt-6 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <div className="rounded-md bg-[#141922] p-6">
              <StatusCard latest={latest} />
              <div className="mt-3">
                <MicroStats />
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-md bg-[#141922] p-6">
              <ChangeStrip />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs text-[#9AA4B2]">
            This system prioritizes anomaly detection over averages.
          </div>
          <ViewToggle />
        </div>

        <div className="mt-6 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <div className="rounded-md bg-[#141922] p-6">
              <h2 className="text-sm font-semibold">Public View</h2>
              <div className="mt-4">
                <PublicSummary latest={latest} />
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-md bg-[#141922] p-6">
              <h2 className="text-sm font-semibold">Expert View</h2>
              <div className="mt-4">
                <AnomalyLog items={anomalies.items} />
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-10 text-xs text-[#6B7280]">
          Append-only · Publicly inspectable · Time-indexed
        </footer>
      </div>
    </main>
  );
}
