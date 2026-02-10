'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Dataset } from '@/lib/types';

interface RunListItem {
  id: string;
  datasetName: string;
  createdAt: string;
  mode: string;
  judge: string;
  overall: number;
}

export function Dashboard() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const [runsResponse, datasetsResponse] = await Promise.all([
      fetch('/api/runs', { cache: 'no-store' }),
      fetch('/api/datasets', { cache: 'no-store' }),
    ]);
    const runsData = await runsResponse.json();
    const datasetsData = await datasetsResponse.json();
    setRuns(runsData.runs ?? []);
    setDatasets(datasetsData.datasets ?? []);
    setSelected((current) => current || datasetsData.datasets?.[0]?.id || '');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const seed = useCallback(async () => {
    setBusy(true);
    await fetch('/api/seed', { method: 'POST' });
    await refresh();
    setBusy(false);
  }, [refresh]);

  const evaluate = useCallback(async () => {
    if (!selected) {
      setError('Load or create a dataset first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ datasetId: selected }),
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error);
      router.push(`/results/${data.run.id}`);
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }, [selected, router]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">New evaluation</h2>
          <button
            type="button"
            onClick={seed}
            disabled={busy}
            className="rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:opacity-50 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300"
          >
            Load sample dataset
          </button>
        </div>

        {datasets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Load the sample dataset or create your own under Datasets.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Dataset</span>
              <select
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.samples.length} samples)
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={evaluate}
              disabled={busy}
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {busy ? 'Evaluating…' : 'Run evaluation'}
            </button>
          </div>
        )}

        {error ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold">Recent evaluations</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-slate-500">No evaluations yet.</p>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/results/${run.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm transition hover:border-violet-400 dark:border-slate-800"
              >
                <span className="font-medium">{run.datasetName}</span>
                <span className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="rounded bg-violet-50 px-2 py-0.5 font-mono text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {run.overall.toFixed(3)}
                  </span>
                  <span>{run.judge} judge</span>
                  <span>{new Date(run.createdAt).toLocaleString()}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
