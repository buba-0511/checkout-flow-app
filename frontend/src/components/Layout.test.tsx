import { render, screen } from '@testing-library/react'
import { Layout } from './Layout'

describe('Layout', () => {
  it('renders the default brand header and the children', () => {
    render(
      <Layout>
        <p>Page content</p>
      </Layout>,
    )
    expect(screen.getByText('Kōfe')).toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('renders a custom header when provided, instead of the default one', () => {
    render(
      <Layout header={<span>Checkout — step 2</span>}>
        <p>Page content</p>
      </Layout>,
    )
    expect(screen.getByText('Checkout — step 2')).toBeInTheDocument()
    expect(screen.queryByText('Kōfe')).not.toBeInTheDocument()
  })
})
