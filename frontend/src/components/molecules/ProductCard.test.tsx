import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductCard } from './ProductCard'
import type { Product } from '../../api/resources'

const product: Product = {
  id: 'p1',
  name: 'Colombian Dark Roast',
  description: 'Full-bodied, notes of chocolate and caramel.',
  priceInCents: 1899900,
  stock: 12,
  imageUrl: 'http://x/dark-roast.jpg',
}

describe('ProductCard', () => {
  it('renders the product name, description, formatted price, and stock', () => {
    render(<ProductCard product={product} onBuyNow={jest.fn()} onAddToCart={jest.fn()} />)

    expect(screen.getByText('Colombian Dark Roast')).toBeInTheDocument()
    expect(screen.getByText(/Full-bodied/)).toBeInTheDocument()
    expect(screen.getByText('$ 18.999')).toBeInTheDocument()
    expect(screen.getByText('12 left')).toBeInTheDocument()
  })

  it('calls onBuyNow with the product and a default quantity of 1 when "Buy now" is clicked', async () => {
    const onBuyNow = jest.fn()
    render(<ProductCard product={product} onBuyNow={onBuyNow} onAddToCart={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))

    expect(onBuyNow).toHaveBeenCalledWith(product, 1)
  })

  it('calls onAddToCart with the product and a default quantity of 1 when "Add" is clicked', async () => {
    const onAddToCart = jest.fn()
    render(<ProductCard product={product} onBuyNow={jest.fn()} onAddToCart={onAddToCart} />)

    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    expect(onAddToCart).toHaveBeenCalledWith(product, 1)
  })

  it('increments and decrements the quantity, clamped between 1 and the available stock', async () => {
    render(
      <ProductCard product={{ ...product, stock: 2 }} onBuyNow={jest.fn()} onAddToCart={jest.fn()} />,
    )

    const increase = screen.getByRole('button', { name: /increase quantity/i })
    const decrease = screen.getByRole('button', { name: /decrease quantity/i })

    expect(decrease).toBeDisabled()

    await userEvent.click(increase)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(increase).toBeDisabled()

    await userEvent.click(decrease)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(decrease).toBeDisabled()
  })

  it('passes the selected quantity through to onAddToCart and onBuyNow', async () => {
    const onAddToCart = jest.fn()
    const onBuyNow = jest.fn()
    render(
      <ProductCard product={{ ...product, stock: 5 }} onBuyNow={onBuyNow} onAddToCart={onAddToCart} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /increase quantity/i }))
    await userEvent.click(screen.getByRole('button', { name: /increase quantity/i }))
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))

    expect(onAddToCart).toHaveBeenCalledWith({ ...product, stock: 5 }, 3)
    expect(onBuyNow).toHaveBeenCalledWith({ ...product, stock: 5 }, 3)
  })

  it('shows a low-stock badge when stock is at or below the threshold', () => {
    render(<ProductCard product={{ ...product, stock: 3 }} onBuyNow={jest.fn()} onAddToCart={jest.fn()} />)

    const badge = screen.getByText('3 left')
    expect(badge).toHaveClass('badge-pending')
  })

  it('shows "Out of stock" and disables both actions when stock is zero', () => {
    render(
      <ProductCard
        product={{ ...product, stock: 0 }}
        onBuyNow={jest.fn()}
        onAddToCart={jest.fn()}
      />,
    )

    expect(screen.getByText('Out of stock')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buy now/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled()
  })
})
