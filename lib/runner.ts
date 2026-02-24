import { randomUUID } from 'node:crypto';
import { saveRun } from './store';
import { heuristicMetrics } from './metrics';
import { judgeWithLlm, judgeWithStrands } from './judge';
import { pushScores } from './telemetry';
import { judgeMode, runMode } from './config';
import {
  METRIC_NAMES,
  type Dataset,
  type EvalRun,
  type JudgeMode,
  type MetricName,
  type MetricScore,
  type SampleResult,
} from './types';

export async function evaluateSample(sample: Dataset['samples'][number], judge: JudgeMode): Promise<MetricScore[]> {
  if (judge === 'strands') {
    try {
      return await judgeWithStrands(sample);
    } catch (error) {
      console.warn('[judge] strands judge failed, falling back', error);
    }
  }
  if (judge === 'llm') {
    try {
      return await judgeWithLlm(sample);
    } catch (error) {
      console.warn('[judge] llm judge failed, falling back to heuristic', error);
    }
  }
  return heuristicMetrics(sample);
}

export async function evaluateDataset(dataset: Dataset): Promise<EvalRun> {
  const judge = judgeMode();
  const results: SampleResult[] = [];

  for (const sample of dataset.samples) {
    const metrics = await evaluateSample(sample, judge);
    results.push({
      sampleId: sample.id,
      question: sample.question,
      answer: sample.answer,
      metrics,
      overall: round(average(metrics.map((metric) => metric.value))),
    });
  }

  const summary = {} as Record<MetricName, number>;
  for (const name of METRIC_NAMES) {
    summary[name] = round(
      average(results.map((result) => metricValue(result, name))),
    );
  }
  const overall = round(average(Object.values(summary)));

  const run: EvalRun = {
    id: randomUUID(),
    datasetId: dataset.id,
    datasetName: dataset.name,
    createdAt: new Date().toISOString(),
    mode: runMode(),
    judge,
    results,
    summary,
    overall,
  };
  saveRun(run);

  await pushScores([
    { name: 'eval_overall', value: overall, comment: dataset.name },
    ...METRIC_NAMES.map((metric) => ({
      name: `eval_${metric}`,
      value: summary[metric],
      comment: dataset.name,
    })),
  ]);

  return run;
}

function metricValue(result: SampleResult, metric: MetricName): number {
  return result.metrics.find((entry) => entry.metric === metric)?.value ?? 0;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
