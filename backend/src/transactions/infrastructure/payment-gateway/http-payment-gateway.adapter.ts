import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  CreateGatewayTransactionInput,
  CreateGatewayTransactionOutput,
  PaymentGatewayPort,
} from '../../application/ports/payment-gateway.port';
import { PAYMENT_GATEWAY_CONFIG, type PaymentGatewayConfig } from './payment-gateway.config';

interface AcceptanceTokenResponse {
  data: {
    presigned_acceptance: { acceptance_token: string };
  };
}

interface CreateGatewayTransactionResponse {
  data: { id: string; status: string };
}

// Real adapter for the payment gateway's Sandbox REST API
// (docs: quick-start / environments-and-keys / payment-sources / payment-
// methods / events, referenced from the test brief). Card tokenization
// happens client-side (browser -> gateway, public key) before this is ever
// called — this adapter only ever sees the resulting token, never raw card
// data.
//
// Two calls per transaction: fetch a fresh acceptance token (required on
// every transaction, not cached — it's short-lived and tied to a specific
// merchant/user consent flow), then POST the transaction itself, signed
// with the integrity key.
@Injectable()
export class HttpPaymentGatewayAdapter implements PaymentGatewayPort {
  constructor(
    @Inject(PAYMENT_GATEWAY_CONFIG)
    private readonly config: PaymentGatewayConfig,
  ) {}

  async createTransaction(
    input: CreateGatewayTransactionInput,
  ): Promise<CreateGatewayTransactionOutput> {
    const acceptanceToken = await this.fetchAcceptanceToken();
    const signature = this.computeIntegritySignature(input);

    const response = await fetch(`${this.config.apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.privateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount_in_cents: input.amountInCents,
        currency: input.currency,
        customer_email: input.customerEmail,
        reference: input.reference,
        acceptance_token: acceptanceToken,
        signature,
        payment_method: {
          type: 'CARD',
          token: input.cardToken,
          installments: input.installments,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Payment gateway transaction creation failed (${response.status}): ${body}`,
      );
    }

    const payload = (await response.json()) as CreateGatewayTransactionResponse;
    return { gatewayTransactionId: payload.data.id };
  }

  private async fetchAcceptanceToken(): Promise<string> {
    const response = await fetch(`${this.config.apiUrl}/merchants/${this.config.publicKey}`);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Payment gateway acceptance-token fetch failed (${response.status}): ${body}`,
      );
    }

    const payload = (await response.json()) as AcceptanceTokenResponse;
    return payload.data.presigned_acceptance.acceptance_token;
  }

  // SHA256(reference + amount_in_cents + currency + integrity_secret), per
  // the gateway's integrity-signature spec — validates the transaction
  // amount/reference weren't tampered with in transit.
  private computeIntegritySignature(input: CreateGatewayTransactionInput): string {
    const raw = `${input.reference}${input.amountInCents}${input.currency}${this.config.integrityKey}`;
    return createHash('sha256').update(raw).digest('hex');
  }
}
