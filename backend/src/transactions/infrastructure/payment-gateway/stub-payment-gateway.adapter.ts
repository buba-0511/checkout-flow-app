import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  CreateGatewayTransactionInput,
  CreateGatewayTransactionOutput,
  PaymentGatewayPort,
} from '../../application/ports/payment-gateway.port';

// TODO: replace with a real adapter that calls the payment gateway's
// Sandbox API (POST /transactions, signed with PAYMENT_GATEWAY_PRIVATE_KEY)
// once that integration is built. This stub lets CreateTransactionUseCase
// and the rest of the checkout flow run end-to-end (and be manually
// exercised) without it — every transaction it "creates" immediately gets
// a fake gateway id and stays PENDING until something calls the webhook.
@Injectable()
export class StubPaymentGatewayAdapter implements PaymentGatewayPort {
  async createTransaction(
    _input: CreateGatewayTransactionInput,
  ): Promise<CreateGatewayTransactionOutput> {
    return { gatewayTransactionId: `stub_${randomUUID()}` };
  }
}
