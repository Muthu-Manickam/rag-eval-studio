# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-18

### Added
- Optional Strands Agents judge (`RAG_EVAL_JUDGE=strands`).
- Optional Langfuse dataset/experiment integration (`lib/langfuse-experiment.ts`).

## [0.3.0] - 2026-05-20

### Added
- LLM-as-a-judge via the Vercel AI SDK `generateObject` with a structured metric
  schema.
- Langfuse tracing for judge generations and score ingestion per run.

## [0.2.0] - 2026-02-24

### Added
- Metric profile radar chart and per-sample breakdown table.
- Deterministic offline estimator so evaluation works with no API key.

## [0.1.0] - 2025-12-01

### Added
- Initial release: dataset import, five RAG metrics, and the results dashboard.
