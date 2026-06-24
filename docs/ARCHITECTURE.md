# Architecture

## Overview

RAG Eval Studio is a Next.js app that scores pre-generated RAG outputs. It does
not retrieve or generate — it evaluates, which keeps the metric code the single
focus of the project.

```
POST /api/runs { datasetId }
        │
        ▼
  runner.evaluateDataset()
        │  for each sample
        ▼
  evaluateSample(sample, judge)
        │   judge === 'strands' → Strands agent
        │   judge === 'llm'     → AI SDK generateObject
        │   else                → heuristic estimator
        ▼
  metrics[] → sample overall
        │
        ▼
  summary (per-metric averages) + overall
        │
        ├─▶ saveRun()  (JSON store)
        └─▶ telemetry.pushScores()  (Langfuse)
```

## Modules

| File | Responsibility |
| --- | --- |
| `lib/store.ts` | JSON persistence for datasets and runs. |
| `lib/metrics.ts` | Deterministic offline metric estimators. |
| `lib/judge.ts` | LLM judge (AI SDK `generateObject`) and Strands judge. |
| `lib/runner.ts` | Judge selection, per-sample evaluation, aggregation. |
| `lib/telemetry.ts` | Langfuse spans and score ingestion. |
| `lib/langfuse-experiment.ts` | Optional Langfuse dataset experiment runner. |
| `lib/config.ts` | Environment inspection and judge selection. |

## Judge selection

`judgeMode()` returns:

1. the explicit `RAG_EVAL_JUDGE` value if set (`heuristic` | `llm` | `strands`),
2. otherwise `llm` when `OPENAI_API_KEY` is present,
3. otherwise `heuristic`.

`evaluateSample` degrades gracefully: if the selected judge throws (missing key,
parse error), it logs and falls back to the heuristic estimator, so a run always
completes.

## Design decisions

**Metrics are a pure function where possible.** The heuristic estimator makes
the test suite fast and exact, and gives the app a working default. The LLM
judge is the interesting path and is exercised whenever a key is present.

**Judging is one structured call per sample.** Scoring all five metrics in a
single `generateObject` call keeps cost and latency low and gives the model the
full context to reason across metrics.

**Langfuse is optional and best-effort.** Tracing and score ingestion never
throw; an evaluation run must succeed even if observability is misconfigured.
