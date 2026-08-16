import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { CheckoutPage } from './CheckoutPage'
import checkoutReducer, { type CheckoutState } from '../features/checkout/checkoutSlice'

function renderAtStep(step: CheckoutState['step'], overrides?: Partial<CheckoutState>) {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: {
      checkout: { ...checkoutReducer(undefined, { type: '@@init' }), step, ...overrides },
    },
  })
  render(
    <Provider store={store}>
      <CheckoutPage />
    </Provider>,
  )
}

describe('CheckoutPage', () => {
  it('renders the details form for step "details"', () => {
    renderAtStep('details')
    expect(screen.getByRole('heading', { name: 'Checkout' })).toBeInTheDocument()
  })

  it('renders the summary for step "summary"', () => {
    renderAtStep('summary')
    expect(screen.getByRole('heading', { name: 'Review order' })).toBeInTheDocument()
  })

  it('renders the result screen for step "result"', () => {
    renderAtStep('result', { status: 'submitting' })
    expect(screen.getByText('Processing payment')).toBeInTheDocument()
  })
})
