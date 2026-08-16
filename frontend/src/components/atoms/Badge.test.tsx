import { render, screen } from '@testing-library/react'
import { TransactionStatus } from '../../api/resources'
import { Badge } from './Badge'

describe('Badge', () => {
  it.each([
    [TransactionStatus.PENDING, 'Pending', 'badge-pending'],
    [TransactionStatus.APPROVED, 'Approved', 'badge-approved'],
    [TransactionStatus.DECLINED, 'Declined', 'badge-declined'],
    [TransactionStatus.VOIDED, 'Voided', 'badge-error'],
    [TransactionStatus.ERROR, 'Error', 'badge-error'],
  ])('renders %s as "%s" with class %s', (status, label, className) => {
    render(<Badge status={status} />)
    expect(screen.getByText(label)).toHaveClass(className)
  })
})
