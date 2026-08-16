export type CardBrand = 'visa' | 'mastercard' | 'unknown'

/** Groups a raw card number into blocks of 4 (max 19 digits per the gateway's own pattern). */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

/** Formats expiry input as MM/YY. */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function formatCvv(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 4)
}

/** Detects the card brand from the leading digits (IIN ranges). */
export function detectCardBrand(raw: string): CardBrand {
  const digits = raw.replace(/\D/g, '')
  if (/^4/.test(digits)) return 'visa'
  // Mastercard: 51–55 or 2221–2720
  if (/^5[1-5]/.test(digits)) return 'mastercard'
  if (/^2(2[2-9]|[3-6]|7[01]|720)/.test(digits)) return 'mastercard'
  return 'unknown'
}
