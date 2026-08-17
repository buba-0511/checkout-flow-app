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

export interface GatewayTransactionStatus {
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
}

// Implemented by HttpPaymentGatewayAdapter.
export interface PaymentGatewayPort {
  createTransaction(
    input: CreateGatewayTransactionInput,
  ): Promise<CreateGatewayTransactionOutput>;

  // Pulls the current status directly — the fallback path for when the
  // gateway's webhook never arrives (see ReconcileTransactionStatusUseCase).
  getTransactionStatus(
    gatewayTransactionId: string,
  ): Promise<GatewayTransactionStatus>;
}

export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');
