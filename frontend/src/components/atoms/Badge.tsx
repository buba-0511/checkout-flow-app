import { TransactionStatus } from '../../api/resources'

const STATUS_CLASS: Record<TransactionStatus, string> = {
  PENDING: 'badge-pending',
  APPROVED: 'badge-approved',
  DECLINED: 'badge-declined',
  VOIDED: 'badge-error',
  ERROR: 'badge-error',
}

const STATUS_LABEL: Record<TransactionStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
  VOIDED: 'Voided',
  ERROR: 'Error',
}

interface BadgeProps {
  status: TransactionStatus
}

export function Badge({ status }: BadgeProps) {
  return <span className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</span>
}
