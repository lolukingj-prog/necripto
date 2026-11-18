/**
 * Stub de fase 0: sin logica criptografica todavia.
 * En fase 1 este paquete incorporara la derivacion bip39/bip32,
 * la firma EVM con viem y el cliente Esplora para BTC.
 * Regla del paquete: codigo puro, sin DOM ni peticiones con
 * material criptografico (ver docs/01-arquitectura.md).
 */
export interface WalletCoreInfo {
  name: string;
  nonCustodial: true;
  version: string;
}

export const WALLET_CORE_INFO: WalletCoreInfo = {
  name: "@nexora/wallet-core",
  nonCustodial: true,
  version: "0.1.0",
} as const;
