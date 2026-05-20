import { isLangfuseConfigured } from './config';
import { evaluateSample } from './runner';
import { METRIC_NAMES, type Dataset } from './types';

/**
 * Optional integration point with Langfuse datasets & experiments. When the
 * Langfuse credentials and the `@langfuse/client` experiment API are available,
 * this runs the evaluation as a named Langfuse experiment so consecutive runs
 * are comparable in the Langfuse UI.
 *
 * It is intentionally best-effort: if Langfuse is not configured or the
 * experiment API is unavailable, it reports that it was skipped.
 */
export async function runLangfuseExperiment(dataset: Dataset): Promise<{
  ran: boolean;
  reason?: string;
}> {
  if (!isLangfuseConfigured()) return { ran: false, reason: 'Langfuse is not configured.' };

  try {
    const { LangfuseClient } = await import('@langfuse/client');
    const client = new LangfuseClient() as unknown as {
      experiment?: {
        run?: (options: {
          name: string;
          data: unknown[];
          task: (item: unknown) => Promise<unknown>;
          evaluators: ((options: unknown) => Promise<unknown>)[];
        }) => Promise<unknown>;
      };
    };
    if (!client.experiment?.run) {
      return { ran: false, reason: 'Langfuse experiment API is unavailable in this SDK build.' };
    }

    await client.experiment.run({
      name: `rag-eval-studio:${dataset.name}`,
      data: dataset.samples,
      task: async (item) => {
        const sample = item as Dataset['samples'][number];
        const metrics = await evaluateSample(sample, 'llm');
        return { answer: sample.answer, metrics };
      },
      evaluators: METRIC_NAMES.map((metric) => async (options: unknown) => {
        const { output } = options as { output: { metrics: { metric: string; value: number }[] } };
        const found = output.metrics.find((entry) => entry.metric === metric);
        return { name: metric, value: found?.value ?? 0 };
      }),
    });

    return { ran: true };
  } catch (error) {
    return { ran: false, reason: (error as Error).message };
  }
}
