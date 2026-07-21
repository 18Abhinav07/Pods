---
created: 2026-07-21
project: pods
ecosystem: nimiq
tags: [validation, phase-4, minio, evidence]
status: pass
---

# Phase 4 Private Evidence Storage Spike

Related: [[HANDOFF]] | [[docs/implementation-plan]] | [[../docs/superpowers/specs/2026-07-19-pods-cycle-i-mvp-design]]

## Assumption

The Pods Next.js server can keep evidence objects private in local MinIO while
the phone sends and retrieves evidence only through authenticated Pods routes.

## Result

`PASS`

The pinned `@aws-sdk/client-s3@3.896.0` client created a private bucket, stored
an object at a participant and occurrence scoped key, read the exact bytes back,
then removed the object and bucket.

```json
{"status":"PASS","bucketPrivateByDefault":true,"roundTrip":"private evidence round trip"}
```

Spike: `apps/web/validation/spike-phase4-minio.mts`

## Gate decision

Phase 4 may use server-mediated MinIO writes and authenticated evidence reads.
The browser does not receive MinIO credentials or a public object URL.
