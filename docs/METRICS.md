# Metrics

Five metrics are computed for every sample. Each returns a value in `[0, 1]` and
a reasoning string.

| Metric | Definition | High score means |
| --- | --- | --- |
| `faithfulness` | Every factual claim in the answer is supported by the retrieved contexts. | The answer invents nothing. |
| `answer_relevancy` | The answer directly addresses the question. | No hedging or topic drift. |
| `context_precision` | The retrieved contexts are relevant to the question and free of noise. | Retrieval returned clean evidence. |
| `context_recall` | The contexts contain all information needed to answer. | Retrieval was complete. |
| `groundedness` | The answer contains no outside/hallucinated knowledge. | The answer stays within the context. |

The overall score is the mean of the five.

## LLM judge prompt

The LLM judge (`lib/judge.ts`) asks a model to score all five metrics at once and
return structured JSON:

```
You are a rigorous RAG evaluation judge. Score the answer on five metrics, each
between 0 and 1:
- faithfulness: is every factual claim in the answer supported by the retrieved contexts?
- answer_relevancy: does the answer directly address the question?
- context_precision: are the retrieved contexts relevant and free of noise?
- context_recall: do the contexts contain all information needed to answer?
- groundedness: is the answer free of outside/hallucinated knowledge?
Return a short reasoning sentence as well.
```

The same prompt drives the Strands judge, which is asked to reply with a JSON
object containing the metric keys and a `reasoning` string.

## Offline estimator

Without an API key, `lib/metrics.ts` computes deterministic lexical proxies so
the studio and its test suite run offline:

- `groundedness` = share of answer tokens present in the contexts.
- `faithfulness` = `groundedness` (a lexical stand-in).
- `answer_relevancy` = share of answer tokens present in the question + ground truth.
- `context_precision` = share of retrieved contexts that lexically overlap the question or ground truth.
- `context_recall` = share of ground-truth tokens present in the contexts.

These are explicitly **proxies**, not semantic judgments. When a judge model is
available it replaces them with real LLM judgments.
