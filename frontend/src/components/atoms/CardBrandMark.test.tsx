import { render, screen } from '@testing-library/react'
import { CardBrandMark } from './CardBrandMark'

describe('CardBrandMark', () => {
  it('renders the Visa mark', () => {
    render(<CardBrandMark brand="visa" />)
    expect(screen.getByRole('img', { name: 'Visa' })).toBeInTheDocument()
  })

  it('renders the Mastercard mark', () => {
    render(<CardBrandMark brand="mastercard" />)
    expect(screen.getByRole('img', { name: 'Mastercard' })).toBeInTheDocument()
  })

  it('renders a neutral glyph for unknown brands', () => {
    render(<CardBrandMark brand="unknown" />)
    expect(screen.getByLabelText('Card')).toBeInTheDocument()
  })
})
