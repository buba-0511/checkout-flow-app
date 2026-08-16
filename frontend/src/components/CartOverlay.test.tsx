import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { CartOverlay } from './CartOverlay'
import checkoutReducer, { type CheckoutState } from '../features/checkout/checkoutSlice'

const line = {
  productId: 'p1',
  name: 'Widget',
  priceInCents: 1000,
  imageUrl: 'http://x/widget.jpg',
  stock: 5,
  quantity: 2,
}

function renderWithState(overrides?: Partial<CheckoutState>) {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: {
      checkout: { ...checkoutReducer(undefined, { type: '@@init' }), ...overrides },
    },
  })
  render(
    <Provider store={store}>
      <CartOverlay />
    </Provider>,
  )
  return store
}

describe('CartOverlay', () => {
  it('hides the floating bar and the sheet when the cart is empty', () => {
    renderWithState()

    expect(screen.queryByRole('button', { name: /view cart/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Your order')).not.toBeInTheDocument()
  })

  it('shows the floating bar with item count and subtotal when the cart has items', () => {
    renderWithState({ cart: [line] })

    expect(screen.getByRole('button', { name: /view cart/i })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('$ 20')).toBeInTheDocument()
  })

  it('opens the sheet when the floating bar is clicked', async () => {
    const store = renderWithState({ cart: [line] })

    await userEvent.click(screen.getByRole('button', { name: /view cart/i }))

    expect(store.getState().checkout.cartSheetOpen).toBe(true)
    expect(screen.getByText('Your order')).toBeInTheDocument()
    expect(screen.getByText('Widget')).toBeInTheDocument()
  })

  it('renders the sheet directly when cartSheetOpen is already true', () => {
    renderWithState({ cart: [line], cartSheetOpen: true })

    expect(screen.getByText('Your order')).toBeInTheDocument()
  })

  it('dispatches updateCartQuantity from the stepper', async () => {
    const store = renderWithState({ cart: [line], cartSheetOpen: true })

    await userEvent.click(screen.getByRole('button', { name: /increase widget quantity/i }))

    expect(store.getState().checkout.cart[0].quantity).toBe(3)
  })

  it('dispatches removeFromCart from the trash button', async () => {
    const store = renderWithState({ cart: [line], cartSheetOpen: true })

    await userEvent.click(screen.getByRole('button', { name: /remove widget/i }))

    expect(store.getState().checkout.cart).toHaveLength(0)
  })

  it('dispatches startCartCheckout from the primary button', async () => {
    const store = renderWithState({ cart: [line], cartSheetOpen: true })

    await userEvent.click(screen.getByRole('button', { name: /go to checkout/i }))

    expect(store.getState().checkout.view).toBe('checkout')
    expect(store.getState().checkout.source).toBe('CART')
  })

  it('dispatches closeCartSheet when the sheet is closed', async () => {
    const store = renderWithState({ cart: [line], cartSheetOpen: true })

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(store.getState().checkout.cartSheetOpen).toBe(false)
  })
})
