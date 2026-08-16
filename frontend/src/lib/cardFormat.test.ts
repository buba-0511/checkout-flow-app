import { detectCardBrand, formatCardNumber, formatCvv, formatExpiry } from './cardFormat'

describe('formatCardNumber', () => {
  it('groups digits into blocks of 4', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242')
  })

  it('strips non-digit characters', () => {
    expect(formatCardNumber('4242-4242 4242.4242')).toBe('4242 4242 4242 4242')
  })

  it('caps at 19 digits', () => {
    expect(formatCardNumber('1'.repeat(25))).toBe('1111 1111 1111 1111 111')
  })
})

describe('formatExpiry', () => {
  it('returns raw digits under 3 characters', () => {
    expect(formatExpiry('1')).toBe('1')
    expect(formatExpiry('12')).toBe('12')
  })

  it('inserts a slash after the month', () => {
    expect(formatExpiry('1229')).toBe('12/29')
  })

  it('strips non-digits and caps at 4 digits', () => {
    expect(formatExpiry('12/2029')).toBe('12/20')
  })
})

describe('formatCvv', () => {
  it('strips non-digits and caps at 4 digits', () => {
    expect(formatCvv('12a3-456')).toBe('1234')
  })
})

describe('detectCardBrand', () => {
  it('detects visa from a leading 4', () => {
    expect(detectCardBrand('4242424242424242')).toBe('visa')
  })

  it('detects mastercard from the 51-55 range', () => {
    expect(detectCardBrand('5105105105105100')).toBe('mastercard')
  })

  it('detects mastercard from the 2221-2720 range', () => {
    expect(detectCardBrand('2223000048400011')).toBe('mastercard')
  })

  it('returns unknown for anything else', () => {
    expect(detectCardBrand('6011000000000004')).toBe('unknown')
    expect(detectCardBrand('')).toBe('unknown')
  })
})
