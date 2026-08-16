import { hasErrors, validateCard, validateCustomer, validateDelivery } from './checkoutValidation'
import { LegalIdType, type CustomerInput, type DeliveryInput } from '../api/resources'

const validCustomer: CustomerInput = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+573001234567',
  legalId: '1234567890',
  legalIdType: LegalIdType.CC,
}

const validDelivery: DeliveryInput = {
  address: 'Calle 123',
  city: 'Bogotá',
  region: 'Cundinamarca',
}

const validCard = {
  number: '4242 4242 4242 4242',
  expiry: '12/29',
  cvv: '123',
  cardHolder: 'Jane Doe',
}

describe('validateCustomer', () => {
  it('returns no errors for valid input', () => {
    expect(hasErrors(validateCustomer(validCustomer))).toBe(false)
  })

  it('requires fullName, email, phone, and legalId', () => {
    const errors = validateCustomer({ ...validCustomer, fullName: '', email: '', phone: '', legalId: '' })
    expect(errors.fullName).toBeDefined()
    expect(errors.email).toBeDefined()
    expect(errors.phone).toBeDefined()
    expect(errors.legalId).toBeDefined()
  })

  it('rejects a malformed email', () => {
    expect(validateCustomer({ ...validCustomer, email: 'not-an-email' }).email).toBeDefined()
  })

  it('rejects a too-short phone number', () => {
    expect(validateCustomer({ ...validCustomer, phone: '123' }).phone).toBeDefined()
  })
})

describe('validateDelivery', () => {
  it('returns no errors for valid input', () => {
    expect(hasErrors(validateDelivery(validDelivery))).toBe(false)
  })

  it('requires address, city, and region', () => {
    const errors = validateDelivery({ address: '', city: '', region: '' })
    expect(errors.address).toBeDefined()
    expect(errors.city).toBeDefined()
    expect(errors.region).toBeDefined()
  })
})

describe('validateCard', () => {
  it('returns no errors for valid input', () => {
    expect(hasErrors(validateCard(validCard))).toBe(false)
  })

  it('requires a card number of 12-19 digits', () => {
    expect(validateCard({ ...validCard, number: '' }).number).toBeDefined()
    expect(validateCard({ ...validCard, number: '4242' }).number).toBeDefined()
  })

  it('requires a cardholder name', () => {
    expect(validateCard({ ...validCard, cardHolder: '' }).cardHolder).toBeDefined()
  })

  it('requires MM/YY expiry format', () => {
    expect(validateCard({ ...validCard, expiry: '' }).expiry).toBeDefined()
    expect(validateCard({ ...validCard, expiry: '13/29' }).expiry).toBeDefined()
    expect(validateCard({ ...validCard, expiry: '1229' }).expiry).toBeDefined()
  })

  it('rejects an expired card', () => {
    expect(validateCard({ ...validCard, expiry: '01/20' }).expiry).toBe('Card has expired.')
  })

  it('requires a 3-4 digit cvv', () => {
    expect(validateCard({ ...validCard, cvv: '' }).cvv).toBeDefined()
    expect(validateCard({ ...validCard, cvv: '12' }).cvv).toBeDefined()
  })
})

describe('hasErrors', () => {
  it('returns true when there is at least one error', () => {
    expect(hasErrors({ fullName: 'required' })).toBe(true)
  })

  it('returns false for an empty errors object', () => {
    expect(hasErrors({})).toBe(false)
  })
})
