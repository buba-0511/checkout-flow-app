import { render, screen } from '@testing-library/react'
import { Field } from './Field'

describe('Field', () => {
  it('associates the label with the input via id', () => {
    render(<Field label="Full name" value="" onChange={() => {}} />)

    expect(screen.getByLabelText('Full name')).toBeInTheDocument()
  })

  it('shows an "(optional)" suffix when optional', () => {
    render(<Field label="Complement" optional value="" onChange={() => {}} />)

    expect(screen.getByText('(optional)')).toBeInTheDocument()
  })

  it('shows the error message and marks the input invalid', () => {
    render(<Field label="Email" error="Enter a valid email." value="" onChange={() => {}} />)

    expect(screen.getByText('Enter a valid email.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders no error message when valid', () => {
    const { container } = render(<Field label="Email" value="a@b.com" onChange={() => {}} />)

    expect(container.querySelector('.field-error')).not.toBeInTheDocument()
  })

  it('renders an end adornment', () => {
    render(<Field label="Card number" endAdornment={<span>VISA</span>} value="" onChange={() => {}} />)

    expect(screen.getByText('VISA')).toBeInTheDocument()
  })
})
