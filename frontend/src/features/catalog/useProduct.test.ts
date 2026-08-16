import { renderHook, waitFor } from '@testing-library/react'
import * as productsApi from '../../api/products/products'
import type { Product } from '../../api/resources'
import { useProduct } from './useProduct'

jest.mock('../../api/products/products')

const mockGetProduct = productsApi.getProduct as jest.Mock

const product: Product = {
  id: 'p1',
  name: 'Colombian Dark Roast',
  description: 'Full-bodied, notes of chocolate and caramel.',
  priceInCents: 1899,
  stock: 20,
  imageUrls: ['http://x/dark-roast.jpg'],
  tags: [],
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('useProduct', () => {
  it('starts in a loading state and returns the fetched product', async () => {
    mockGetProduct.mockResolvedValue(product)

    const { result } = renderHook(() => useProduct('p1'))

    expect(result.current.loading).toBe(true)
    expect(mockGetProduct).toHaveBeenCalledWith('p1')

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.product).toEqual(product)
    expect(result.current.error).toBeNull()
  })

  it('exposes the API error when the fetch fails', async () => {
    mockGetProduct.mockRejectedValue({ code: 'NOT_FOUND', message: 'Product not found.' })

    const { result } = renderHook(() => useProduct('missing'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.product).toBeNull()
    expect(result.current.error).toEqual({ code: 'NOT_FOUND', message: 'Product not found.' })
  })

  it('re-fetches when the id changes', async () => {
    const other: Product = { ...product, id: 'p2', name: 'Ethiopian Light Roast' }
    mockGetProduct.mockResolvedValueOnce(product).mockResolvedValueOnce(other)

    const { result, rerender } = renderHook(({ id }) => useProduct(id), {
      initialProps: { id: 'p1' },
    })

    await waitFor(() => expect(result.current.product).toEqual(product))

    rerender({ id: 'p2' })

    expect(result.current.loading).toBe(true)
    expect(result.current.product).toBeNull()
    await waitFor(() => expect(result.current.product).toEqual(other))
    expect(mockGetProduct).toHaveBeenNthCalledWith(2, 'p2')
  })
})
