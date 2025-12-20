import type { JudgeMode } from './types';

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function isLangfuseConfigured(): boolean {
  return Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
}

export function runMode(): 'openai' | 'mock' {
  return isOpenAIConfigured() ? 'openai' : 'mock';
}

export function judgeMode(): JudgeMode {
  const configured = process.env.RAG_EVAL_JUDGE;
  if (configured === 'heuristic' || configured === 'llm' || configured === 'strands') {
    return configured;
  }
  return isOpenAIConfigured() ? 'llm' : 'heuristic';
}

export function judgeModel(): string {
  return process.env.JUDGE_MODEL ?? 'gpt-4o-mini';
}
