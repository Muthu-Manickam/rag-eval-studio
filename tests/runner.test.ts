import { afterAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { evaluateDataset, evaluateSample } from '@/lib/runner';
import { heuristicMetrics } from '@/lib/metrics';
import { sampleDataset } from '@/lib/samples';
import { METRIC_NAMES } from '@/lib/types';

afterAll(() => {
  fs.rmSync(path.join(process.cwd(), '.data'), { recursive: true, force: true });
});

describe('evaluateSample', () => {
  it('falls back to the heuristic judge when no LLM is available', async () => {
    const metrics = await evaluateSample(sampleDataset().samples[0], 'heuristic');
    expect(metrics).toHaveLength(METRIC_NAMES.length);
    expect(metrics.map((metric) => metric.metric)).toEqual([...METRIC_NAMES]);
  });

  it('does not throw when an llm judge is requested but unconfigured', async () => {
    const metrics = await evaluateSample(sampleDataset().samples[0], 'llm');
    expect(metrics).toHaveLength(METRIC_NAMES.length);
  });
});

describe('evaluateDataset', () => {
  it('aggregates per-sample metrics into a run summary', async () => {
    const dataset = sampleDataset();
    const run = await evaluateDataset(dataset);

    expect(run.results).toHaveLength(dataset.samples.length);
    expect(run.overall).toBeGreaterThanOrEqual(0);
    expect(run.overall).toBeLessThanOrEqual(1);
    for (const metric of METRIC_NAMES) {
      expect(run.summary[metric]).toBeGreaterThanOrEqual(0);
      expect(run.summary[metric]).toBeLessThanOrEqual(1);
    }
  });

  it('scores the hallucinated sample lower than the grounded one', async () => {
    const run = await evaluateDataset(sampleDataset());
    const grounded = run.results.find((result) => result.sampleId === 's1');
    const hallucinated = run.results.find((result) => result.sampleId === 's5');
    expect(grounded).toBeDefined();
    expect(hallucinated).toBeDefined();
    expect((grounded?.overall ?? 0)).toBeGreaterThan(hallucinated?.overall ?? 0);
  });
});

describe('heuristicMetrics stability', () => {
  it('is deterministic', () => {
    const a = heuristicMetrics(sampleDataset().samples[0]);
    const b = heuristicMetrics(sampleDataset().samples[0]);
    expect(a).toEqual(b);
  });
});
