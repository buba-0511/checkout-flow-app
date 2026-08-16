export interface CreateGatewayTransactionInput {
  reference: string;
  amountInCents: number;
  currency: string;
  customerEmail: string;
  // From client-side tokenization — raw card data never reaches this backend.
  cardToken: string;
  installments: number;
}

export interface CreateGatewayTransactionOutput {
  gatewayTransactionId: string;
}

// Implemented by HttpPaymentGatewayAdapter.
export interface PaymentGatewayPort {
  createTransaction(
    input: CreateGatewayTransactionInput,
  ): Promise<CreateGatewayTransactionOutput>;
}

export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');
