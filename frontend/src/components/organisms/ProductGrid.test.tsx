import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductGrid } from './ProductGrid'
import type { Product } from '../../api/resources'

const products: Product[] = [
  {
    id: 'p1',
    name: 'Colombian Dark Roast',
    description: 'Full-bodied.',
    priceInCents: 1899900,
    stock: 12,
    imageUrl: 'http://x/dark-roast.jpg',
  },
  {
    id: 'p2',
    name: 'Ethiopian Light Roast',
    description: 'Bright and floral.',
    priceInCents: 2199900,
    stock: 5,
    imageUrl: 'http://x/light-roast.jpg',
  },
]

describe('ProductGrid', () => {
  it('shows a spinner while loading', () => {
    const { container } = render(
      <ProductGrid products={[]} loading error={null} onBuyNow={jest.fn()} onAddToCart={jest.fn()} />,
    )
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
  })

  it('shows the error message when the fetch failed', () => {
    render(
      <ProductGrid
        products={[]}
        loading={false}
        error={{ code: 'NETWORK_ERROR', message: 'Could not reach the server.' }}
        onBuyNow={jest.fn()}
        onAddToCart={jest.fn()}
      />,
    )
    expect(screen.getByText('Could not reach the server.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no products', () => {
    render(
      <ProductGrid products={[]} loading={false} error={null} onBuyNow={jest.fn()} onAddToCart={jest.fn()} />,
    )
    expect(screen.getByText('No products available right now.')).toBeInTheDocument()
  })

  it('renders one ProductCard per product', () => {
    render(
      <ProductGrid
        products={products}
        loading={false}
        error={null}
        onBuyNow={jest.fn()}
        onAddToCart={jest.fn()}
      />,
    )
    expect(screen.getByText('Colombian Dark Roast')).toBeInTheDocument()
    expect(screen.getByText('Ethiopian Light Roast')).toBeInTheDocument()
  })

  it('forwards onBuyNow from the clicked card', async () => {
    const onBuyNow = jest.fn()
    render(
      <ProductGrid products={products} loading={false} error={null} onBuyNow={onBuyNow} onAddToCart={jest.fn()} />,
    )

    await userEvent.click(screen.getAllByRole('button', { name: /buy now/i })[0])

    expect(onBuyNow).toHaveBeenCalledWith(products[0], 1)
  })
})
