import { StubPaymentGatewayAdapter } from './stub-payment-gateway.adapter';

describe('StubPaymentGatewayAdapter', () => {
  it('returns a fake gateway transaction id for any input', async () => {
    const adapter = new StubPaymentGatewayAdapter();

    const output = await adapter.createTransaction({
      reference: 'ref-1',
      amountInCents: 3000,
      currency: 'COP',
      customerEmail: 'jane.doe@example.com',
    });

    expect(output.gatewayTransactionId).toEqual(expect.stringMatching(/^stub_/));
  });

  it('returns a different id on every call', async () => {
    const adapter = new StubPaymentGatewayAdapter();
    const input = {
      reference: 'ref-1',
      amountInCents: 3000,
      currency: 'COP',
      customerEmail: 'jane.doe@example.com',
    };

    const first = await adapter.createTransaction(input);
    const second = await adapter.createTransaction(input);

    expect(first.gatewayTransactionId).not.toBe(second.gatewayTransactionId);
  });
});
