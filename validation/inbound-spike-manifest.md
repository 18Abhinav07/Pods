---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [validation, inbound, deposit, testnet]
status: pass
---

# Inbound deposit validation manifest

Related: [[../README|Pods README]] | [[../docs/implementation-plan|Implementation plan]]

The canonical evidence remains in the outer project vault and was not modified
or moved during repository initialization.

```text
3f741c08d3d677aff5c1f248f0aed2ba19e6221928146d02468183cca8a4cbc4 product specification
05e3a921915b5fb80676742d1924eeaf929547de95da0f04960720b54c620551 spike results
b324326e6f4a6027f84ea546e6869ce461cc425f0316470b72d972f8c4cf119c spike protocol
```

Validated boundary:

- Two real 1 NIM payments initiated through Nimiq Pay Testnet.
- Exact recipient, value, opaque reference, network, and execution verified.
- Macro-block finality verified independently through RPC.
- Transaction-hash replay rejected.
- Nimiq Pay HTLC funding provenance recorded without treating the direct HTLC
  source as participant identity.

Not yet validated:

- Worker-originated refunds or payouts.
- Unknown broadcast recovery.
- Production RPC availability.
- Production custody controls.
