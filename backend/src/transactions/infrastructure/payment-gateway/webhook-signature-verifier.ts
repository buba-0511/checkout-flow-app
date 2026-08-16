import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  PAYMENT_GATEWAY_CONFIG,
  type PaymentGatewayConfig,
} from './payment-gateway.config';

export interface WebhookEventEnvelope {
  event: string;
  data: object;
  timestamp: number;
  signature: {
    properties: string[];
    checksum: string;
  };
}

// SHA256(concat(signature.properties resolved from data) + timestamp +
// events_secret) — properties is dynamic per event, never hardcoded.
const MAX_EVENT_AGE_SECONDS = 300;

@Injectable()
export class WebhookSignatureVerifier {
  constructor(
    @Inject(PAYMENT_GATEWAY_CONFIG)
    private readonly config: PaymentGatewayConfig,
  ) {}

  verify(event: WebhookEventEnvelope): boolean {
    if (!this.isFresh(event.timestamp)) {
      return false;
    }

    const concatenatedProperties = event.signature.properties
      .map((path) => this.resolve(event.data, path))
      .join('');
    const raw = `${concatenatedProperties}${event.timestamp}${this.config.eventsKey}`;
    const expected = createHash('sha256')
      .update(raw)
      .digest('hex')
      .toUpperCase();
    return expected === event.signature.checksum.toUpperCase();
  }

  // Rejects an old, previously-valid payload replayed later.
  private isFresh(timestamp: number): boolean {
    const ageSeconds = Date.now() / 1000 - timestamp;
    return ageSeconds >= 0 && ageSeconds <= MAX_EVENT_AGE_SECONDS;
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
