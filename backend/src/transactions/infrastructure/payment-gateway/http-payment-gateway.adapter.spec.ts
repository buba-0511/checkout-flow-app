import { createHash } from 'crypto';
import { HttpPaymentGatewayAdapter } from './http-payment-gateway.adapter';
import { PaymentGatewayConfig } from './payment-gateway.config';

const config: PaymentGatewayConfig = {
  apiUrl: 'https://api-sandbox.example/v1',
  publicKey: 'pub_test',
  privateKey: 'prv_test',
  integrityKey: 'integrity_test',
  eventsKey: 'events_test',
};

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

const input = {
  reference: 'ref-1',
  amountInCents: 5000,
  currency: 'COP',
  customerEmail: 'jane@example.com',
  cardToken: 'tok_1',
  installments: 2,
};

describe('HttpPaymentGatewayAdapter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches an acceptance token, signs the request, and creates the transaction', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({ data: { presigned_acceptance: { acceptance_token: 'accept_123' } } }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { id: 'gw_1', status: 'PENDING' } }));

    const adapter = new HttpPaymentGatewayAdapter(config);
    const output = await adapter.createTransaction(input);

    expect(output).toEqual({ gatewayTransactionId: 'gw_1' });
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${config.apiUrl}/merchants/${config.publicKey}`);

    const expectedSignature = createHash('sha256')
      .update(`ref-15000COP${config.integrityKey}`)
      .digest('hex');
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${config.apiUrl}/transactions`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: `Bearer ${config.privateKey}`,
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      amount_in_cents: 5000,
      currency: 'COP',
      customer_email: 'jane@example.com',
      reference: 'ref-1',
      acceptance_token: 'accept_123',
      signature: expectedSignature,
      payment_method: { type: 'CARD', token: 'tok_1', installments: 2 },
    });
  });

  it('throws when the acceptance-token fetch fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(jsonResponse({ error: 'nope' }, false, 500));

    const adapter = new HttpPaymentGatewayAdapter(config);

    await expect(adapter.createTransaction(input)).rejects.toThrow(
      'acceptance-token fetch failed (500)',
    );
  });

  it('throws when transaction creation fails', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({ data: { presigned_acceptance: { acceptance_token: 'accept_123' } } }),
      )
      .mockResolvedValueOnce(jsonResponse({ error: { reason: 'INVALID_TOKEN' } }, false, 422));

    const adapter = new HttpPaymentGatewayAdapter(config);

    await expect(adapter.createTransaction(input)).rejects.toThrow(
      'transaction creation failed (422)',
    );
  });
});
