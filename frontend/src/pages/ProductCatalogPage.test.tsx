import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ProductCatalogPage } from './ProductCatalogPage'
import checkoutReducer from '../features/checkout/checkoutSlice'
import * as productsApi from '../api/products/products'
import type { Product, ProductPage } from '../api/resources'

jest.mock('../api/products/products')

const mockListProducts = productsApi.listProducts as jest.Mock

const product: Product = {
  id: 'p1',
  name: 'Colombian Dark Roast',
  description: 'Full-bodied.',
  priceInCents: 1899900,
  stock: 12,
  imageUrl: 'http://x/dark-roast.jpg',
}

function renderWithStore() {
  const store = configureStore({ reducer: { checkout: checkoutReducer } })
  render(
    <Provider store={store}>
      <ProductCatalogPage />
    </Provider>,
  )
  return store
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('ProductCatalogPage', () => {
  it('renders the fetched products', async () => {
    const page: ProductPage = { items: [product], nextCursor: null }
    mockListProducts.mockResolvedValue(page)

    renderWithStore()

    await waitFor(() => expect(screen.getByText('Colombian Dark Roast')).toBeInTheDocument())
  })

  it('dispatches startBuyNow with quantity 1 and switches to the checkout view', async () => {
    mockListProducts.mockResolvedValue({ items: [product], nextCursor: null })
    const store = renderWithStore()

    await waitFor(() => screen.getByText('Colombian Dark Roast'))
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))

    expect(store.getState().checkout.cart).toEqual([
      {
        productId: 'p1',
        name: 'Colombian Dark Roast',
        priceInCents: 1899900,
        imageUrl: 'http://x/dark-roast.jpg',
        quantity: 1,
      },
    ])
    expect(store.getState().checkout.view).toBe('checkout')
  })

  it('dispatches addToCart with quantity 1 without leaving the catalog', async () => {
    mockListProducts.mockResolvedValue({ items: [product], nextCursor: null })
    const store = renderWithStore()

    await waitFor(() => screen.getByText('Colombian Dark Roast'))
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    expect(store.getState().checkout.cart).toHaveLength(1)
    expect(store.getState().checkout.view).toBe('catalog')
  })
})
