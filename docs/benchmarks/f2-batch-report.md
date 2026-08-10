# F2 Batch Benchmark Report

- Generated: 2026-08-09T20:13:34.844996+00:00
- Model/path: `openai:MiniMax-M3 (minimax-codex via LLM_*; Volcengine Unauthorized / Xiaomi anthropic 404 during probe)`
- Samples: 10
- Passed: 7 / 10 (70%)
- Decision: **Go**

## Rationale

- pass_rate=70% meets >=70% bar

## Failure classes

- `provider`: 3

## Samples

| ID | Kind | OK | Latency(s) | Class | Rubric | Classroom |
| --- | --- | --- | --- | --- | --- | --- |
| b01 | knowledge | N | 915.8 | provider | 2/8 | - |
| b02 | quiz | Y | 271.6 | - | 6/8 | s2wgRdKQ1m |
| b03 | material | Y | 478.0 | - | 6/8 | ko7DlEQgXq |
| b04 | knowledge | Y | 498.1 | - | 6/8 | xJ4Ugib1Mq |
| b05 | quiz | Y | 155.9 | - | 6/8 | A99uUPPOly |
| b06 | material | N | 1825.8 | provider | 2/8 | - |
| b07 | knowledge | Y | 830.4 | - | 6/8 | _cWY_tW9JT |
| b08 | quiz | Y | 201.3 | - | 6/8 | unnWFwGw2V |
| b09 | material | Y | 568.5 | - | 6/8 | -qkAD3iu0D |
| b10 | knowledge | N | 1373.6 | provider | 2/8 | - |

## Rubric notes

Heuristic automated rubric (openable / scene_count / chinese / kind_fit).
Quiz detection is string-based; human spot-check recommended for Go decisions near threshold.

JSON: `docs/benchmarks/f2-batch-report.json`
