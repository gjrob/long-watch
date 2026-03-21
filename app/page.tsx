'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardData } from '@/lib/types';
import Header from '@/components/layout/Header';
import ViewToggle from '@/components/layout/ViewToggle';
import StatusCard from '@/components/status/StatusCard';
import MicroStats from '@/components/status/MicroStats';
import ChangeStrip from '@/components/timeline/ChangeStrip';
import PublicSummary from '@/components/public/PublicSummary';
import RecentDeviations from '@/components/public/RecentDeviations';
import LedgerSnapshot from '@/components/public/LedgerSnapshot';
import StabilityDuration from '@/components/public/StabilityDuration';
import SystemBoundary from '@/components/public/SystemBoundary';
import VerificationNotice from '@/components/public/VerificationNotice';
import DataOrigin from '@/components/public/DataOrigin';
import AnomalyLog from '@/components/expert/AnomalyLog';
import SignalChart from '@/components/expert/SignalChart';
import DeltaChart from '@/components/expert/DeltaChart';
import ConfidenceBand from '@/components/expert/ConfidenceBand';
import LedgerChain from '@/components/expert/LedgerChain';
import ContinuityStatus from '@/components/public/ContinuityStatus';
import ContinuityDetail from '@/components/expert/ContinuityDetail';
import AnchorStatus from '@/components/public/AnchorStatus';
import AnchorDetail from '@/components/expert/AnchorDetail';

const POLL_INTERVAL = 15_000;

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mode, setMode] = useState<'public' | 'expert'>('public');
  const [initialLoad, setInitialLoad] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchDashboard = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch('/api/dashboard', { signal: controller.signal });
      if (!res.ok) return;
      const json: DashboardData = await res.json();
      setData(json);
      setInitialLoad(false);
    } catch {
      // AbortError or network — silently ignore
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(fetchDashboard, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      controllerRef.current?.abort();
    };
  }, [fetchDashboard]);

  if (initialLoad && !data) {
    return (
      <main className="min-h-screen bg-[#0E1116] text-[#E6EAF2]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Header lastUpdate={null} continuity={null} />
          <div className="mt-12 text-center text-sm text-[#6B7280]">Loading observation data…</div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-[#0E1116] text-[#E6EAF2]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Header lastUpdate={data.fetched_at} continuity={data.continuity} />

        {/* Status + Timeline */}
        <div className="mt-6 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <div className="rounded-lg bg-[#141922] p-6">
              <StatusCard latest={data.latest} />
              <div className="mt-3">
                <MicroStats
                  signals={4}
                  observations={data.ledger.row_count}
                  edits={data.ledger.mutation_attempts}
                />
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-lg bg-[#141922] p-6">
              <ChangeStrip anomalies={data.anomalies} />
            </div>
          </div>
        </div>

        {/* Principle line + Toggle */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[#9AA4B2]">
            This system prioritizes anomaly detection over averages.
          </div>
          <ViewToggle mode={mode} onChange={setMode} />
        </div>

        {/* View content */}
        {mode === 'public' ? (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7">
                <div className="rounded-lg bg-[#141922] p-6">
                  <PublicSummary latest={data.latest} />
                  <div className="mt-4">
                    <StabilityDuration days={data.stability_days} />
                  </div>
                  <div className="mt-4">
                    <ContinuityStatus continuity={data.continuity} />
                  </div>
                  <div className="mt-4">
                    <AnchorStatus anchoring={data.anchoring} />
                  </div>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 space-y-4">
                <div className="rounded-lg bg-[#141922] p-6">
                  <RecentDeviations anomalies={data.anomalies} />
                </div>
                <div className="rounded-lg bg-[#141922] p-6">
                  <LedgerSnapshot ledger={data.ledger} />
                </div>
              </div>
            </div>

            <SystemBoundary />
            <VerificationNotice />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-[#141922] p-6">
              <h2 className="text-sm font-semibold text-[#9AA4B2]">Signal Time Series</h2>
              <div className="mt-4">
                <SignalChart timeseries={data.timeseries} />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7">
                <div className="rounded-lg bg-[#141922] p-6">
                  <h2 className="text-sm font-semibold text-[#9AA4B2]">Confidence Band</h2>
                  <div className="mt-4">
                    <ConfidenceBand timeseries={data.timeseries} />
                  </div>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5">
                <div className="rounded-lg bg-[#141922] p-6">
                  <h2 className="text-sm font-semibold text-[#9AA4B2]">Delta (24h / 7d)</h2>
                  <div className="mt-4">
                    <DeltaChart delta={data.delta} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7">
                <div className="rounded-lg bg-[#141922] p-6">
                  <h2 className="text-sm font-semibold text-[#9AA4B2]">Anomaly Log</h2>
                  <div className="mt-4">
                    <AnomalyLog items={data.anomalies} />
                  </div>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5">
                <div className="rounded-lg bg-[#141922] p-6">
                  <h2 className="text-sm font-semibold text-[#9AA4B2]">Ledger Metadata</h2>
                  <div className="mt-4">
                    <LedgerSnapshot ledger={data.ledger} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7">
                <div className="rounded-lg bg-[#141922] p-6">
                  <h2 className="text-sm font-semibold text-[#9AA4B2]">Hash Chain</h2>
                  <div className="mt-4">
                    <LedgerChain ledger={data.ledger} tail={data.ledger_tail} />
                  </div>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5">
                <div className="rounded-lg bg-[#141922] p-6">
                  <h2 className="text-sm font-semibold text-[#9AA4B2]">Observation Continuity</h2>
                  <div className="mt-4">
                    <ContinuityDetail continuity={data.continuity} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[#141922] p-6">
              <h2 className="text-sm font-semibold text-[#9AA4B2]">External Anchoring</h2>
              <div className="mt-4">
                <AnchorDetail anchoring={data.anchoring} />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 space-y-3">
          <DataOrigin />
          <div className="text-xs text-[#6B7280]">
            Append-only · Publicly inspectable · Time-indexed
          </div>
          <div className="text-xs text-[#4A5568]">
            Powered by BlueTubeTV
          </div>
        </footer>
      </div>
    </main>
  );
}
