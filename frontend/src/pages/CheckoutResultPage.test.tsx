import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { CheckoutResultPage } from './CheckoutResultPage'
import checkoutReducer, { type CheckoutState } from '../features/checkout/checkoutSlice'
import { TransactionSource, TransactionStatus, type Transaction } from '../api/resources'
import * as transactionsApi from '../api/transactions/transactions'
import * as socketLib from '../lib/socket'

jest.mock('../api/transactions/transactions')
jest.mock('../lib/socket')

const mockSocket = {
  connect: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
}

const baseTransaction: Transaction = {
  id: 't1',
  reference: 'ref-123',
  customerId: 'c1',
  deliveryId: 'd1',
  status: TransactionStatus.APPROVED,
  source: TransactionSource.CART,
  items: [],
  subtotalInCents: 20000,
  baseFeeInCents: 500,
  deliveryFeeInCents: 1000,
  totalAmountInCents: 21500,
  paymentGatewayTransactionId: 'gw_1',
}

function renderWithState(overrides: Partial<CheckoutState>) {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: {
      checkout: { ...checkoutReducer(undefined, { type: '@@init' }), ...overrides },
    },
  })
  render(
    <Provider store={store}>
      <CheckoutResultPage />
    </Provider>,
  )
  return store
}

beforeEach(() => {
  jest.mocked(socketLib.createTransactionSocket).mockReturnValue(
    mockSocket as unknown as ReturnType<typeof socketLib.createTransactionSocket>,
  )
  jest.mocked(transactionsApi.getTransaction).mockResolvedValue({
    ...baseTransaction,
    status: TransactionStatus.PENDING,
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('CheckoutResultPage', () => {
  it('shows the processing state while submitting', () => {
    renderWithState({ status: 'submitting' })
    expect(screen.getByText('Processing payment')).toBeInTheDocument()
  })

  it('shows the processing state while awaiting the webhook-driven result', () => {
    renderWithState({ status: 'awaitingResult' })
    expect(screen.getByText('Processing payment')).toBeInTheDocument()
  })

  it('shows an error state with a retry that goes back to summary', async () => {
    const store = renderWithState({
      status: 'error',
      error: { code: 'NETWORK_ERROR', message: 'Could not reach the server.' },
    })

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Could not reach the server.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(store.getState().checkout.step).toBe('summary')
  })

  it('shows the approved state with order details and resets on continue shopping', async () => {
    const store = renderWithState({ status: 'idle', transaction: baseTransaction })

    expect(screen.getByText('Order confirmed')).toBeInTheDocument()
    expect(screen.getByText('ref-123')).toBeInTheDocument()
    expect(screen.getByText('$ 215')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /continue shopping/i }))
    expect(store.getState().checkout.view).toBe('catalog')
  })

  it('shows the declined state with a retry that goes back to details', async () => {
    const store = renderWithState({
      status: 'idle',
      transaction: { ...baseTransaction, status: TransactionStatus.DECLINED },
    })

    expect(screen.getByText("Payment didn't go through")).toBeInTheDocument()
    expect(screen.getByText('Declined')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(store.getState().checkout.step).toBe('details')
  })

  it('returns to the catalog from the declined state', async () => {
    const store = renderWithState({
      status: 'idle',
      transaction: { ...baseTransaction, status: TransactionStatus.DECLINED },
    })

    await userEvent.click(screen.getByRole('button', { name: /back to catalog/i }))
    expect(store.getState().checkout.view).toBe('catalog')
  })

  it('subscribes to the transaction socket and applies a pushed status update', async () => {
    const pending = { ...baseTransaction, status: TransactionStatus.PENDING }
    const store = renderWithState({ status: 'awaitingResult', transaction: pending })

    expect(socketLib.createTransactionSocket).toHaveBeenCalled()
    expect(mockSocket.connect).toHaveBeenCalled()
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', 't1')
    await waitFor(() => expect(transactionsApi.getTransaction).toHaveBeenCalledWith('t1'))

    const handler = mockSocket.on.mock.calls.find(([event]) => event === 'transaction:update')?.[1]
    act(() => handler({ ...baseTransaction, status: TransactionStatus.APPROVED }))

    await waitFor(() => expect(screen.getByText('Order confirmed')).toBeInTheDocument())
    expect(store.getState().checkout.status).toBe('idle')
  })

  it('disconnects the socket once the transaction resolves', async () => {
    const pending = { ...baseTransaction, status: TransactionStatus.PENDING }
    renderWithState({ status: 'awaitingResult', transaction: pending })
    const handler = mockSocket.on.mock.calls.find(([event]) => event === 'transaction:update')?.[1]

    act(() => handler({ ...baseTransaction, status: TransactionStatus.APPROVED }))

    await waitFor(() => expect(mockSocket.disconnect).toHaveBeenCalled())
  })

  it('keeps polling GET /transactions/:id as a fallback while awaiting the result', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    const pending = { ...baseTransaction, status: TransactionStatus.PENDING }
    renderWithState({ status: 'awaitingResult', transaction: pending })

    await waitFor(() => expect(transactionsApi.getTransaction).toHaveBeenCalledTimes(1))

    await act(async () => {
      jest.advanceTimersByTime(3000)
    })
    expect(transactionsApi.getTransaction).toHaveBeenCalledTimes(2)

    await act(async () => {
      jest.advanceTimersByTime(3000)
    })
    expect(transactionsApi.getTransaction).toHaveBeenCalledTimes(3)

    jest.useRealTimers()
  })
})
