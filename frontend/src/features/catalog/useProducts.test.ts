import { renderHook, waitFor } from '@testing-library/react'
import * as productsApi from '../../api/products/products'
import type { Product, ProductPage } from '../../api/resources'
import { useProducts } from './useProducts'

jest.mock('../../api/products/products')

const mockListProducts = productsApi.listProducts as jest.Mock

const product: Product = {
  id: 'p1',
  name: 'Colombian Dark Roast',
  description: 'Full-bodied, notes of chocolate and caramel.',
  priceInCents: 1899,
  stock: 20,
  imageUrl: 'http://x/dark-roast.jpg',
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('useProducts', () => {
  it('starts in a loading state and returns the fetched products', async () => {
    const page: ProductPage = { items: [product], nextCursor: null }
    mockListProducts.mockResolvedValue(page)

    const { result } = renderHook(() => useProducts())

    expect(result.current.loading).toBe(true)
    expect(mockListProducts).toHaveBeenCalledWith({ limit: 50 })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.products).toEqual([product])
    expect(result.current.error).toBeNull()
  })

  it('exposes the API error when the fetch fails', async () => {
    mockListProducts.mockRejectedValue({ code: 'NETWORK_ERROR', message: 'offline' })

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.products).toEqual([])
    expect(result.current.error).toEqual({ code: 'NETWORK_ERROR', message: 'offline' })
  })
})
