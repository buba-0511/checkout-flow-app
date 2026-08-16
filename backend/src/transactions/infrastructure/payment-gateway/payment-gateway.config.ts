// Read from process.env only here (module wiring), matching how
// app.module.ts reads DATABASE_URL — everything else in this adapter is
// constructor-injected and testable without touching real env vars.
export interface PaymentGatewayConfig {
  apiUrl: string;
  publicKey: string;
  privateKey: string;
  integrityKey: string;
  eventsKey: string;
}

export const PAYMENT_GATEWAY_CONFIG = Symbol('PAYMENT_GATEWAY_CONFIG');
