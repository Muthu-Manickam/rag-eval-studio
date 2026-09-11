# RAG Eval Studio

An evaluation dashboard for retrieval-augmented generation. Score RAG outputs with **RAGAS-style metrics** — faithfulness, answer relevancy, context precision, context recall and groundedness — computed by an **LLM-as-a-judge**, with a deterministic offline fallback so it runs with no API keys.

Built with **Next.js 16 · TypeScript · Vercel AI SDK 7 · Strands Agents · Langfuse**.

[![CI](https://github.com/Muthu-Manickam/rag-eval-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/Muthu-Manickam/rag-eval-studio/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-7-000000?logo=vercel)
![Strands](https://img.shields.io/badge/Strands%20Agents-1.x-ff9900)
![Langfuse](https://img.shields.io/badge/Langfuse-observed-0a0a0a)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Why this exists

"It looks better" is not an evaluation. This studio turns a folder of RAG outputs into a metric report you can compare over time: per-sample scores, a metric profile, and an overall number, with the judge's reasoning attached to every score.

## Features

- **Datasets** — samples of `question`, `answer`, `groundTruth` and `retrievedContexts`, imported as JSON.
- **Five metrics** — faithfulness, answer relevancy, context precision, context recall, groundedness.
- **Three judges** —
  - `heuristic`: deterministic lexical estimator, no API key (default offline),
  - `llm`: structured LLM-as-a-judge via the Vercel AI SDK `generateObject`,
  - `strands`: a **Strands Agents** judge agent (`RAG_EVAL_JUDGE=strands`).
- **Metric profile** — radar chart plus per-metric cards and a per-sample breakdown table.
- **Observability** — every run and metric is pushed to **Langfuse** as scores when configured, and an optional Langfuse experiment runner is included.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Load sample dataset**, then **Run evaluation**. Works with no keys.

The sample dataset is deliberately mixed: it includes a grounded answer, a hallucinated answer and an unsupported answer, so you can see the metrics separate them.

## How it works

```
dataset (question, answer, groundTruth, contexts)
        │
        ▼
  judge selection ──▶ heuristic  (lexical, offline)
                   ├─▶ llm        (AI SDK generateObject, structured metrics)
                   └─▶ strands    (Strands agent returning JSON)
        │
        ▼
  per-sample metrics ──▶ run summary ──▶ dashboard + Langfuse scores
```

| Concern | Implementation |
| --- | --- |
| Metric definitions | `lib/metrics.ts` (offline) and `lib/judge.ts` (LLM prompts) |
| LLM judge | Vercel AI SDK `generateObject` with a zod metric schema |
| Strands judge | `@strands-agents/sdk` agent returning JSON metrics |
| Aggregation | `lib/runner.ts` — per-sample and per-metric averages |
| Tracing / scores | Langfuse OTEL span processor and score ingestion |
| Optional experiments | `lib/langfuse-experiment.ts` |

## Metrics

| Metric | Question it answers |
| --- | --- |
| Faithfulness | Is every claim in the answer supported by the retrieved contexts? |
| Answer relevancy | Does the answer directly address the question? |
| Context precision | Are the retrieved contexts relevant and free of noise? |
| Context recall | Do the contexts contain everything needed to answer? |
| Groundedness | Is the answer free of outside/hallucinated knowledge? |

See [`docs/METRICS.md`](docs/METRICS.md) for the judge prompts and score semantics.

## Project layout

```
app/                Next.js routes and pages
  api/datasets/     create / list / delete datasets
  api/runs/         evaluate a dataset, list runs, fetch a run
  api/seed/         load the sample dataset
components/         Dashboard, DatasetManager, RunDetail, Nav
lib/                metrics, judge, runner, samples, store, telemetry, langfuse-experiment
instrumentation.ts  Langfuse + OpenTelemetry registration
tests/              vitest unit tests
docs/               architecture, observability and metric definitions
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | no | Enables the LLM / Strands judge |
| `RAG_EVAL_JUDGE` | no | `heuristic` \| `llm` \| `strands` (default: `llm` when a key is present, else `heuristic`) |
| `JUDGE_MODEL` | no | Judge model id |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` | no | Tracing and score ingestion |

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — evaluation flow and modules
- [`docs/METRICS.md`](docs/METRICS.md) — metric definitions and judge prompts
- [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md) — Langfuse trace and score schema

## License

MIT © muthu manickam
