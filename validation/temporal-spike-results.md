---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [validation, temporal, schedule, phase-1]
---

# Temporal Schedule Spike Results

Related: [[docs/implementation-plan|Pods implementation plan]] | [[../docs/superpowers/specs/2026-07-19-pods-cycle-i-mvp-design|Cycle I product specification]]

## Assumption

`@js-temporal/polyfill@0.5.1` can freeze local-day Pod occurrences into exact
UTC instants without treating every calendar day as 24 elapsed hours.

## Result

PASS.

- Spike: `packages/domain/tests/spike-temporal.test.ts`
- Normal input: `2026-03-08` in UTC produced a 24-hour window.
- DST input: `2026-03-08` in `America/New_York` produced the correct 23-hour
  spring-transition window.
- Evidence: 2 of 2 tests passed on two consecutive runs.

## Gate decision

The Phase 1 occurrence materializer may use Temporal and persist its resulting
UTC instants before publication.
