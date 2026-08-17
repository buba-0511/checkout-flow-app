import { useState } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Field } from '../components/molecules/Field'
import { CardBrandMark } from '../components/atoms/CardBrandMark'
import { Button } from '../components/atoms/Button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { goToStep, resetCheckout, setCustomer, setDelivery, setPaymentMethod } from '../features/checkout/checkoutSlice'
import { LegalIdType, type CustomerInput, type DeliveryInput } from '../api/resources'
import { detectCardBrand, formatCardNumber, formatCvv, formatExpiry } from '../lib/cardFormat'
import { CardTokenizationError, tokenizeCard, type CardTokenInput } from '../lib/tokenizeCard'
import {
  hasErrors,
  validateCard,
  validateCustomer,
  validateDelivery,
  type CardInput,
} from '../lib/checkoutValidation'

const ID_TYPES: { value: (typeof LegalIdType)[keyof typeof LegalIdType]; label: string }[] = [
  { value: LegalIdType.CC, label: 'Cédula de ciudadanía' },
  { value: LegalIdType.CE, label: 'Cédula de extranjería' },
  { value: LegalIdType.NIT, label: 'NIT' },
  { value: LegalIdType.PASSPORT, label: 'Passport' },
]

const INSTALLMENT_OPTIONS = [1, 3, 6, 12]

const emptyCustomer: CustomerInput = {
  fullName: '',
  email: '',
  phone: '',
  legalId: '',
  legalIdType: LegalIdType.CC,
}

const emptyDelivery: DeliveryInput = { address: '', city: '', region: '' }
const emptyCard: CardInput = { number: '', expiry: '', cvv: '', cardHolder: '' }

export function CheckoutDetailsPage() {
  const dispatch = useAppDispatch()
  const cartCount = useAppSelector((state) => state.checkout.cart.length)

  const [customer, setCustomerState] = useState(emptyCustomer)
  const [delivery, setDeliveryState] = useState(emptyDelivery)
  const [card, setCardState] = useState(emptyCard)
  const [installments, setInstallments] = useState(1)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [tokenizing, setTokenizing] = useState(false)
  const [tokenizeError, setTokenizeError] = useState<string | null>(null)

  const customerErrors = validateCustomer(customer)
  const deliveryErrors = validateDelivery(delivery)
  const cardErrors = validateCard(card)
  const brand = detectCardBrand(card.number)

  const show = (key: string) => submitted || touched[key]
  const markTouched = (key: string) => setTouched((t) => ({ ...t, [key]: true }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setTokenizeError(null)

    if (hasErrors(customerErrors) || hasErrors(deliveryErrors) || hasErrors(cardErrors)) {
      return
    }

    const [expMonth, expYear] = card.expiry.split('/')
    const tokenizeInput: CardTokenInput = {
      number: card.number.replace(/\D/g, ''),
      cvc: card.cvv,
      expMonth,
      expYear,
      cardHolder: card.cardHolder,
    }

    setTokenizing(true)
    try {
      const token = await tokenizeCard(tokenizeInput)
      dispatch(setCustomer(customer))
      dispatch(setDelivery(delivery))
      dispatch(
        setPaymentMethod({
          cardToken: token.id,
          cardBrand: token.brand,
          cardLastFour: token.lastFour,
          installments,
        }),
      )
      dispatch(goToStep('summary'))
    } catch (err) {
      if (err instanceof CardTokenizationError) {
        setTokenizeError('Please check your card details and try again.')
      } else {
        setTokenizeError('Could not process the card right now. Try again.')
      }
    } finally {
      setTokenizing(false)
    }
  }

  return (
    <Layout
      header={
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            aria-label="Back to catalog"
            onClick={() => dispatch(resetCheckout())}
            className="grid size-9 place-items-center rounded-full text-neutral hover:bg-neutral-soft"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <h2 className="font-heading text-lg font-semibold">Checkout</h2>
          <span className="ml-auto flex items-center gap-1 text-xs text-neutral-muted">
            <Lock className="size-3.5" aria-hidden="true" />
            Secure
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="mx-auto flex max-w-xl flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-lg font-semibold">Payment</h3>

          <Field
            label="Card number"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={card.number}
            error={show('card.number') ? cardErrors.number : undefined}
            onChange={(e) => setCardState((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
            onBlur={() => markTouched('card.number')}
            endAdornment={<CardBrandMark brand={brand} className="h-6 w-9" />}
          />

          <Field
            label="Cardholder name"
            autoComplete="cc-name"
            placeholder="Jane Appleseed"
            value={card.cardHolder}
            error={show('card.cardHolder') ? cardErrors.cardHolder : undefined}
            onChange={(e) => setCardState((c) => ({ ...c, cardHolder: e.target.value }))}
            onBlur={() => markTouched('card.cardHolder')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Expiry"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={card.expiry}
              error={show('card.expiry') ? cardErrors.expiry : undefined}
              onChange={(e) => setCardState((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
              onBlur={() => markTouched('card.expiry')}
            />
            <Field
              label="CVV"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={card.cvv}
              error={show('card.cvv') ? cardErrors.cvv : undefined}
              onChange={(e) => setCardState((c) => ({ ...c, cvv: formatCvv(e.target.value) }))}
              onBlur={() => markTouched('card.cvv')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="installments" className="field-label">
              Installments
            </label>
            <select
              id="installments"
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className="field-input"
            >
              {INSTALLMENT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? '1 payment' : `${n} installments`}
                </option>
              ))}
            </select>
          </div>

          {tokenizeError && <p className="field-error">{tokenizeError}</p>}
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-lg font-semibold">Customer</h3>

          <Field
            label="Full name"
            autoComplete="name"
            placeholder="Jane Appleseed"
            value={customer.fullName}
            error={show('customer.fullName') ? customerErrors.fullName : undefined}
            onChange={(e) => setCustomerState((c) => ({ ...c, fullName: e.target.value }))}
            onBlur={() => markTouched('customer.fullName')}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="jane@email.com"
              value={customer.email}
              error={show('customer.email') ? customerErrors.email : undefined}
              onChange={(e) => setCustomerState((c) => ({ ...c, email: e.target.value }))}
              onBlur={() => markTouched('customer.email')}
            />
            <Field
              label="Phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+57 300 000 0000"
              value={customer.phone}
              error={show('customer.phone') ? customerErrors.phone : undefined}
              onChange={(e) => setCustomerState((c) => ({ ...c, phone: e.target.value }))}
              onBlur={() => markTouched('customer.phone')}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="legalIdType" className="field-label">
                ID type
              </label>
              <select
                id="legalIdType"
                value={customer.legalIdType}
                onChange={(e) =>
                  setCustomerState((c) => ({
                    ...c,
                    legalIdType: e.target.value as CustomerInput['legalIdType'],
                  }))
                }
                className="field-input"
              >
                {ID_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="ID number"
              placeholder="123456789"
              value={customer.legalId}
              error={show('customer.legalId') ? customerErrors.legalId : undefined}
              onChange={(e) => setCustomerState((c) => ({ ...c, legalId: e.target.value }))}
              onBlur={() => markTouched('customer.legalId')}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-lg font-semibold">Delivery</h3>

          <Field
            label="Address"
            autoComplete="street-address"
            placeholder="Calle 123 #45-67"
            value={delivery.address}
            error={show('delivery.address') ? deliveryErrors.address : undefined}
            onChange={(e) => setDeliveryState((d) => ({ ...d, address: e.target.value }))}
            onBlur={() => markTouched('delivery.address')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="City"
              autoComplete="address-level2"
              placeholder="Bogotá"
              value={delivery.city}
              error={show('delivery.city') ? deliveryErrors.city : undefined}
              onChange={(e) => setDeliveryState((d) => ({ ...d, city: e.target.value }))}
              onBlur={() => markTouched('delivery.city')}
            />
            <Field
              label="Region"
              autoComplete="address-level1"
              placeholder="Cundinamarca"
              value={delivery.region}
              error={show('delivery.region') ? deliveryErrors.region : undefined}
              onChange={(e) => setDeliveryState((d) => ({ ...d, region: e.target.value }))}
              onBlur={() => markTouched('delivery.region')}
            />
          </div>
        </section>

        <Button type="submit" variant="primary" loading={tokenizing} disabled={cartCount === 0}>
          Review order
        </Button>
      </form>
    </Layout>
  )
}
