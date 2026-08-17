import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { CheckoutSummaryPage } from './CheckoutSummaryPage'
import checkoutReducer, { type CheckoutState, type CartLine } from '../features/checkout/checkoutSlice'
import { LegalIdType } from '../api/resources'
import * as transactionsApi from '../api/transactions/transactions'

jest.mock('../api/transactions/transactions')

const line: CartLine = {
  productId: 'p1',
  name: 'Huila Reserve',
  priceInCents: 3490000,
  imageUrl: 'http://x/huila.jpg',
  stock: 8,
  quantity: 2,
}

const customer = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+573001234567',
  legalId: '1234567890',
  legalIdType: LegalIdType.CC,
}

const delivery = { address: 'Calle 123', city: 'Bogotá', region: 'Cundinamarca' }

function renderWithState(overrides: Partial<CheckoutState>) {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: {
      checkout: { ...checkoutReducer(undefined, { type: '@@init' }), ...overrides },
    },
  })
  render(
    <Provider store={store}>
      <CheckoutSummaryPage />
    </Provider>,
  )
  return store
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('CheckoutSummaryPage', () => {
  it('renders the cart lines, delivery/payment recap, and fee breakdown', () => {
    renderWithState({
      cart: [line],
      customer,
      delivery,
      cardBrand: 'VISA',
      cardLastFour: '4242',
    })

    expect(screen.getByText('Huila Reserve')).toBeInTheDocument()
    expect(screen.getByText('Qty 2')).toBeInTheDocument()
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument()
    expect(screen.getByText(/Calle 123, Bogotá, Cundinamarca/)).toBeInTheDocument()
    expect(screen.getByText(/VISA/)).toBeInTheDocument()
    expect(screen.getByText(/4242/)).toBeInTheDocument()
    // line total 6,980,000c = subtotal; + base fee 300,000c + delivery fee 800,000c = total 8,080,000c
    expect(screen.getAllByText('$ 69.800')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /pay \$\s80\.800/i })).toBeInTheDocument()
  })

  it('dispatches submitTransaction when the pay button is clicked', async () => {
    const mockCreateTransaction = transactionsApi.createTransaction as jest.Mock
    mockCreateTransaction.mockReturnValue(new Promise(() => {}))

    const store = renderWithState({
      cart: [line],
      customer,
      delivery,
      cardToken: 'tok_1',
      source: 'CART',
    })

    await userEvent.click(screen.getByRole('button', { name: /pay/i }))

    expect(mockCreateTransaction).toHaveBeenCalled()
    expect(store.getState().checkout.status).toBe('submitting')
  })

  it('shows the error message when present', () => {
    renderWithState({
      cart: [line],
      error: { code: 'NETWORK_ERROR', message: 'Could not reach the server.' },
    })

    expect(screen.getByText('Could not reach the server.')).toBeInTheDocument()
  })
})
