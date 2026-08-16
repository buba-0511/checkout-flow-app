import { createHash } from 'crypto';
import { PaymentGatewayConfig } from './payment-gateway.config';
import { WebhookSignatureVerifier } from './webhook-signature-verifier';

const config: PaymentGatewayConfig = {
  apiUrl: 'https://api-sandbox.example/v1',
  publicKey: 'pub_test',
  privateKey: 'prv_test',
  integrityKey: 'integrity_test',
  eventsKey: 'events_test',
};

function computeChecksum(
  concatenatedProperties: string,
  timestamp: number,
  secret: string,
): string {
  return createHash('sha256')
    .update(`${concatenatedProperties}${timestamp}${secret}`)
    .digest('hex')
    .toUpperCase();
}

describe('WebhookSignatureVerifier', () => {
  it('returns true when the checksum matches, resolving properties in order from data', () => {
    const verifier = new WebhookSignatureVerifier(config);
    const data = {
      transaction: { id: 'tx_1', status: 'APPROVED', amount_in_cents: 5000 },
    };
    const timestamp = 1530291411;
    const properties = [
      'transaction.id',
      'transaction.status',
      'transaction.amount_in_cents',
    ];
    const checksum = computeChecksum(
      'tx_1APPROVED5000',
      timestamp,
      config.eventsKey,
    );

    const result = verifier.verify({
      event: 'transaction.updated',
      data,
      timestamp,
      signature: { properties, checksum },
    });

    expect(result).toBe(true);
  });

  it('returns false when the checksum does not match', () => {
    const verifier = new WebhookSignatureVerifier(config);

    const result = verifier.verify({
      event: 'transaction.updated',
      data: { transaction: { id: 'tx_1' } },
      timestamp: 1530291411,
      signature: {
        properties: ['transaction.id'],
        checksum: 'not-the-real-checksum',
      },
    });

    expect(result).toBe(false);
  });

  it('compares the checksum case-insensitively', () => {
    const verifier = new WebhookSignatureVerifier(config);
    const timestamp = 1530291411;
    const checksum = computeChecksum('tx_1', timestamp, config.eventsKey);

    const result = verifier.verify({
      event: 'transaction.updated',
      data: { transaction: { id: 'tx_1' } },
      timestamp,
      signature: {
        properties: ['transaction.id'],
        checksum: checksum.toLowerCase(),
      },
    });

    expect(result).toBe(true);
  });

  it('resolves a missing nested property as the literal string "undefined"', () => {
    const verifier = new WebhookSignatureVerifier(config);
    const timestamp = 1530291411;
    const checksum = computeChecksum('undefined', timestamp, config.eventsKey);

    const result = verifier.verify({
      event: 'transaction.updated',
      data: { transaction: {} },
      timestamp,
      signature: { properties: ['transaction.missingField'], checksum },
    });

    expect(result).toBe(true);
  });
});
