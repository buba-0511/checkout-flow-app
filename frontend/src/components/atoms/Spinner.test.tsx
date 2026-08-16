import { render } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders a spinning, decorative icon', () => {
    const { container } = render(<Spinner />)
    const icon = container.querySelector('svg')
    expect(icon).toHaveClass('animate-spin')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('merges an extra className', () => {
    const { container } = render(<Spinner className="size-8" />)
    expect(container.querySelector('svg')).toHaveClass('animate-spin', 'size-8')
  })
})
