import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { ReactElement } from 'react'
import { Layout } from './Layout'
import checkoutReducer, { type CheckoutState } from '../features/checkout/checkoutSlice'

function renderWithStore(ui: ReactElement, overrides?: Partial<CheckoutState>) {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: {
      checkout: { ...checkoutReducer(undefined, { type: '@@init' }), ...overrides },
    },
  })
  render(<Provider store={store}>{ui}</Provider>)
  return store
}

describe('Layout', () => {
  it('renders the default brand header and the children', () => {
    renderWithStore(
      <Layout>
        <p>Page content</p>
      </Layout>,
    )
    expect(screen.getByText('Kōfe')).toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('renders a custom header when provided, instead of the default one (and no cart button)', () => {
    renderWithStore(
      <Layout header={<span>Checkout — step 2</span>}>
        <p>Page content</p>
      </Layout>,
    )
    expect(screen.getByText('Checkout — step 2')).toBeInTheDocument()
    expect(screen.queryByText('Kōfe')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /view cart/i })).not.toBeInTheDocument()
  })

  it('shows the cart button with no badge when the cart is empty', () => {
    renderWithStore(
      <Layout>
        <p>Page content</p>
      </Layout>,
    )

    const cartButton = screen.getByRole('button', { name: 'View cart' })
    expect(cartButton).toBeInTheDocument()
  })

  it('shows the item count badge when the cart has items', () => {
    renderWithStore(
      <Layout>
        <p>Page content</p>
      </Layout>,
      { cart: [{ productId: 'p1', name: 'Widget', priceInCents: 1000, imageUrl: 'x', stock: 5, quantity: 3 }] },
    )

    expect(screen.getByRole('button', { name: 'View cart (3 items)' })).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('dispatches openCartSheet when the cart button is clicked', async () => {
    const store = renderWithStore(
      <Layout>
        <p>Page content</p>
      </Layout>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'View cart' }))

    expect(store.getState().checkout.cartSheetOpen).toBe(true)
  })
})
