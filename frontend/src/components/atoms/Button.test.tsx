import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders children and defaults to the primary variant', () => {
    render(<Button>Pay now</Button>)
    const button = screen.getByRole('button', { name: 'Pay now' })
    expect(button).toHaveClass('btn-primary')
  })

  it('applies the requested variant class', () => {
    render(<Button variant="outlined">Cancel</Button>)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('btn-outlined')
  })

  it('shows a spinner and disables the button while loading', () => {
    render(<Button loading>Pay now</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button.querySelector('svg')).toHaveClass('animate-spin')
  })

  it('is disabled when the disabled prop is set even without loading', () => {
    render(<Button disabled>Pay now</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('fires onClick when clicked', async () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Pay now</Button>)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick while loading', async () => {
    const onClick = jest.fn()
    render(
      <Button loading onClick={onClick}>
        Pay now
      </Button>,
    )

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).not.toHaveBeenCalled()
  })
})
