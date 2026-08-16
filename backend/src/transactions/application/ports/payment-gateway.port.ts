export interface CreateGatewayTransactionInput {
  reference: string;
  amountInCents: number;
  currency: string;
  customerEmail: string;
  // Card token from client-side tokenization (browser -> gateway, public
  // key) — see CreateTransactionDto.paymentMethod. Raw card data never
  // reaches this backend.
  cardToken: string;
  installments: number;
}

export interface CreateGatewayTransactionOutput {
  gatewayTransactionId: string;
}

// Implemented for real by HttpPaymentGatewayAdapter (signed requests to
// the payment gateway's Sandbox API) — see also
// infrastructure/payment-gateway/stub-payment-gateway.adapter.ts, a
// fake implementation kept around for tests/local dev without sandbox
// credentials.
export interface PaymentGatewayPort {
  createTransaction(
    input: CreateGatewayTransactionInput,
  ): Promise<CreateGatewayTransactionOutput>;
}

export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');
