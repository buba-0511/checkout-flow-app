import { CardTokenizationError, tokenizeCard } from './tokenizeCard'

const input = {
  number: '4242424242424242',
  cvc: '123',
  expMonth: '08',
  expYear: '29',
  cardHolder: 'Test User',
}

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('tokenizeCard', () => {
  it('posts the card fields in the gateway shape and returns the token', async () => {
    mockFetchOnce(201, {
      status: 'CREATED',
      data: { id: 'tok_123', brand: 'VISA', last_four: '4242' },
    })

    const result = await tokenizeCard(input)

    expect(result).toEqual({ id: 'tok_123', brand: 'VISA', lastFour: '4242' })
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/tokens/cards')
    expect(options.method).toBe('POST')
    expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect((options.headers as Record<string, string>).Authorization).toMatch(/^Bearer /)
    expect(JSON.parse(options.body as string)).toEqual({
      number: '4242424242424242',
      cvc: '123',
      exp_month: '08',
      exp_year: '29',
      card_holder: 'Test User',
    })
  })

  it('throws CardTokenizationError with the field messages on validation failure', async () => {
    mockFetchOnce(422, {
      error: { type: 'INPUT_VALIDATION_ERROR', messages: { number: ['invalid'] } },
    })

    await expect(tokenizeCard(input)).rejects.toBeInstanceOf(CardTokenizationError)
    await expect(tokenizeCard(input)).rejects.toMatchObject({
      fieldErrors: { number: ['invalid'] },
    })
  })
})
