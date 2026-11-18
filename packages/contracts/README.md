# @nexora/contracts

Contratos Solidity de NEXORA (Foundry). En fase 0 no hay contratos: solo la
estructura. El escrow 2-de-3 llega en fase 3 (ver `docs/03-roadmap.md`).

## Estructura prevista

- `src/`: contratos (escrow 2-de-3: comprador, vendedor, arbitro).
- `test/`: tests de Foundry con fuzzing y cobertura de disputas.
- `script/`: scripts de despliegue a testnet.

## Comandos (requieren Foundry, https://foundry.paradigm.xyz)

```
forge build
forge test
```
