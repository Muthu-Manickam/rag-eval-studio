import { isLangfuseConfigured } from './config';

export async function trace<T>(name: string, input: unknown, fn: () => Promise<T>): Promise<T> {
  const result = await fn();
  if (!isLangfuseConfigured()) return result;
  try {
    const { startObservation } = await import('@langfuse/tracing');
    const observation = startObservation(name, { input });
    observation.update({ output: result as Record<string, unknown> });
    observation.end();
  } catch (error) {
    console.warn('[langfuse] observation failed', error);
  }
  return result;
}

export async function traceAgent<T>(
  name: string,
  input: unknown,
  fn: () => Promise<T>,
): Promise<T> {
  const result = await fn();
  if (!isLangfuseConfigured()) return result;
  try {
    const { startObservation } = await import('@langfuse/tracing');
    const observation = startObservation(name, { input }, { asType: 'agent' });
    observation.update({ output: result as Record<string, unknown> });
    observation.end();
  } catch (error) {
    console.warn('[langfuse] agent observation failed', error);
  }
  return result;
}

export interface PendingScore {
  name: string;
  value: number;
  comment?: string;
}

/** Pushes evaluation scores to Langfuse. Best-effort; never throws. */
export async function pushScores(scores: PendingScore[]): Promise<void> {
  if (!isLangfuseConfigured() || scores.length === 0) return;
  try {
    const { LangfuseClient } = await import('@langfuse/client');
    const client = new LangfuseClient() as unknown as {
      score?:
        | ((payload: unknown) => Promise<unknown>)
        | { create?: (payload: unknown) => Promise<unknown> };
    };
    for (const score of scores) {
      const payload = { name: score.name, value: score.value, comment: score.comment };
      if (typeof client.score === 'function') {
        await client.score(payload);
      } else if (client.score && typeof client.score.create === 'function') {
        await client.score.create(payload);
      }
    }
  } catch (error) {
    console.warn('[langfuse] failed to push scores', error);
  }
}
