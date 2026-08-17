import { computeFees, countItems, resolveCartLines } from './cart'
import type { CartLine } from '../features/checkout/checkoutSlice'

const line: CartLine = {
  productId: 'p1',
  name: 'Widget',
  priceInCents: 1000,
  imageUrl: 'http://x/widget.jpg',
  stock: 7,
  quantity: 3,
}

describe('resolveCartLines', () => {
  it('resolves the line total from price and quantity', () => {
    const [resolved] = resolveCartLines([line])

    expect(resolved.lineTotalInCents).toBe(3000)
    expect(resolved.line).toBe(line)
  })
})

describe('countItems', () => {
  it('sums quantity across lines', () => {
    expect(countItems([line, { ...line, productId: 'p2', quantity: 2 }])).toBe(5)
  })

  it('returns 0 for an empty cart', () => {
    expect(countItems([])).toBe(0)
  })
})

describe('computeFees', () => {
  it('adds the base and delivery fee on top of the subtotal when the cart has items', () => {
    const lines = resolveCartLines([line])

    expect(computeFees(lines)).toEqual({
      subtotalInCents: 3000,
      baseFeeInCents: 300000,
      deliveryFeeInCents: 800000,
      totalInCents: 1103000,
    })
  })

  it('charges no fees for an empty cart', () => {
    expect(computeFees([])).toEqual({
      subtotalInCents: 0,
      baseFeeInCents: 0,
      deliveryFeeInCents: 0,
      totalInCents: 0,
    })
  })
})
