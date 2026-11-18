# 00 — Decisiones técnicas

Registro vivo de decisiones de arquitectura. Cada decisión indica la opción elegida, por qué, y la alternativa que se descartó. Una decisión solo se revierte con una nueva entrada que justifique el cambio. Regla de origen: ninguna dependencia entra al repositorio sin haber justificado por qué no sirve una capacidad nativa de la plataforma.

## Resumen de decisiones

| # | Ámbito | Elección | Alternativa descartada |
|---|--------|----------|------------------------|
| D1 | Gestión del monorepo | pnpm workspaces | npm workspaces, Turborepo |
| D2 | Frontend | Next.js 15 (App Router) + TypeScript | Vite SPA |
| D3 | UI y estilos | Tailwind CSS 4 + shadcn/ui | MUI, Ant Design |
| D4 | API | Hono sobre Node | Express, Fastify |
| D5 | Derivación de claves | @scure/bip39 + @scure/bip32 (cliente) | ethers.HDNode, bitcoinjs-lib |
| D6 | Interacción EVM | viem | ethers.js, web3.js |
| D7 | Datos Bitcoin | API Esplora (mempool.space) | Electrum, nodo propio |
| D8 | Persistencia backend | Postgres solo para negocio | Cachear saldos en servidor |
| D9 | Cifrado local de wallet | Argon2id + AES-256-GCM (WebCrypto/WASM) | PBKDF2 nativo |
| D10 | Contratos | Foundry | Hardhat |
| D11 | Validación en frontera API | zod (esquemas compartidos) | Validación manual, class-validator |
| D12 | Tests | vitest | node:test nativo |
| D13 | CI/CD | GitHub Actions (typecheck, lint, test) | GitLab CI, runners propios |
| D14 | Cabeceras CSP | Nonce por respuesta y bindings de hosting fijados | CSP por defecto del hosting, `unsafe-inline` |
| D15 | Recuperación sin frase semilla | Passkeys: WebAuthn PRF + ERC-4337 (a evaluar en fase 4) | Custodia de recuperación en servidor |

## Detalle y justificación

**D1 — pnpm workspaces.** pnpm aísla las dependencias por paquete (no hay "dependencias fantasma": un paquete no puede importar lo que no declaró), resuelve con enlaces duros y mantiene un solo lockfile determinista para todo el monorepo, lo que es requisito del modelo de amenazas de supply-chain. Se descartó npm workspaces porque eleva todas las dependencias a la raíz y permite importar paquetes no declarados; Turborepo se descarta en fase 0 porque no aporta nada por debajo de ~10 minutos de CI y añade un toolchain más. Se reevaluará si el tiempo de CI se acerca a ese umbral.

**D2 — Next.js 15.** La wallet es un cliente, no un sitio de contenido, pero Next aporta enrutado por archivos, estructura madura y el ecosistema donde vive shadcn/ui. La aplicación puede exportarse como estático (SPA servida desde cualquier CDN) si el panel de comercio no llega a necesitar servidor, lo que mantiene la propiedad clave: el código que maneja la seed corre íntegramente en el navegador. Se descartó Vite SPA: correcto técnicamente, pero obligaría a elegir router, herramienta de build y convenciones por separado, con menos ecosistema de componentes auditables.

**D3 — Tailwind + shadcn/ui.** shadcn/ui no es una librería opaca: el código de los componentes se copia al repositorio y se audita línea a línea, algo valioso cuando la UI muestra direcciones, montos y frases semilla. Se descartaron MUI y Ant Design por bundles pesados y sistemas de temas orientados a apps corporativas, no a interfaces financieras donde cada cifra debe ser inequívoca.

**D4 — Hono.** Framework mínimo, tipado de extremo a extremo y sin dependencias transitivas de riesgo. La API de NEXORA es deliberadamente pequeña (comercios, facturas, reputación); Hono cubre eso con menos superficie que alternativas mayores. Se descartó Express por tipado débil y ausencia de validación integrada; Fastify era viable pero Hono ofrece mejor integración con TypeScript strict y portabilidad futura a otros entornos de ejecución sin reescribir rutas.

**D5 — @scure/bip39 + @scure/bip32.** Bibliotecas auditadas, sin dependencias, diseñadas para funcionar en navegador y en Node por igual. La derivación de la seed y de las claves ocurre íntegramente en `apps/web` a través de `packages/wallet-core`; ninguna función de este paquete puede hacer peticiones de red con material criptográfico. Se descartó ethers.HDNode porque acopla la derivación a ethers (D6 cubre EVM con viem) y bitcoinjs-lib porque su BIP39 arrastra más dependencias para un uso que aquí es multi-moneda.

**D6 — viem.** Tipado estricto, árbol de dependencias ligero y utilidades puras para construir y firmar transacciones con cuenta local (sin proveedor inyectado). Se descartó ethers.js (más pesado, tipos menos estrictos) y web3.js (mantenimiento en declive). La firma EVM es lógica de firmas: todo lo que toque montos, gas o firmas tendrá tests obligatorios (ver roadmap).

**D7 — Esplora / mempool.space para BTC.** API REST simple para UTXOs, propagación de transacciones e historial, sin operar un nodo en fase 1. Es un proveedor de confianza parcial: puede mentir en saldos (mitigación en el modelo de amenazas, T6). Se descartó Electrum por la gestión de servidores y protocolo propio, y un nodo propio por coste operativo injustificable antes de validar el producto.

**D8 — Postgres solo para negocio.** El servidor almacena comercios, facturas y reputación: datos consultables y no sensibles criptográficamente. PROHIBIDO guardar claves, seeds o saldos. Se descartó cachear saldos en el servidor para mejorar UX: crea una copia del estado financiero del usuario fuera de su control, amplía la superficie de ataque y se desincroniza de la cadena. El esquema de base de datos se revisa en cada PR contra esta regla.

**D9 — Argon2id + AES-256-GCM.** La seed se cifra localmente con una clave derivada de la passphrase del usuario mediante Argon2id (resistente a GPU/ASIC) y AES-256-GCM (autenticado). Se descartó PBKDF2 nativo de WebCrypto porque sus iteraciones son insuficientes frente a atacantes con GPU. Coste aceptado: una dependencia WASM de Argon2 que se justificará y auditará en el PR de Fase 1 (no entra antes).

**D10 — Foundry.** Tests en Solidity, ejecución rápida y fuzzing nativo para el escrow 2-de-3 de Fase 3. Se descartó Hardhat: ecosistema mayor pero toolchain TypeScript más lento y más superficie de cadena de suministro (el modelo de amenazas, T2, aplica también a herramientas de build).

**D11 — zod en la frontera de la API.** Toda entrada de `apps/api` se valida con esquemas; los esquemas son la única fuente de verdad de los tipos de red. Alternativa nativa descartada: validación manual con guards escritos a mano, que escala mal y duplica lógica; class-validator se descarta por depender de decoradores y metadatos experimentales.

**D12 — vitest.** Runner de tests compatible con TypeScript sin paso de compilación, con simulación de dependencias (mocks) y cobertura, que la lógica de montos, comisiones y firmas de Fase 1 necesitará de inmediato. Alternativa nativa considerada: `node:test` (sin dependencia), hoy capaz de ejecutar TypeScript eliminando los tipos en tiempo de ejecución; se descarta porque carece de cobertura y de simulación integradas, y meterlo implicaría construir esas piezas a mano.

**D13 — GitHub Actions.** El repo ya vive en GitHub; CI nativo con typecheck, lint y tests por PR, instalación siempre con `--frozen-lockfile`. Prohibido hacer push a `main`: todo cambio entra por Pull Request con revisión. Se descartaron runners propios por coste operativo sin beneficio en esta etapa.

**D14 — CSP con nonce y bindings de hosting.** Las cabeceras Content-Security-Policy se emiten por respuesta con un nonce único por carga de página. Next.js lo exige vía middleware: sin nonce, la única alternativa es `unsafe-inline`, que anula la protección frente a XSS inyectado (ver T1 y T10). No hay scripts de terceros y los bindings del hosting quedan fijados en el repositorio, junto con un build estático reproducible cuyo hash se publica en el repo y se puede verificar, y releases firmados. Alternativa descartada: confiar en la cabecera por defecto del hosting o permitir `unsafe-inline`/`unsafe-eval`: con scripts en línea la CSP no protege nada.

**D15 — Passkeys como alternativa sin frase semilla (plan, fase 4).** Se evaluará WebAuthn PRF para cifrar el vault con una passkey y, en EVM, cuentas inteligentes (ERC-4337) con la passkey como firma, reduciendo la dependencia de la frase semilla como único factor (ver T12). Es una decisión exploratoria registrada: no se implementa antes de fase 4 y su PR llevará su propio análisis. Alternativa descartada: custodia de recuperación en servidor, incompatible con la propiedad no custodial.
