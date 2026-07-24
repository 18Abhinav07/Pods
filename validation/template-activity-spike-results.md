---
created: 2026-07-24
project: pods
ecosystem: nimiq
tags: [validation, templates, evidence, postgres, jsonb]
---

# Template Activity Compatibility Spike

Related: [[HANDOFF]] |
[[docs/superpowers/specs/2026-07-24-pods-template-activities-design]]

## Assumption

New template-specific evidence can be stored as a discriminated JSONB payload
while legacy Build submissions retain a null payload and remain readable from
their existing result and artifact columns.

## Risk if false

The activity phase would require incompatible per-template tables or an
in-place rewrite of already submitted Build evidence.

## Spike

`validation/spike-template-evidence-jsonb.ts` creates a temporary PostgreSQL
table inside a transaction, inserts representative Fitness, Reading, Study,
Build, and Practice payloads, inserts one legacy null row, reads the
discriminators back in stable order, and rolls the transaction back.

## Result

PASS.

```json
{"payloads":5,"legacyNull":true,"kinds":["fitness","reading","study","build","create",null]}
```

No persistent schema or application data changed.

## Gate decision

The compatibility assumption is empirically validated. It is safe to write the
template-activity implementation plan.
