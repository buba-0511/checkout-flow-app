import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import checkoutReducer, { type CheckoutState } from './features/checkout/checkoutSlice'
import * as productsApi from './api/products/products'
import type { Product } from './api/resources'

jest.mock('./api/products/products')

const mockListProducts = productsApi.listProducts as jest.Mock
const mockGetProduct = productsApi.getProduct as jest.Mock

function renderWithCheckoutState(overrides: Partial<CheckoutState>, initialEntries = ['/']) {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: {
      checkout: { ...checkoutReducer(undefined, { type: '@@init' }), ...overrides },
    },
  })
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </Provider>,
  )
  return store
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

  it('returns to the catalog when "Back to catalog" is clicked from the placeholder', async () => {
    mockListProducts.mockResolvedValue({ items: [], nextCursor: null })
    const store = renderWithCheckoutState({ view: 'checkout', source: 'CART' })

    await userEvent.click(screen.getByRole('button', { name: /back to catalog/i }))

    expect(store.getState().checkout.view).toBe('catalog')
    expect(store.getState().checkout.source).toBeNull()
  })

  it('renders the product detail page at /products/:id', async () => {
    const product: Product = {
      id: 'p1',
      name: 'Colombian Dark Roast',
      description: 'Full-bodied.',
      priceInCents: 1899900,
      stock: 12,
      imageUrls: ['http://x/dark-roast.jpg'],
      tags: [],
    }
    mockGetProduct.mockResolvedValue(product)

    renderWithCheckoutState({ view: 'catalog' }, ['/products/p1'])

    await waitFor(() => expect(screen.getByText('Colombian Dark Roast')).toBeInTheDocument())
    expect(mockGetProduct).toHaveBeenCalledWith('p1')
  })

  it('redirects an unknown route back to the catalog', async () => {
    mockListProducts.mockResolvedValue({ items: [], nextCursor: null })

    renderWithCheckoutState({ view: 'catalog' }, ['/does-not-exist'])

    await waitFor(() =>
      expect(screen.getByText('Small-batch coffee, roasted to order.')).toBeInTheDocument(),
    )
  })
})
