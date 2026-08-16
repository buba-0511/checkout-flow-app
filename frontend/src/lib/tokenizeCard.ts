// Real gateway sandbox API, verified directly (POST /tokens/cards, Bearer
// public key, plain HTTPS — no client-side encryption layer beyond TLS).
// This request never touches our own backend, matching PCI scope reduction.

export interface CardTokenInput {
  number: string
  cvc: string
  expMonth: string
  expYear: string
  cardHolder: string
}

export interface CardTokenResult {
  id: string
  brand: string
  lastFour: string
}

interface TokenizeSuccessResponse {
  status: 'CREATED'
  data: { id: string; brand: string; last_four: string }
}

interface TokenizeErrorResponse {
  error: { type: string; messages: Record<string, string[]> }
}

export class CardTokenizationError extends Error {
  readonly fieldErrors: Record<string, string[]>

  constructor(fieldErrors: Record<string, string[]>) {
    super('Card tokenization failed.')
    this.fieldErrors = fieldErrors
  }
}

export async function tokenizeCard(input: CardTokenInput): Promise<CardTokenResult> {
  const response = await fetch(
    `${import.meta.env.VITE_PAYMENT_GATEWAY_API_URL}/tokens/cards`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_PAYMENT_GATEWAY_PUBLIC_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: input.number,
        cvc: input.cvc,
        exp_month: input.expMonth,
        exp_year: input.expYear,
        card_holder: input.cardHolder,
      }),
    },
  )

  const payload = (await response.json()) as TokenizeSuccessResponse | TokenizeErrorResponse

  if (!response.ok || 'error' in payload) {
    throw new CardTokenizationError('error' in payload ? payload.error.messages : {})
  }

  return {
    id: payload.data.id,
    brand: payload.data.brand,
    lastFour: payload.data.last_four,
  }
}
