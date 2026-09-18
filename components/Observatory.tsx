'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardData } from '@/lib/types';
import Header from '@/components/layout/Header';
import ViewToggle from '@/components/layout/ViewToggle';
import StatusCard from '@/components/status/StatusCard';
import MicroStats from '@/components/status/MicroStats';
import PublicSummary from '@/components/public/PublicSummary';
import RecentDeviations from '@/components/public/RecentDeviations';
import LedgerSnapshot from '@/components/public/LedgerSnapshot';
import SystemBoundary from '@/components/public/SystemBoundary';
import VerificationNotice from '@/components/public/VerificationNotice';
import DataOrigin from '@/components/public/DataOrigin';
import AnomalyLog from '@/components/expert/AnomalyLog';
import ProbeLog from '@/components/expert/ProbeLog';
import LedgerChain from '@/components/expert/LedgerChain';
import ContinuityStatus from '@/components/public/ContinuityStatus';
import ObservationRecord from '@/components/public/ObservationRecord';
import ContinuityDetail from '@/components/expert/ContinuityDetail';
import CathedralArch from '@/components/layout/CathedralArch';
import SuiteFooter from '@/components/layout/SuiteFooter';

const POLL_INTERVAL = 30_000;

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mode, setMode] = useState<'public' | 'expert'>('public');
  const [initialLoad, setInitialLoad] = useState(true);
  const [failed, setFailed] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchDashboard = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch('/api/dashboard', { signal: controller.signal });
      if (!res.ok) {
        setFailed(true);
        setInitialLoad(false);
        return;
      }
      const json: DashboardData = await res.json();
      setData(json);
      setFailed(false);
      setInitialLoad(false);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setFailed(true);
      setInitialLoad(false);
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

  if (initialLoad) {
    return (
      <main className="min-h-screen bg-[#0E1116] text-[#E6EAF2]">
        <CathedralArch position="top" />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Header observing={null} />
          <div className="mt-12 text-center text-sm text-[#6B7280]">Reading the ledger…</div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0E1116] text-[#E6EAF2]">
        <CathedralArch position="top" />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Header observing={null} />
          <div className="mt-12 rounded-lg bg-[#141922] p-6 text-sm text-[#D4A373]">
            The ledger could not be read. No observation state can be reported.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0E1116] text-[#E6EAF2]">
      <CathedralArch position="top" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Header observing={data.observing} />

        {(failed || data.error) && (
          <div className="mt-4 rounded-lg border border-[#D4A373]/30 bg-[#D4A373]/5 px-4 py-3 text-xs text-[#D4A373]">
            {data.error ?? 'The last refresh failed. Values below may be from an earlier read.'}
          </div>
        )}

        {/* Observation state, first and largest on the page. */}
        <div className="mt-6 rounded-lg bg-[#141922] p-6">
          <StatusCard observing={data.observing} />
          <div className="mt-4 border-t border-[#2A3242] pt-4">
            <MicroStats ledger={data.ledger} series={data.series} />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[#9AA4B2]">
            This system records observable signals. It does not estimate the ones it missed.
          </div>
          <ViewToggle mode={mode} onChange={setMode} />
        </div>

        {mode === 'public' ? (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7">
                <div className="rounded-lg bg-[#141922] p-6">
                  <PublicSummary observing={data.observing} series={data.series} />
                  <div className="mt-4">
                    <ContinuityStatus continuity={data.continuity} />
                  </div>
                  <div className="mt-4 rounded-md bg-[#1A2030] p-4">
                    <ObservationRecord continuity={data.continuity} />
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
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7">
                <div className="rounded-lg bg-[#141922] p-6">
                  <h2 className="text-sm font-semibold text-[#9AA4B2]">Hash Chain (tail)</h2>
                  <div className="mt-4">
                    <LedgerChain tail={data.ledger_tail} />
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

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7">
                <div className="rounded-lg bg-[#141922] p-6">
                  <h2 className="text-sm font-semibold text-[#9AA4B2]">External HTTP Probe</h2>
                  <div className="mt-4">
                    <ProbeLog points={data.probe} />
                  </div>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5">
                <div className="rounded-lg bg-[#141922] p-6">
                  <h2 className="text-sm font-semibold text-[#9AA4B2]">Anomaly Log</h2>
                  <div className="mt-4">
                    <AnomalyLog items={data.anomalies} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-10 space-y-3">
          <DataOrigin />
          <div className="text-xs text-[#6B7280]">Append-only · Publicly inspectable · Time-indexed</div>
          <div className="text-xs text-[#4A5568]">Powered by BlueTubeTV</div>
          <div className="mt-4">
            <SuiteFooter />
          </div>
        </footer>
      </div>
      <CathedralArch position="bottom" />
    </main>
  );
}
