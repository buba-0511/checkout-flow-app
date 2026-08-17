import type { CartLine } from '../features/checkout/checkoutSlice'

export interface ResolvedCartLine {
  line: CartLine
  lineTotalInCents: number
}

export interface Fees {
  subtotalInCents: number
  baseFeeInCents: number
  deliveryFeeInCents: number
  totalInCents: number
}

// Preview only, must match backend/src/transactions/application/use-cases/
// create-transaction.use-case.ts — the amount actually charged always comes
// from the created Transaction, never from this client-side estimate.
const BASE_FEE_IN_CENTS = 300000
const DELIVERY_FEE_IN_CENTS = 800000

export function resolveCartLines(cart: CartLine[]): ResolvedCartLine[] {
  return cart.map((line) => ({
    line,
    lineTotalInCents: line.priceInCents * line.quantity,
  }))
}

export function countItems(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0)
}

export function computeFees(lines: ResolvedCartLine[]): Fees {
  const subtotalInCents = lines.reduce((sum, l) => sum + l.lineTotalInCents, 0)
  const hasItems = lines.length > 0
  const baseFeeInCents = hasItems ? BASE_FEE_IN_CENTS : 0
  const deliveryFeeInCents = hasItems ? DELIVERY_FEE_IN_CENTS : 0
  return {
    subtotalInCents,
    baseFeeInCents,
    deliveryFeeInCents,
    totalInCents: subtotalInCents + baseFeeInCents + deliveryFeeInCents,
  }
}
