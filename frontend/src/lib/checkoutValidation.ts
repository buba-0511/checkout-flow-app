import type { CustomerInput, DeliveryInput } from '../api/resources'

export interface CardInput {
  number: string
  expiry: string
  cvv: string
  cardHolder: string
}

export type Errors<T> = Partial<Record<keyof T, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCustomer(customer: CustomerInput): Errors<CustomerInput> {
  const errors: Errors<CustomerInput> = {}

  if (!customer.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!customer.email.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(customer.email)) errors.email = 'Enter a valid email.'
  if (!customer.phone.trim()) errors.phone = 'Phone is required.'
  else if (customer.phone.replace(/\D/g, '').length < 7) errors.phone = 'Enter a valid phone.'
  if (!customer.legalId.trim()) errors.legalId = 'ID number is required.'

  return errors
}

export function validateDelivery(delivery: DeliveryInput): Errors<DeliveryInput> {
  const errors: Errors<DeliveryInput> = {}

  if (!delivery.address.trim()) errors.address = 'Address is required.'
  if (!delivery.city.trim()) errors.city = 'City is required.'
  if (!delivery.region.trim()) errors.region = 'Region is required.'

  return errors
}

export function validateCard(card: CardInput): Errors<CardInput> {
  const errors: Errors<CardInput> = {}
  const digits = card.number.replace(/\D/g, '')

  if (!digits) errors.number = 'Card number is required.'
  else if (digits.length < 12 || digits.length > 19) errors.number = 'Enter a valid card number.'

  if (!card.cardHolder.trim()) errors.cardHolder = 'Cardholder name is required.'

  if (!card.expiry) {
    errors.expiry = 'Expiry is required.'
  } else {
    const match = /^(\d{2})\/(\d{2})$/.exec(card.expiry)
    if (!match) {
      errors.expiry = 'Use MM/YY format.'
    } else {
      const month = Number(match[1])
      const year = 2000 + Number(match[2])
      if (month < 1 || month > 12) {
        errors.expiry = 'Invalid month.'
      } else if (new Date(year, month, 0, 23, 59, 59) < new Date()) {
        errors.expiry = 'Card has expired.'
      }
    }
  }

  if (!card.cvv) errors.cvv = 'CVV is required.'
  else if (card.cvv.length < 3) errors.cvv = 'CVV must be 3–4 digits.'

  return errors
}

export function hasErrors<T>(errors: Errors<T>): boolean {
  return Object.keys(errors).length > 0
}
