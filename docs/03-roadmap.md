# 03 — Roadmap

Cada fase se cierra con Pull Requests revisados. Los criterios de aceptación son verificables por comando, observación directa o prueba reproducible; un criterio sin forma de verificarlo no entra en esta lista.

## Fase 0 — Fundamentos y documentación (actual)

**Alcance:** documentos de decisión y arquitectura, modelo de amenazas, roadmap, esqueleto del monorepo, CI, README. Sin UI ni lógica de wallet.

| Criterio de aceptación | Verificación |
|---|---|
| Existen `docs/00-decisiones.md` a `docs/03-roadmap.md` con decisiones, límites de confianza, secretos y amenazas cubiertas | Revisión del PR |
| El monorepo instala desde cero y pasa typecheck, lint y tests | `rm -rf node_modules && pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test` |
| CI en verde en cada PR con typecheck, lint y test | Historial de checks de GitHub |
| Ningún archivo de código contiene claves, seeds ni tokens | `grep -rEn "(ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|M/44'|abandon ability)" --include="*.{ts,tsx,js,json,yml}" .` no produce resultados fuera de este documento |
| No existe UI de wallet ni lógica criptográfica | Revisión del diff: solo stubs tipados |

## Fase 1 — Wallet EVM + BTC

**Alcance:** crear, importar y recuperar wallet en el cliente; cifrado local Argon2id; saldos reales, recibir, enviar e historial para EVM y BTC; direcciones derivadas de la seed y jamás enviadas al backend.

| Criterio de aceptación | Verificación |
|---|---|
| Crear wallet genera seed BIP-39 (12/24 palabras) con verificación obligatoria de copia | Flujo manual + test de `wallet-core` |
| Importar desde mnemónico y recuperar desde cifrado local funciona | Flujo manual |
| La seed se guarda cifrada con Argon2id + AES-256-GCM en IndexedDB | Test unitario del cifrado + inspección del almacén: sin passphrase no hay texto legible |
| Saldo, envío y historial reales en Sepolia y BTC testnet | Transacción EVM real en Sepolia y una BTC en testnet firmadas en el navegador |
| La clave no sale del navegador | Inspección de red en DevTools durante todo el flujo: ninguna petición contiene seed, clave privada ni passphrase; los hashes se verifican en exploradores públicos |
| Replay protegido: chainId/nonce explícitos en EVM | Tests de `wallet-core` (T4) |
| Cero secretos en el backend | Revisión de esquema de DB y del grep de CI |

## Fase 2 — QR y panel de comercio

| Criterio de aceptación | Verificación |
|---|---|
| Un comercio autenticado crea facturas con monto, moneda y dirección de cobro | Flujo manual en `apps/api` + `apps/web` |
| El QR de pago codifica URI verificable (EIP-681 en EVM, BIP-21 en BTC) ligada a la factura | Escaneo del QR y comparación contra la factura en la API |
| El pagador puede verificar que la dirección del QR coincide con la factura (mitigación de T3) | Flujo manual de verificación |
| Ningún endpoint de la API acepta ni almacena material de claves | Revisión de esquema y tests de validación zod |

## Fase 3 — Escrow 2-de-3 en EVM

| Criterio de aceptación | Verificación |
|---|---|
| Contrato de escrow 2-de-3 (comprador, vendedor, árbitro) en Solidity | `forge test` con fuzzing verde |
| Desplegado en Sepolia y usable desde la UI | Transacción real de lock/release/refund en testnet |
| El estado del escrow se lee del contrato on-chain (mitigación de T6) | Lectura directa del contrato en la UI |
| Caminos de disputa cubiertos por tests (voto árbitro a favor de cada parte y bloqueo) | Tests Foundry con cobertura de ramas de disputa |

## Fase 4 — Asistente IA de solo lectura

| Criterio de aceptación | Verificación |
|---|---|
| El asistente responde preguntas sobre el estado de la wallet usando solo datos que la app ya muestra | Flujo manual |
| No existen herramientas de escritura ni firma accesibles al asistente | Revisión del código: el contexto del asistente se construye desde datos, sin referencia a `wallet-core` de firma; test que lo verifica |
| Las consultas al modelo no incluyen direcciones ni saldos salvo consentimiento explícito por sesión | Inspección de red durante el flujo |

## Fase 5 — P2P y Earn

Condición previa: Fases 1 a 3 aprobadas y, idealmente, una revisión de seguridad externa de la wallet y del escrow. El diseño detallado se documentará en `docs/` antes de escribir código, con su propio modelo de amenazas (contrapartes no confiables).

| Criterio de aceptación | Verificación |
|---|---|
| Diseño documentado y aprobado antes de implementar | Revisión del PR de diseño |
| Todo lockeo de fondos pasa por el escrow on-chain de Fase 3, nunca por custodia de servidor | Revisión de arquitectura del PR |
