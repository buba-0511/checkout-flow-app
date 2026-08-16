import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderSummarySheet } from './OrderSummarySheet'
import type { Fees, ResolvedCartLine } from '../../lib/cart'
import type { CartLine } from '../../features/checkout/checkoutSlice'

const line: CartLine = {
  productId: 'p1',
  name: 'Widget',
  priceInCents: 1000,
  imageUrl: 'http://x/widget.jpg',
  stock: 5,
  quantity: 2,
}

const resolvedLine: ResolvedCartLine = {
  line,
  lineTotalInCents: 2000,
}

const fees: Fees = {
  subtotalInCents: 2000,
  baseFeeInCents: 500,
  deliveryFeeInCents: 1000,
  totalInCents: 3500,
}

function noop() {
  /* unused in tests that don't assert this callback */
}

describe('OrderSummarySheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <OrderSummarySheet
        open={false}
        lines={[resolvedLine]}
        fees={fees}
        onClose={noop}
        onSetQuantity={noop}
        onRemove={noop}
        onPrimary={noop}
        primaryLabel="Go to checkout"
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('shows an empty-cart message when there are no lines', () => {
    render(
      <OrderSummarySheet
        open
        lines={[]}
        fees={fees}
        onClose={noop}
        onSetQuantity={noop}
        onRemove={noop}
        onPrimary={noop}
        primaryLabel="Go to checkout"
      />,
    )

    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
  })

  it('renders each line with its total and the fee breakdown', () => {
    render(
      <OrderSummarySheet
        open
        lines={[resolvedLine]}
        fees={fees}
        onClose={noop}
        onSetQuantity={noop}
        onRemove={noop}
        onPrimary={noop}
        primaryLabel="Go to checkout"
      />,
    )

    expect(screen.getByText('Widget')).toBeInTheDocument()
    // The line total and the subtotal are both 2000 cents with a single line.
    expect(screen.getAllByText('$ 20')).toHaveLength(2)
    expect(screen.getByText('$ 35')).toBeInTheDocument()
  })

  it('calls onSetQuantity with quantity - 1 / + 1 from the stepper', async () => {
    const onSetQuantity = jest.fn()
    render(
      <OrderSummarySheet
        open
        lines={[resolvedLine]}
        fees={fees}
        onClose={noop}
        onSetQuantity={onSetQuantity}
        onRemove={noop}
        onPrimary={noop}
        primaryLabel="Go to checkout"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /increase widget quantity/i }))
    await userEvent.click(screen.getByRole('button', { name: /decrease widget quantity/i }))

    expect(onSetQuantity).toHaveBeenNthCalledWith(1, 'p1', 3)
    expect(onSetQuantity).toHaveBeenNthCalledWith(2, 'p1', 1)
  })

  it('disables increment at the stock ceiling', () => {
    render(
      <OrderSummarySheet
        open
        lines={[{ ...resolvedLine, line: { ...line, stock: 2 } }]}
        fees={fees}
        onClose={noop}
        onSetQuantity={noop}
        onRemove={noop}
        onPrimary={noop}
        primaryLabel="Go to checkout"
      />,
    )

    expect(screen.getByRole('button', { name: /increase widget quantity/i })).toBeDisabled()
  })

  it('calls onRemove when the trash button is clicked', async () => {
    const onRemove = jest.fn()
    render(
      <OrderSummarySheet
        open
        lines={[resolvedLine]}
        fees={fees}
        onClose={noop}
        onSetQuantity={noop}
        onRemove={onRemove}
        onPrimary={noop}
        primaryLabel="Go to checkout"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /remove widget/i }))

    expect(onRemove).toHaveBeenCalledWith('p1')
  })

  it('calls onPrimary with the given label when the primary button is clicked', async () => {
    const onPrimary = jest.fn()
    render(
      <OrderSummarySheet
        open
        lines={[resolvedLine]}
        fees={fees}
        onClose={noop}
        onSetQuantity={noop}
        onRemove={noop}
        onPrimary={onPrimary}
        primaryLabel="Pay now"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Pay now' }))

    expect(onPrimary).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the scrim or the close button is clicked', async () => {
    const onClose = jest.fn()
    render(
      <OrderSummarySheet
        open
        lines={[resolvedLine]}
        fees={fees}
        onClose={onClose}
        onSetQuantity={noop}
        onRemove={noop}
        onPrimary={noop}
        primaryLabel="Go to checkout"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: /close order summary/i }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('calls onClose on Escape and restores body overflow on unmount', () => {
    const onClose = jest.fn()
    const { unmount } = render(
      <OrderSummarySheet
        open
        lines={[resolvedLine]}
        fees={fees}
        onClose={onClose}
        onSetQuantity={noop}
        onRemove={noop}
        onPrimary={noop}
        primaryLabel="Go to checkout"
      />,
    )

    expect(document.body.style.overflow).toBe('hidden')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
