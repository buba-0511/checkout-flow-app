import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartSummaryBar } from './CartSummaryBar'

describe('CartSummaryBar', () => {
  it('renders nothing when the cart is empty', () => {
    const { container } = render(
      <CartSummaryBar itemCount={0} subtotalInCents={0} onViewCart={jest.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the item count and formatted subtotal when the cart has items', () => {
    render(<CartSummaryBar itemCount={3} subtotalInCents={1899900} onViewCart={jest.fn()} />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('$ 18.999')).toBeInTheDocument()
  })

  it('calls onViewCart when clicked', async () => {
    const onViewCart = jest.fn()
    render(<CartSummaryBar itemCount={1} subtotalInCents={1000} onViewCart={onViewCart} />)

    await userEvent.click(screen.getByRole('button', { name: /view cart/i }))

    expect(onViewCart).toHaveBeenCalledTimes(1)
  })
})
