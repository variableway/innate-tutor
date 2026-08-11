# T3 / T4 · Player degradation without Tutor

Date: 2026-08-10

## Contract

`openPlayerIndependently` / Catalog “打开 Player” never checks Tutor health.

| Condition | Player | Tutor Panel |
| --- | --- | --- |
| Tutor online | Opens classroom URL | Streams answers |
| Tutor down / timeout | Still opens classroom URL | Shows degraded + error; Catalog usable |
| No classroom URL | Disabled | May still use F4 fixture context for Q&A |

## Demo path

1. Open Catalog course detail (`/courses/{id}`).
2. Stop DeepTutor or point `DEEPTUTOR_WS_URL` at a closed port.
3. Click **打开 Player（不依赖 Tutor）** — classroom still opens when URL exists.
4. Click **提问** — NDJSON stream ends with `tutorUnavailable: true`; page remains interactive.

Evidence also covered by `@innate/deeptutor-adapter` unit test `player degradation`.
