import { initialState, type CheckoutState } from '../features/checkout/checkoutSlice'
import { TransactionSource, TransactionStatus, type Transaction } from '../api/resources'
import { loadPersistedCheckout, persistCheckout } from './persistCheckout'

const STORAGE_KEY = 'checkout-flow-app:checkout'

afterEach(() => {
  localStorage.clear()
})

describe('loadPersistedCheckout', () => {
  it('returns initialState when nothing is stored', () => {
    expect(loadPersistedCheckout()).toEqual(initialState)
  })

  it('returns initialState when the stored value is corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadPersistedCheckout()).toEqual(initialState)
  })

  it('merges stored data onto initialState and resets transient fields', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ view: 'checkout', step: 'summary', source: TransactionSource.BUY_NOW }),
    )

    const result = loadPersistedCheckout()

    expect(result.view).toBe('checkout')
    expect(result.step).toBe('summary')
    expect(result.status).toBe('idle')
    expect(result.error).toBeNull()
    // Fields absent from the stored payload still fall back to initialState.
    expect(result.cart).toEqual([])
  })

  it('resumes awaitingResult when the stored transaction is still PENDING', () => {
    const transaction: Transaction = {
      id: 't1',
      reference: 'ORD-1',
      customerId: 'c1',
      deliveryId: 'd1',
      status: TransactionStatus.PENDING,
      source: TransactionSource.BUY_NOW,
      items: [],
      subtotalInCents: 1000,
      baseFeeInCents: 300,
      deliveryFeeInCents: 800,
      totalAmountInCents: 2100,
      paymentGatewayTransactionId: 'gw1',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: 'result', transaction }))

    const result = loadPersistedCheckout()

    expect(result.status).toBe('awaitingResult')
    expect(result.transaction).toEqual(transaction)
  })

  it('stays idle when the stored transaction is already resolved', () => {
    const transaction: Transaction = {
      id: 't1',
      reference: 'ORD-1',
      customerId: 'c1',
      deliveryId: 'd1',
      status: TransactionStatus.APPROVED,
      source: TransactionSource.BUY_NOW,
      items: [],
      subtotalInCents: 1000,
      baseFeeInCents: 300,
      deliveryFeeInCents: 800,
      totalAmountInCents: 2100,
      paymentGatewayTransactionId: 'gw1',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: 'result', transaction }))

    const result = loadPersistedCheckout()

    expect(result.status).toBe('idle')
  })
})

describe('persistCheckout', () => {
  it('writes only the durable fields, dropping status/error', () => {
    const state: CheckoutState = {
      ...initialState,
      view: 'checkout',
      step: 'summary',
      status: 'error',
      error: { code: 'X', message: 'boom' },
    }

    persistCheckout(state)

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as Record<string, unknown>
    expect(stored.view).toBe('checkout')
    expect(stored.step).toBe('summary')
    expect(stored).not.toHaveProperty('status')
    expect(stored).not.toHaveProperty('error')
  })

  it('does not throw when localStorage is unavailable', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    expect(() => persistCheckout(initialState)).not.toThrow()

    spy.mockRestore()
  })
})
