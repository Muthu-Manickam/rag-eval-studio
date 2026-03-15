import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { Agent } from '@strands-agents/sdk';
import { OpenAIModel } from '@strands-agents/sdk/models/openai';
import { isOpenAIConfigured, judgeModel } from './config';
import { traceAgent } from './telemetry';
import { METRIC_NAMES, type EvalSample, type MetricName, type MetricScore } from './types';

const JUDGE_SYSTEM = `You are a rigorous RAG evaluation judge. Score the answer on five metrics, each between 0 and 1:
- faithfulness: is every factual claim in the answer supported by the retrieved contexts?
- answer_relevancy: does the answer directly address the question?
- context_precision: are the retrieved contexts relevant and free of noise?
- context_recall: do the contexts contain all information needed to answer?
- groundedness: is the answer free of outside/hallucinated knowledge?
Return a short reasoning sentence as well.`;

const metricSchema = z.object({
  faithfulness: z.number().min(0).max(1),
  answer_relevancy: z.number().min(0).max(1),
  context_precision: z.number().min(0).max(1),
  context_recall: z.number().min(0).max(1),
  groundedness: z.number().min(0).max(1),
  reasoning: z.string(),
});

type JudgeObject = z.infer<typeof metricSchema>;

function buildPrompt(sample: EvalSample): string {
  const contexts = sample.retrievedContexts.map((entry, index) => `[${index + 1}] ${entry}`).join('\n\n');
  return [
    `Question:\n${sample.question}`,
    `Ground truth (if available):\n${sample.groundTruth || '(none)'}`,
    `Retrieved contexts:\n${contexts}`,
    `Answer to evaluate:\n${sample.answer}`,
  ].join('\n\n');
}

function toMetrics(object: JudgeObject): MetricScore[] {
  return METRIC_NAMES.map((metric) => ({
    metric,
    value: round(object[metric as MetricName]),
    reasoning: object.reasoning,
  }));
}

function round(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 1) * 1000) / 1000;
}

/** LLM-as-a-judge using the Vercel AI SDK structured output. */
export async function judgeWithLlm(sample: EvalSample): Promise<MetricScore[]> {
  if (!isOpenAIConfigured()) throw new Error('LLM judge requires OPENAI_API_KEY.');
  const { object } = await generateObject({
    model: openai.chat(judgeModel()),
    schema: metricSchema,
    system: JUDGE_SYSTEM,
    prompt: buildPrompt(sample),
    telemetry: { functionId: 'rag-eval-studio.judge' },
  });
  return toMetrics(object);
}

/** LLM-as-a-judge using a Strands agent (opt-in). */
export async function judgeWithStrands(sample: EvalSample): Promise<MetricScore[]> {
  if (!isOpenAIConfigured()) throw new Error('Strands judge requires OPENAI_API_KEY.');

  const model = new OpenAIModel({
    api: 'chat',
    modelId: judgeModel(),
    apiKey: process.env.OPENAI_API_KEY,
  });
  const agent = new Agent({
    model,
    systemPrompt: `${JUDGE_SYSTEM}\nReply with ONLY a JSON object with the five metric keys and a "reasoning" string.`,
  });

  const raw = await traceAgent('strands-eval-judge', { question: sample.question }, async () =>
    String(await agent.invoke(buildPrompt(sample))),
  );

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Strands judge returned no JSON.');
  const parsed = JSON.parse(match[0]) as Partial<JudgeObject>;
  return METRIC_NAMES.map((metric) => ({
    metric,
    value: round(typeof parsed[metric as MetricName] === 'number' ? (parsed[metric as MetricName] as number) : 0),
    reasoning: parsed.reasoning ?? '',
  }));
}
