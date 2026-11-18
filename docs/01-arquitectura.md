# 01 — Arquitectura

## Diagrama de módulos

```
+------------------------------------------------------------------+
|                 DISPOSITIVO DEL USUARIO (confianza ALTA)          |
|         aqui vive todo el material criptografico                  |
|                                                                   |
|   apps/web (Next.js 15, TS, Tailwind + shadcn/ui)                 |
|    +---------------------+       +------------------------------+ |
|    | UI (componentes     | <---> | packages/wallet-core         | |
|    | auditables, en      |       |  - derivacion bip39/bip32    | |
|    | packages/ui)        |       |  - firma EVM (viem)          | |
|    +---------------------+       |  - cliente Esplora (BTC)     | |
|                                  +---------------+--------------+ |
|                                                  |               |
+--------------------------------------------------+---------------+
                                                   |
                      HTTPS, solo datos publicos   |   HTTPS
                    +------------------------------+    |
                    |                                  |
        +-----------+------------+          +----------+---------+
        | apps/api (Hono)        |          | RPC publico EVM    |
        | comercios, facturas,   |          | (Sepolia/mainnet)  |
        | reputacion             |          | confianza PARCIAL  |
        |         |              |          +--------------------+
        |   Postgres (negocio)   |
        +------------------------+          +--------------------+
                                            | Esplora/mempool    |
                                            | (BTC)              |
                                            | confianza PARCIAL  |
                                            +--------------------+
```

## Límites de confianza

| Zona | Nivel de confianza | Qué se asume |
|------|--------------------|--------------|
| `apps/web` + `wallet-core` en el navegador | Alto (código propio, auditado) | Es la única zona donde existe la seed o las claves derivadas. Si el navegador está comprometido (malware/XSS), el activo local queda expuesto: se mitiga pero no se elimina (ver T1/T2). |
| `apps/api` + Postgres | Confianza baja como custodio | Por diseño no recibe material criptográfico. Un compromiso total del servidor NO expone fondos; a lo sumo corrompe facturas y reputación (T7). |
| RPC EVM y Esplora | Parcial | Pueden mentir en saldos, nonces o propagación de transacciones. Toda lectura crítica se verifica on-chain tras firmar (T6). |
| Nodo Foundry / contratos (Fase 3) | Alto en código, verificable | El escrow 2-de-3 se audita con tests y fuzzing antes de tocar mainnet. |

La propiedad fundacional: **la confianza alta reside en el dispositivo, no en el servidor**. Ninguna ruta de red transporta seed, claves privadas ni passphrase, ni en las cabeceras, ni en el cuerpo, ni en los registros.

## Dónde vive cada secreto

| Secreto | Dónde vive | Dónde PROHIBIDO que viva |
|---------|-----------|--------------------------|
| Frase semilla BIP-39 | Memoria del navegador mientras se usa; en reposo, cifrada en IndexedDB con AES-256-GCM usando la clave Argon2id de la passphrase del usuario | Servidor, Postgres, logs, telemetría, CI, código |
| Passphrase de cifrado | Memoria del usuario mientras usa la wallet | Persistencia alguna; no hay recuperación de servidor (renuncia consciente de la no custodia) |
| Claves privadas EVM/BTC | Memoria, derivadas bajo demanda desde la seed | Servidor, base de datos, tests, fixtures |
| Tokens de GitHub / CI | Secrets de GitHub Actions; entorno local del desarrollador | Repositorio, commits, scripts, documentación |
| Credenciales de Postgres | Variables de entorno del despliegue de `apps/api` | Repositorio (`.env` ignorado por git), código |
| Clave de firma de despliegue de contratos (Fase 3) | Cuenta efímera de testnet solo en CI; en mainnet, hardware wallet | CI, archivos, variables de build |

## Reglas de dependencia entre módulos

- `apps/web` puede importar `packages/wallet-core` y `packages/ui`. Es el único módulo que orquesta la wallet.
- `packages/wallet-core` no importa de `apps/*`; no accede al DOM ni abre conexiones salvo el cliente Esplora declarado explícitamente. Es código puro y por eso 100% testeable.
- `apps/api` NO importa `wallet-core` ni ninguna librería criptográfica de wallet: el backend no necesita firmar nada. Si un PR añade esa dependencia, el PR está mal por definición.
- `packages/contracts` (Foundry) es autónomo: Solidity y sus tests. El frontend lo consume vía ABIs generados, nunca reimplementando la lógica del contrato.
- `packages/ui` no contiene lógica de negocio ni criptografía: solo presentación.

## Flujo de una transacción (visión de Fase 1)

1. El usuario desbloquea la wallet con su passphrase; Argon2id deriva la clave y se descifra la seed en memoria.
2. `wallet-core` deriva la cuenta correspondiente (BIP-32/bip44 para EVM, BIP-84 para BTC) y construye la transacción con viem o con el cliente Esplora.
3. La firma ocurre en el navegador. A la red solo sale la transacción ya firmada.
4. `apps/api`, si interviene (por ejemplo una factura), solo recibe hashes de transacción y direcciones públicas para conciliar el pago con la factura.
