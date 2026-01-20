import { describe, expect, it } from 'vitest';
import { heuristicMetrics, tokenCoverage } from '@/lib/metrics';
import type { EvalSample } from '@/lib/types';

function sample(overrides: Partial<EvalSample> = {}): EvalSample {
  return {
    id: 's',
    question: 'What are the three stages of a RAG pipeline?',
    answer: 'RAG has three stages: indexing, retrieval and generation.',
    groundTruth: 'Indexing, retrieval and generation.',
    retrievedContexts: [
      'RAG combines retrieval with generation. Documents are indexed, retrieved for a query, and the model generates an answer from the context.',
    ],
    ...overrides,
  };
}

describe('tokenCoverage', () => {
  it('measures lexical overlap', () => {
    expect(tokenCoverage('indexing retrieval generation', 'indexing retrieval generation')).toBe(1);
    expect(tokenCoverage('banana', 'indexing retrieval')).toBe(0);
  });
});

describe('heuristicMetrics', () => {
  it('produces a score for every metric in range', () => {
    const metrics = heuristicMetrics(sample());
    expect(metrics).toHaveLength(5);
    for (const metric of metrics) {
      expect(metric.value).toBeGreaterThanOrEqual(0);
      expect(metric.value).toBeLessThanOrEqual(1);
    }
  });

  it('rewards grounded answers over hallucinated ones', () => {
    const grounded = heuristicMetrics(sample());
    const hallucinated = heuristicMetrics(
      sample({
        answer: 'You should always use the fictional EmbedX model, which is the only correct choice.',
      }),
    );

    const groundedness = (metrics: typeof grounded) =>
      metrics.find((metric) => metric.metric === 'groundedness')?.value ?? 0;

    expect(groundedness(grounded)).toBeGreaterThan(groundedness(hallucinated));
  });

  it('reports low context recall when the context is missing the answer', () => {
    const metrics = heuristicMetrics(
      sample({
        groundTruth: 'Overlap is ten to twenty percent of the chunk size.',
        retrievedContexts: ['The capital of France is Paris.'],
      }),
    );
    const recall = metrics.find((metric) => metric.metric === 'context_recall')?.value ?? 1;
    expect(recall).toBeLessThan(0.4);
  });
});
