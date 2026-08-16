import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import checkoutReducer, { type CheckoutState } from './features/checkout/checkoutSlice'
import * as productsApi from './api/products/products'
import { TransactionSource, TransactionStatus, type Product, type Transaction } from './api/resources'

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

  it('renders the checkout details form when view is "checkout"', () => {
    renderWithCheckoutState({ view: 'checkout' })

    expect(screen.getByRole('heading', { name: 'Checkout' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /review order/i })).toBeInTheDocument()
  })

  it('returns to the catalog when the checkout back button is clicked', async () => {
    mockListProducts.mockResolvedValue({ items: [], nextCursor: null })
    const store = renderWithCheckoutState({ view: 'checkout', source: 'CART' })

    await userEvent.click(screen.getByRole('button', { name: /back to catalog/i }))

    expect(store.getState().checkout.view).toBe('catalog')
    expect(store.getState().checkout.source).toBeNull()
    await waitFor(() =>
      expect(screen.getByText('No products available right now.')).toBeInTheDocument(),
    )
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

  it('returns to the same product page after a Buy Now checkout completes', async () => {
    const product: Product = {
      id: 'p1',
      name: 'Colombian Dark Roast',
      description: 'Full-bodied.',
      priceInCents: 1899900,
      stock: 11,
      imageUrls: ['http://x/dark-roast.jpg'],
      tags: [],
    }
    mockGetProduct.mockResolvedValue(product)
    const transaction: Transaction = {
      id: 't1',
      reference: 'ref-1',
      customerId: 'c1',
      deliveryId: 'd1',
      status: TransactionStatus.APPROVED,
      source: TransactionSource.BUY_NOW,
      items: [{ id: 'i1', productId: 'p1', quantity: 1, unitPriceInCents: 1899900, subtotalInCents: 1899900 }],
      subtotalInCents: 1899900,
      baseFeeInCents: 300,
      deliveryFeeInCents: 700,
      totalAmountInCents: 1900900,
      paymentGatewayTransactionId: 'gw_1',
    }

    // Checkout never navigates the URL away from the product page it started
    // from — it only overlays `view: 'checkout'` on top of whatever route is
    // active (see App.tsx). So finishing checkout and going back to the
    // catalog view naturally re-renders whatever the URL still points at.
    renderWithCheckoutState(
      { view: 'checkout', step: 'result', status: 'idle', source: TransactionSource.BUY_NOW, transaction },
      ['/products/p1'],
    )

    await userEvent.click(screen.getByRole('button', { name: /continue shopping/i }))

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
