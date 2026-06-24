# Observability

RAG Eval Studio reports to **Langfuse** when `LANGFUSE_PUBLIC_KEY` and
`LANGFUSE_SECRET_KEY` are set. Without them, tracing and score ingestion are
no-ops.

## Setup

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

`instrumentation.ts` registers an `AsyncLocalStorage` context manager, a
`BasicTracerProvider` with the Langfuse `LangfuseSpanProcessor`, and the AI SDK
telemetry integration, so each `generateObject` call in the LLM judge is captured
as a generation automatically.

## What gets traced

| Activity | Observation | Source |
| --- | --- | --- |
| LLM judge call | generation | AI SDK telemetry (`generateObject`) |
| Strands judge | agent | `traceAgent()` in `lib/telemetry.ts` |

## Scores

`runner.evaluateDataset()` pushes the following scores via `lib/telemetry.ts`:

| Score | Meaning |
| --- | --- |
| `eval_overall` | mean of the five metrics across the dataset |
| `eval_faithfulness` | dataset average faithfulness |
| `eval_answer_relevancy` | dataset average answer relevancy |
| `eval_context_precision` | dataset average context precision |
| `eval_context_recall` | dataset average context recall |
| `eval_groundedness` | dataset average groundedness |

Score ingestion is best-effort and never fails a run.

## Datasets and experiments

`lib/langfuse-experiment.ts` contains an optional integration with the Langfuse
dataset/experiment API (`@langfuse/client` `experiment.run`). When the SDK
exposes the experiment API, an evaluation can be run as a named Langfuse
experiment so consecutive runs are directly comparable in the Langfuse UI. It
reports `{ ran: false, reason }` when the API or credentials are unavailable.

## Why tracing and evaluation belong together

A faithful evaluation needs the question, the answer **and** the retrieved
context. Keeping evaluation scores next to the trace that produced the answer
means a regression can be traced back to the retrieval step that caused it,
rather than only to the final number.
