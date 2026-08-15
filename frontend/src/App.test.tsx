import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the counter button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /count is 0/i })).toBeInTheDocument()
  })

  it('increments the counter on click', () => {
    render(<App />)
    const button = screen.getByRole('button', { name: /count is/i })
    fireEvent.click(button)
    expect(button).toHaveTextContent('Count is 1')
  })
})
