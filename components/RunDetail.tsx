'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { METRIC_NAMES, type EvalRun } from '@/lib/types';

export function RunDetail({ runId }: { runId: string }) {
  const [run, setRun] = useState<EvalRun | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const response = await fetch(`/api/runs/${runId}`, { cache: 'no-store' });
      const data = await response.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setRun(data.run);
    })();
  }, [runId]);

  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!run) return <p className="text-sm text-slate-500">Loading results…</p>;

  const radarData = METRIC_NAMES.map((metric) => ({
    metric: metric.replaceAll('_', ' '),
    value: run.summary[metric],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{run.datasetName}</h1>
          <p className="text-sm text-slate-500">
            {new Date(run.createdAt).toLocaleString()} · {run.mode} mode · {run.judge} judge ·{' '}
            {run.results.length} samples
          </p>
        </div>
        <Link href="/" className="text-sm text-violet-600 hover:underline dark:text-violet-400">
          ← Back to dashboard
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Overall</p>
          <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
            {run.overall.toFixed(3)}
          </p>
        </div>
        {METRIC_NAMES.map((metric) => (
          <div
            key={metric}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {metric.replaceAll('_', ' ')}
            </p>
            <p className="text-2xl font-semibold">{run.summary[metric].toFixed(3)}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Metric profile
        </h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#64748b" opacity={0.3} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Per-sample results
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Question</th>
                {METRIC_NAMES.map((metric) => (
                  <th key={metric} className="px-2 py-2 text-right">
                    {metric.split('_')[0]}
                  </th>
                ))}
                <th className="px-2 py-2 text-right">Avg</th>
              </tr>
            </thead>
            <tbody>
              {run.results.map((result) => (
                <tr key={result.sampleId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-2 align-top">{result.question}</td>
                  {METRIC_NAMES.map((metric) => (
                    <td key={metric} className="px-2 py-2 text-right align-top font-mono text-xs">
                      {valueOf(result.metrics, metric).toFixed(2)}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right align-top font-semibold">
                    {result.overall.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Metric justifications are stored per sample in the run JSON and pushed to Langfuse as
          scores when configured.
        </p>
      </section>
    </div>
  );
}

function valueOf(
  metrics: { metric: string; value: number }[],
  metric: string,
): number {
  return metrics.find((entry) => entry.metric === metric)?.value ?? 0;
}
