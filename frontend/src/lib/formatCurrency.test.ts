import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('formats cents as whole COP, with the currency symbol', () => {
    expect(formatCurrency(1899900)).toBe('$ 18.999')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$ 0')
  })
})
