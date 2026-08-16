import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProductDetailPage } from './ProductDetailPage'
import checkoutReducer from '../features/checkout/checkoutSlice'
import * as productsApi from '../api/products/products'
import type { Product } from '../api/resources'

jest.mock('../api/products/products')

const mockGetProduct = productsApi.getProduct as jest.Mock

const product: Product = {
  id: 'p1',
  name: 'Colombian Dark Roast',
  description: 'Full-bodied, notes of chocolate and caramel.',
  priceInCents: 1899900,
  stock: 12,
  imageUrls: ['http://x/dark-roast-1.jpg', 'http://x/dark-roast-2.jpg', 'http://x/dark-roast-3.jpg'],
  tags: ['Colombia', 'Medium roast'],
}

function renderWithStore(productId = 'p1') {
  const store = configureStore({ reducer: { checkout: checkoutReducer } })
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/products/${productId}`]}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
  return { store, container: view.container }
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('ProductDetailPage', () => {
  it('shows a spinner while loading', () => {
    mockGetProduct.mockReturnValue(new Promise(() => {}))

    const { container } = renderWithStore()

    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
  })

  it('renders the full product details once loaded', async () => {
    mockGetProduct.mockResolvedValue(product)

    renderWithStore()

    await waitFor(() => expect(screen.getByText('Colombian Dark Roast')).toBeInTheDocument())
    expect(mockGetProduct).toHaveBeenCalledWith('p1')
    expect(screen.getByText(/Full-bodied, notes of chocolate and caramel\./)).toBeInTheDocument()
    expect(screen.getByText('$ 18.999')).toBeInTheDocument()
    expect(screen.getByText('Colombia')).toBeInTheDocument()
    expect(screen.getByText('Medium roast')).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    mockGetProduct.mockRejectedValue({ code: 'NOT_FOUND', message: 'Product not found.' })

    renderWithStore('missing')

    await waitFor(() => expect(screen.getByText('Product not found.')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /back to catalog/i })).toHaveAttribute('href', '/')
  })

  it('dispatches addToCart and startBuyNow with the selected quantity', async () => {
    mockGetProduct.mockResolvedValue(product)
    const { store } = renderWithStore()

    await waitFor(() => screen.getByText('Colombian Dark Roast'))
    await userEvent.click(screen.getByRole('button', { name: /increase quantity/i }))
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }))

    expect(store.getState().checkout.cart).toEqual([
      {
        productId: 'p1',
        name: 'Colombian Dark Roast',
        priceInCents: 1899900,
        imageUrl: 'http://x/dark-roast-1.jpg',
        stock: 12,
        quantity: 2,
      },
    ])

    await userEvent.click(screen.getByRole('button', { name: /pay with credit card/i }))
    expect(store.getState().checkout.view).toBe('checkout')
    expect(store.getState().checkout.source).toBe('BUY_NOW')
  })

  it('decrements the quantity, clamped at 1', async () => {
    mockGetProduct.mockResolvedValue(product)
    renderWithStore()

    await waitFor(() => screen.getByText('Colombian Dark Roast'))
    const increase = screen.getByRole('button', { name: /increase quantity/i })
    const decrease = screen.getByRole('button', { name: /decrease quantity/i })

    await userEvent.click(increase)
    await userEvent.click(increase)
    expect(screen.getByText('3')).toBeInTheDocument()

    await userEvent.click(decrease)
    expect(screen.getByText('2')).toBeInTheDocument()

    await userEvent.click(decrease)
    await userEvent.click(decrease)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows a thumbnail per gallery image and swaps the main image on click', async () => {
    mockGetProduct.mockResolvedValue(product)

    renderWithStore()

    await waitFor(() => screen.getByText('Colombian Dark Roast'))

    const mainImage = screen.getByRole('img', { name: product.name })
    expect(mainImage).toHaveAttribute('src', 'http://x/dark-roast-1.jpg')

    const thumbnails = screen.getAllByRole('button', { name: /show image \d of colombian dark roast/i })
    expect(thumbnails).toHaveLength(3)
    expect(thumbnails[0]).toHaveAttribute('aria-current', 'true')

    await userEvent.click(thumbnails[1])

    expect(screen.getByRole('img', { name: product.name })).toHaveAttribute(
      'src',
      'http://x/dark-roast-2.jpg',
    )
    expect(thumbnails[1]).toHaveAttribute('aria-current', 'true')
    expect(thumbnails[0]).toHaveAttribute('aria-current', 'false')
  })

  it('does not render a thumbnail row when the product has only one image', async () => {
    mockGetProduct.mockResolvedValue({ ...product, imageUrls: ['http://x/dark-roast-1.jpg'] })

    renderWithStore()

    await waitFor(() => screen.getByText('Colombian Dark Roast'))

    expect(screen.queryByRole('button', { name: /show image/i })).not.toBeInTheDocument()
  })

  it('dims the image, disables actions, and freezes the stepper when out of stock', async () => {
    mockGetProduct.mockResolvedValue({ ...product, stock: 0 })

    renderWithStore()

    await waitFor(() => screen.getByText('Colombian Dark Roast'))

    expect(screen.getByRole('img', { name: product.name })).toHaveClass('grayscale')
    expect(screen.getAllByText('Out of stock')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /increase quantity/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /pay with credit card/i })).toBeDisabled()
  })
})
