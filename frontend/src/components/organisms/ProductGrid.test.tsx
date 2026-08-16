import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { ProductGrid } from './ProductGrid'
import type { Product } from '../../api/resources'

const products: Product[] = [
  {
    id: 'p1',
    name: 'Colombian Dark Roast',
    description: 'Full-bodied.',
    priceInCents: 1899900,
    stock: 12,
    imageUrls: ['http://x/dark-roast.jpg'],
    tags: [],
  },
  {
    id: 'p2',
    name: 'Ethiopian Light Roast',
    description: 'Bright and floral.',
    priceInCents: 2199900,
    stock: 5,
    imageUrls: ['http://x/light-roast.jpg'],
    tags: [],
  },
]

function renderGrid(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('ProductGrid', () => {
  it('shows a spinner while loading', () => {
    const { container } = renderGrid(
      <ProductGrid products={[]} loading error={null} onBuyNow={jest.fn()} onAddToCart={jest.fn()} />,
    )
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
  })

  it('shows the error message when the fetch failed', () => {
    renderGrid(
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
    renderGrid(
      <ProductGrid products={[]} loading={false} error={null} onBuyNow={jest.fn()} onAddToCart={jest.fn()} />,
    )
    expect(screen.getByText('No products available right now.')).toBeInTheDocument()
  })

  it('renders one ProductCard per product', () => {
    renderGrid(
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
    renderGrid(
      <ProductGrid products={products} loading={false} error={null} onBuyNow={onBuyNow} onAddToCart={jest.fn()} />,
    )

    await userEvent.click(screen.getAllByRole('button', { name: /buy now/i })[0])

    expect(onBuyNow).toHaveBeenCalledWith(products[0], 1)
  })
})
