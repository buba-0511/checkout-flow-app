export interface CreateGatewayTransactionInput {
  reference: string;
  amountInCents: number;
  currency: string;
  customerEmail: string;
}

export interface CreateGatewayTransactionOutput {
  gatewayTransactionId: string;
}

// The outbound HTTP client to the payment gateway's Sandbox API is out of
// scope for this pass — this port defines the shape CreateTransactionUseCase
// depends on, so the real adapter (signed requests using
// PAYMENT_GATEWAY_PRIVATE_KEY) can be built later without touching
// orchestration logic. See infrastructure/payment-gateway/stub-payment-
// gateway.adapter.ts for the placeholder bound in transactions.module.ts.
export interface PaymentGatewayPort {
  createTransaction(
    input: CreateGatewayTransactionInput,
  ): Promise<CreateGatewayTransactionOutput>;
}

export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');
