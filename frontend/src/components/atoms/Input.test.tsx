import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { Input } from './Input'

describe('Input', () => {
  it('renders as a text input by default and accepts typing', async () => {
    render(<Input placeholder="Full name" />)
    const input = screen.getByPlaceholderText('Full name')

    await userEvent.type(input, 'Jane Doe')

    expect(input).toHaveValue('Jane Doe')
  })

  it('marks itself invalid via aria-invalid and an error border', () => {
    render(<Input placeholder="Email" invalid />)
    const input = screen.getByPlaceholderText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveClass('border-red-500')
  })

  it('does not set aria-invalid when not invalid', () => {
    render(<Input placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).not.toHaveAttribute('aria-invalid')
  })

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} placeholder="Email" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
