import { describe, expect, it } from "vitest";
import { WALLET_CORE_INFO } from "./index.js";

// Smoke test de fase 0: verifica que el paquete compila y exporta.
// Los tests de montos, comisiones y firmas llegan con la fase 1.
describe("wallet-core stub", () => {
  it("declara el paquete como no custodial", () => {
    expect(WALLET_CORE_INFO.nonCustodial).toBe(true);
    expect(WALLET_CORE_INFO.name).toBe("@nexora/wallet-core");
  });
});
