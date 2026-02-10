'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Dataset } from '@/lib/types';

const TEMPLATE = `{
  "name": "My evaluation set",
  "samples": [
    {
      "question": "What is ...?",
      "answer": "The RAG answer to evaluate.",
      "groundTruth": "The reference answer.",
      "retrievedContexts": ["The context chunk that was retrieved."]
    }
  ]
}`;

export function DatasetManager() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [json, setJson] = useState(TEMPLATE);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch('/api/datasets', { cache: 'no-store' });
    const data = await response.json();
    setDatasets(data.datasets ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const parsed = JSON.parse(json);
      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error);
      await refresh();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }, [json, refresh]);

  const remove = useCallback(
    async (id: string) => {
      await fetch(`/api/datasets?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refresh();
    },
    [refresh],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          New dataset (JSON)
        </h2>
        <textarea
          value={json}
          onChange={(event) => setJson(event.target.value)}
          rows={16}
          spellCheck={false}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
        />
        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="mt-3 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Create dataset'}
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Datasets ({datasets.length})
        </h2>
        <div className="space-y-2">
          {datasets.length === 0 ? (
            <p className="text-sm text-slate-400">No datasets yet.</p>
          ) : (
            datasets.map((dataset) => (
              <div
                key={dataset.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
              >
                <div>
                  <p className="font-medium">{dataset.name}</p>
                  <p className="text-xs text-slate-500">{dataset.samples.length} samples</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(dataset.id)}
                  className="text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
