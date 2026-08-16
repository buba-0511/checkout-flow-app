import { configureStore } from '@reduxjs/toolkit'
import checkoutReducer, {
  initialState,
  startBuyNow,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  startCartCheckout,
  setCustomer,
  setDelivery,
  setPaymentMethod,
  goToStep,
  resetCheckout,
  submitTransaction,
  pollTransactionUntilResolved,
  type CheckoutState,
} from './checkoutSlice'
import * as transactionsApi from '../../api/transactions/transactions'
import { LegalIdType, TransactionSource, TransactionStatus, type Product, type Transaction } from '../../api/resources'

jest.mock('../../api/transactions/transactions')

function makeStore(preloadedState?: Partial<CheckoutState>) {
  return configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: { checkout: { ...initialState, ...preloadedState } },
  })
}

const product: Product = {
  id: 'p1',
  name: 'Widget',
  description: 'A widget.',
  priceInCents: 1000,
  stock: 5,
  imageUrl: 'http://x/widget.jpg',
}

const customer = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+573001234567',
  legalId: '1234567890',
  legalIdType: LegalIdType.CC,
}

const delivery = { address: 'Calle 123', city: 'Bogotá', region: 'Cundinamarca' }

const transaction: Transaction = {
  id: 't1',
  reference: 'ref-1',
  customerId: 'c1',
  deliveryId: 'd1',
  status: TransactionStatus.PENDING,
  source: TransactionSource.BUY_NOW,
  items: [],
  subtotalInCents: 1000,
  baseFeeInCents: 500,
  deliveryFeeInCents: 1000,
  totalAmountInCents: 2500,
  paymentGatewayTransactionId: null,
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('checkoutSlice reducers', () => {
  it('startBuyNow sets a single-item cart with source BUY_NOW and moves to checkout/details', () => {
    const state = checkoutReducer(initialState, startBuyNow({ product, quantity: 2 }))
    expect(state.source).toBe(TransactionSource.BUY_NOW)
    expect(state.cart).toEqual([
      { productId: 'p1', name: 'Widget', priceInCents: 1000, imageUrl: 'http://x/widget.jpg', quantity: 2 },
    ])
    expect(state.view).toBe('checkout')
    expect(state.step).toBe('details')
  })

  it('addToCart adds a new line', () => {
    const state = checkoutReducer(initialState, addToCart({ product, quantity: 1 }))
    expect(state.cart).toHaveLength(1)
    expect(state.cart[0].quantity).toBe(1)
  })

  it('addToCart increments quantity for an existing line instead of duplicating it', () => {
    let state = checkoutReducer(initialState, addToCart({ product, quantity: 1 }))
    state = checkoutReducer(state, addToCart({ product, quantity: 2 }))
    expect(state.cart).toHaveLength(1)
    expect(state.cart[0].quantity).toBe(3)
  })

  it('updateCartQuantity updates an existing line', () => {
    let state = checkoutReducer(initialState, addToCart({ product, quantity: 1 }))
    state = checkoutReducer(state, updateCartQuantity({ productId: 'p1', quantity: 5 }))
    expect(state.cart[0].quantity).toBe(5)
  })

  it('removeFromCart removes the matching line', () => {
    let state = checkoutReducer(initialState, addToCart({ product, quantity: 1 }))
    state = checkoutReducer(state, removeFromCart('p1'))
    expect(state.cart).toEqual([])
  })

  it('startCartCheckout sets source CART and moves to checkout/details', () => {
    const state = checkoutReducer(initialState, startCartCheckout())
    expect(state.source).toBe(TransactionSource.CART)
    expect(state.view).toBe('checkout')
    expect(state.step).toBe('details')
  })

  it('setCustomer, setDelivery, and setPaymentMethod store their form data', () => {
    let state = checkoutReducer(initialState, setCustomer(customer))
    state = checkoutReducer(state, setDelivery(delivery))
    state = checkoutReducer(state, setPaymentMethod({ cardToken: 'tok_1', installments: 3 }))
    expect(state.customer).toEqual(customer)
    expect(state.delivery).toEqual(delivery)
    expect(state.cardToken).toBe('tok_1')
    expect(state.installments).toBe(3)
  })

  it('goToStep changes the current step', () => {
    const state = checkoutReducer(initialState, goToStep('summary'))
    expect(state.step).toBe('summary')
  })

  it('resetCheckout returns to initialState', () => {
    const dirty = checkoutReducer(initialState, addToCart({ product, quantity: 1 }))
    const state = checkoutReducer(dirty, resetCheckout())
    expect(state).toEqual(initialState)
  })
})

describe('submitTransaction thunk', () => {
  function primedStore() {
    return makeStore({
      source: TransactionSource.BUY_NOW,
      cart: [{ productId: 'p1', name: 'Widget', priceInCents: 1000, imageUrl: 'x', quantity: 1 }],
      customer,
      delivery,
      cardToken: 'tok_1',
      installments: 1,
    })
  }

  it('rejects with INCOMPLETE_CHECKOUT when required fields are missing', async () => {
    const store = makeStore()

    await store.dispatch(submitTransaction())

    expect(store.getState().checkout.status).toBe('error')
    expect(store.getState().checkout.error?.code).toBe('INCOMPLETE_CHECKOUT')
    expect(transactionsApi.createTransaction).not.toHaveBeenCalled()
  })

  it('creates the transaction, moves to the result step, and starts polling on success', async () => {
    jest.mocked(transactionsApi.createTransaction).mockResolvedValue(transaction)
    jest.mocked(transactionsApi.getTransaction).mockResolvedValue({
      ...transaction,
      status: TransactionStatus.APPROVED,
    })
    const store = primedStore()

    await store.dispatch(submitTransaction())

    expect(transactionsApi.createTransaction).toHaveBeenCalledWith({
      customer,
      delivery,
      items: [{ productId: 'p1', quantity: 1 }],
      source: TransactionSource.BUY_NOW,
      paymentMethod: { cardToken: 'tok_1', installments: 1 },
    })
    expect(store.getState().checkout.step).toBe('result')
    expect(store.getState().checkout.transaction?.id).toBe('t1')
  })

  it('sets status to error when the API call fails', async () => {
    jest
      .mocked(transactionsApi.createTransaction)
      .mockRejectedValue({ code: 'PAYMENT_GATEWAY_ERROR', message: 'nope' })
    const store = primedStore()

    await store.dispatch(submitTransaction())

    expect(store.getState().checkout.status).toBe('error')
    expect(store.getState().checkout.error?.code).toBe('PAYMENT_GATEWAY_ERROR')
  })
})

describe('pollTransactionUntilResolved thunk', () => {
  it('resolves immediately when the transaction is no longer PENDING', async () => {
    jest.mocked(transactionsApi.getTransaction).mockResolvedValue({
      ...transaction,
      status: TransactionStatus.APPROVED,
    })
    const store = makeStore()

    await store.dispatch(pollTransactionUntilResolved('t1'))

    expect(transactionsApi.getTransaction).toHaveBeenCalledTimes(1)
    expect(store.getState().checkout.transaction?.status).toBe(TransactionStatus.APPROVED)
    expect(store.getState().checkout.status).toBe('idle')
  })

  it('polls again while still PENDING, then stops once resolved', async () => {
    jest.useFakeTimers()
    jest
      .mocked(transactionsApi.getTransaction)
      .mockResolvedValueOnce({ ...transaction, status: TransactionStatus.PENDING })
      .mockResolvedValueOnce({ ...transaction, status: TransactionStatus.DECLINED })
    const store = makeStore()

    const dispatched = store.dispatch(pollTransactionUntilResolved('t1'))
    await jest.advanceTimersByTimeAsync(2000)
    await dispatched

    expect(transactionsApi.getTransaction).toHaveBeenCalledTimes(2)
    expect(store.getState().checkout.transaction?.status).toBe(TransactionStatus.DECLINED)
    jest.useRealTimers()
  })

  it('sets status to error when the API call fails', async () => {
    jest.mocked(transactionsApi.getTransaction).mockRejectedValue({ code: 'NETWORK_ERROR', message: 'x' })
    const store = makeStore()

    await store.dispatch(pollTransactionUntilResolved('t1'))

    expect(store.getState().checkout.status).toBe('error')
    expect(store.getState().checkout.error?.code).toBe('NETWORK_ERROR')
  })
})
