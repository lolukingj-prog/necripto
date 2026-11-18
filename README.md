# NEXORA

Ecosistema financiero **no custodial**: la wallet vive en el navegador del
usuario y las claves jamas salen de su dispositivo. El servidor no custodia
claves, ni seeds, ni saldos; por diseno, un compromiso total del backend no
expone fondos.

## Estado

Fase 0 en curso: documentacion de fundamentos y esqueleto del monorepo con CI.
Ver `docs/03-roadmap.md` para el plan completo con criterios de aceptacion
verificables por fase.

## Stack

| Capa | Tecnologia |
|---|---|
| Frontend | Next.js 15, TypeScript strict, Tailwind CSS 4, shadcn/ui |
| API | Hono sobre Node |
| Wallet (cliente) | @scure/bip39 + @scure/bip32, viem (EVM), Esplora/mempool.space (BTC) |
| Contratos | Foundry (escrow 2-de-3 en fase 3) |
| Persistencia | Postgres, SOLO comercios/facturas/reputacion |
| CI | GitHub Actions: typecheck, lint, test, deteccion de secretos |

La justificacion de cada decision y su alternativa descartada esta en
`docs/00-decisiones.md`.

## Estructura del monorepo

```
apps/web           Next.js: interfaz de la wallet (todo en el navegador)
apps/api           Hono: comercios, facturas, reputacion (sin criptografia)
packages/wallet-core  Derivacion y firma de la wallet (codigo puro, testeable)
packages/contracts    Contratos Solidity (Foundry)
packages/ui           Componentes de interfaz auditables
docs/                 Decisiones, arquitectura, threat model, roadmap
```

Regla critica: `apps/api` nunca importa `wallet-core` ni ninguna libreria
criptografica de wallet. Ver `docs/01-arquitectura.md` para los limites de
confianza y la ubicacion de cada secreto.

## Comandos

Requiere Node 22+ y pnpm 9 (se activa con `corepack enable`).

```
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm dev      # (proximamente: web en :3000, api en :3001)
```

## Reglas de contribucion

- Un PR por tarea, maximo 400 lineas de diff, Conventional Commits.
- Prohibido push a `main`: todo cambio entra por Pull Request revisado.
- Prohibido confirmar claves, seeds o tokens: CI lo detecta y rechaza.
- Toda logica de montos, comisiones o firmas lleva tests obligatorios.
- Nada simulado sin el prefijo `MOCK` y un `TODO` indicando que API real falta.
- Interfaz en espanol. Sin emojis en el codigo.
