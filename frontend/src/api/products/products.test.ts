import * as apiModule from '../api'
import { getProduct, listProducts } from './products'
import type { Product, ProductPage } from '../resources'

jest.mock('../api')

const mockGet = apiModule.api.get as jest.Mock

const product: Product = {
  id: 'p1',
  name: 'Widget',
  description: 'A widget.',
  priceInCents: 1000,
  stock: 5,
  imageUrl: 'http://x/widget.jpg',
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('listProducts', () => {
  it('calls GET /products with the given cursor/limit params', async () => {
    const page: ProductPage = { items: [product], nextCursor: null }
    mockGet.mockResolvedValue(page)

    const result = await listProducts({ cursor: 'p0', limit: 10 })

    expect(mockGet).toHaveBeenCalledWith('/products', { params: { cursor: 'p0', limit: 10 } })
    expect(result).toBe(page)
  })

  it('works with no params', async () => {
    const page: ProductPage = { items: [], nextCursor: null }
    mockGet.mockResolvedValue(page)

    await listProducts()

    expect(mockGet).toHaveBeenCalledWith('/products', { params: undefined })
  })
})

describe('getProduct', () => {
  it('calls GET /products/:id', async () => {
    mockGet.mockResolvedValue(product)

    const result = await getProduct('p1')

    expect(mockGet).toHaveBeenCalledWith('/products/p1')
    expect(result).toBe(product)
  })
})
