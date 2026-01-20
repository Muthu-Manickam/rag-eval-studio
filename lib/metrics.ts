import { METRIC_NAMES, type EvalSample, type MetricName, type MetricScore } from './types';

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

/** Share of `text` tokens that appear in `reference`. */
export function tokenCoverage(text: string, reference: string): number {
  const textTokens = tokenize(text);
  if (textTokens.length === 0) return 0;
  const referenceTokens = new Set(tokenize(reference));
  const hits = textTokens.filter((token) => referenceTokens.has(token)).length;
  return hits / textTokens.length;
}

function round(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 1) * 1000) / 1000;
}

/**
 * Deterministic, offline metric approximations. These are lexical proxies, not
 * semantic judgments — they exist so the studio works (and CI runs) with no API
 * key. When an LLM judge is available it replaces these values.
 */
export function heuristicMetrics(sample: EvalSample): MetricScore[] {
  const context = sample.retrievedContexts.join('\n\n');
  const combined = `${sample.question}\n${sample.groundTruth}`;

  const groundedness = tokenCoverage(sample.answer, context);
  const faithfulness = groundedness;
  const answerRelevancy = tokenCoverage(sample.answer, combined);

  const relevantContexts = sample.retrievedContexts.filter(
    (entry) => tokenCoverage(entry, combined) >= 0.15 || tokenCoverage(combined, entry) >= 0.15,
  );
  const contextPrecision =
    sample.retrievedContexts.length === 0 ? 0 : relevantContexts.length / sample.retrievedContexts.length;
  const contextRecall = tokenCoverage(sample.groundTruth, context);

  const values: Record<MetricName, number> = {
    faithfulness,
    answer_relevancy: answerRelevancy,
    context_precision: contextPrecision,
    context_recall: contextRecall,
    groundedness,
  };

  return METRIC_NAMES.map((metric) => ({
    metric,
    value: round(values[metric]),
    reasoning: 'Heuristic lexical estimate (no LLM judge configured).',
  }));
}
