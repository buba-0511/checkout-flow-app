import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import App from './App'
import checkoutReducer, { type CheckoutState } from './features/checkout/checkoutSlice'
import * as productsApi from './api/products/products'

jest.mock('./api/products/products')

const mockListProducts = productsApi.listProducts as jest.Mock

function renderWithCheckoutState(overrides: Partial<CheckoutState>) {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: {
      checkout: { ...checkoutReducer(undefined, { type: '@@init' }), ...overrides },
    },
  })
  return render(
    <Provider store={store}>
      <App />
    </Provider>,
  )
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('App', () => {
  it('renders the catalog page when view is "catalog"', () => {
    mockListProducts.mockResolvedValue({ items: [], nextCursor: null })

    renderWithCheckoutState({ view: 'catalog' })

    expect(screen.getByText('Small-batch coffee, roasted to order.')).toBeInTheDocument()
  })

  it('renders a checkout placeholder when view is "checkout"', () => {
    renderWithCheckoutState({ view: 'checkout' })

    expect(screen.getByText('Checkout coming soon.')).toBeInTheDocument()
  })
})
