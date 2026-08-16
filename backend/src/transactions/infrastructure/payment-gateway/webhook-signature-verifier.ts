import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_GATEWAY_CONFIG, type PaymentGatewayConfig } from './payment-gateway.config';

export interface WebhookEventEnvelope {
  event: string;
  data: object;
  timestamp: number;
  signature: {
    properties: string[];
    checksum: string;
  };
}

// Verifies a webhook event actually came from the payment gateway: the
// gateway signs each event with SHA256(concat(...signature.properties
// resolved from data, in order) + timestamp + events_secret) — see
// docs/colombia/eventos. properties is dynamic per event type (e.g.
// ["transaction.id", "transaction.status", "transaction.amount_in_cents"]),
// so it must be read from the payload, never hardcoded.
@Injectable()
export class WebhookSignatureVerifier {
  constructor(
    @Inject(PAYMENT_GATEWAY_CONFIG)
    private readonly config: PaymentGatewayConfig,
  ) {}

  verify(event: WebhookEventEnvelope): boolean {
    const concatenatedProperties = event.signature.properties
      .map((path) => this.resolve(event.data, path))
      .join('');
    const raw = `${concatenatedProperties}${event.timestamp}${this.config.eventsKey}`;
    const expected = createHash('sha256').update(raw).digest('hex').toUpperCase();
    return expected === event.signature.checksum.toUpperCase();
  }

  private resolve(data: object, dotPath: string): string {
    const value = dotPath.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, data);
    return String(value);
  }
}
