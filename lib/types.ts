export const METRIC_NAMES = [
  'faithfulness',
  'answer_relevancy',
  'context_precision',
  'context_recall',
  'groundedness',
] as const;

export type MetricName = (typeof METRIC_NAMES)[number];

export interface EvalSample {
  id: string;
  question: string;
  answer: string;
  groundTruth: string;
  retrievedContexts: string[];
}

export interface Dataset {
  id: string;
  name: string;
  samples: EvalSample[];
  createdAt: string;
}

export interface MetricScore {
  metric: MetricName;
  value: number;
  reasoning: string;
}

export interface SampleResult {
  sampleId: string;
  question: string;
  answer: string;
  metrics: MetricScore[];
  overall: number;
}

export type JudgeMode = 'heuristic' | 'llm' | 'strands';

export interface EvalRun {
  id: string;
  datasetId: string;
  datasetName: string;
  createdAt: string;
  mode: 'openai' | 'mock';
  judge: JudgeMode;
  results: SampleResult[];
  summary: Record<MetricName, number>;
  overall: number;
}

export interface StoreData {
  datasets: Dataset[];
  runs: EvalRun[];
}
