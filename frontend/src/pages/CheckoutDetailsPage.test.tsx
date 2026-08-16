import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { CheckoutDetailsPage } from './CheckoutDetailsPage'
import checkoutReducer, { type CheckoutState, type CartLine } from '../features/checkout/checkoutSlice'
import { tokenizeCard, CardTokenizationError } from '../lib/tokenizeCard'

jest.mock('../lib/tokenizeCard', () => ({
  ...jest.requireActual('../lib/tokenizeCard'),
  tokenizeCard: jest.fn(),
}))

const mockTokenizeCard = tokenizeCard as jest.Mock

const line: CartLine = {
  productId: 'p1',
  name: 'Huila Reserve',
  priceInCents: 3490000,
  imageUrl: 'http://x/huila.jpg',
  stock: 8,
  quantity: 1,
}

function renderWithState(overrides?: Partial<CheckoutState>) {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: {
      checkout: { ...checkoutReducer(undefined, { type: '@@init' }), cart: [line], ...overrides },
    },
  })
  render(
    <Provider store={store}>
      <CheckoutDetailsPage />
    </Provider>,
  )
  return store
}

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('Card number'), '4242424242424242')
  await userEvent.type(screen.getByLabelText('Cardholder name'), 'Jane Doe')
  await userEvent.type(screen.getByLabelText('Expiry'), '1229')
  await userEvent.type(screen.getByLabelText('CVV'), '123')
  await userEvent.type(screen.getByLabelText('Full name'), 'Jane Doe')
  await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
  await userEvent.type(screen.getByLabelText('Phone'), '+573001234567')
  await userEvent.type(screen.getByLabelText('ID number'), '1234567890')
  await userEvent.type(screen.getByLabelText('Address'), 'Calle 123')
  await userEvent.type(screen.getByLabelText('City'), 'Bogotá')
  await userEvent.type(screen.getByLabelText('Region'), 'Cundinamarca')
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('CheckoutDetailsPage', () => {
  it('renders the payment, customer, and delivery sections', () => {
    renderWithState()

    expect(screen.getByRole('heading', { name: 'Payment' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Customer' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Delivery' })).toBeInTheDocument()
  })

  it('formats the card number, expiry, and cvv as the user types', async () => {
    renderWithState()

    await userEvent.type(screen.getByLabelText('Card number'), '4242424242424242')
    expect(screen.getByLabelText('Card number')).toHaveValue('4242 4242 4242 4242')

    await userEvent.type(screen.getByLabelText('Expiry'), '1229')
    expect(screen.getByLabelText('Expiry')).toHaveValue('12/29')

    await userEvent.type(screen.getByLabelText('CVV'), '12a3')
    expect(screen.getByLabelText('CVV')).toHaveValue('123')
  })

  it('shows the Visa mark once a visa-prefixed number is entered', async () => {
    renderWithState()

    await userEvent.type(screen.getByLabelText('Card number'), '4242424242424242')

    expect(screen.getByRole('img', { name: 'Visa' })).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty required fields', async () => {
    renderWithState()

    await userEvent.click(screen.getByRole('button', { name: /review order/i }))

    expect(screen.getByText('Card number is required.')).toBeInTheDocument()
    expect(screen.getByText('Cardholder name is required.')).toBeInTheDocument()
    expect(screen.getByText('Full name is required.')).toBeInTheDocument()
    expect(screen.getByText('Address is required.')).toBeInTheDocument()
    expect(mockTokenizeCard).not.toHaveBeenCalled()
  })

  it('tokenizes the card and advances to summary on valid submit', async () => {
    mockTokenizeCard.mockResolvedValue({ id: 'tok_1', brand: 'VISA', lastFour: '4242' })
    const store = renderWithState()

    await fillValidForm()
    await userEvent.click(screen.getByRole('button', { name: /review order/i }))

    await waitFor(() => expect(store.getState().checkout.step).toBe('summary'))
    expect(mockTokenizeCard).toHaveBeenCalledWith({
      number: '4242424242424242',
      cvc: '123',
      expMonth: '12',
      expYear: '29',
      cardHolder: 'Jane Doe',
    })
    expect(store.getState().checkout.customer?.fullName).toBe('Jane Doe')
    expect(store.getState().checkout.delivery?.city).toBe('Bogotá')
    expect(store.getState().checkout.cardToken).toBe('tok_1')
    expect(store.getState().checkout.cardBrand).toBe('VISA')
    expect(store.getState().checkout.cardLastFour).toBe('4242')
  })

  it('shows a field-mapped error and stays on details when tokenization fails validation', async () => {
    mockTokenizeCard.mockRejectedValue(new CardTokenizationError({ number: ['invalid'] }))
    const store = renderWithState()

    await fillValidForm()
    await userEvent.click(screen.getByRole('button', { name: /review order/i }))

    await waitFor(() =>
      expect(screen.getByText('Please check your card details and try again.')).toBeInTheDocument(),
    )
    expect(store.getState().checkout.step).toBe('details')
  })

  it('shows a generic error when tokenization fails for an unexpected reason', async () => {
    mockTokenizeCard.mockRejectedValue(new Error('network down'))
    renderWithState()

    await fillValidForm()
    await userEvent.click(screen.getByRole('button', { name: /review order/i }))

    await waitFor(() =>
      expect(screen.getByText('Could not process the card right now. Try again.')).toBeInTheDocument(),
    )
  })

  it('resets checkout when the back button is clicked', async () => {
    const store = renderWithState()

    await userEvent.click(screen.getByRole('button', { name: /back to catalog/i }))

    expect(store.getState().checkout.view).toBe('catalog')
  })

  it('disables the submit button when the cart is empty', () => {
    renderWithState({ cart: [] })

    expect(screen.getByRole('button', { name: /review order/i })).toBeDisabled()
  })
})
