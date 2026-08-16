import { useEffect } from 'react'
import { Check, Loader2, RotateCcw, ShoppingBag, X } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Badge } from '../components/atoms/Badge'
import { Button } from '../components/atoms/Button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  goToStep,
  resetCheckout,
  syncTransactionStatus,
  transactionStatusUpdated,
} from '../features/checkout/checkoutSlice'
import { TransactionStatus, type Transaction } from '../api/resources'
import { formatCurrency } from '../lib/formatCurrency'
import { createTransactionSocket } from '../lib/socket'

export function CheckoutResultPage() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.checkout.status)
  const transaction = useAppSelector((state) => state.checkout.transaction)
  const error = useAppSelector((state) => state.checkout.error)
  const transactionId = transaction?.id

  const resolving = status === 'submitting' || status === 'awaitingResult'

  // Subscribes to this transaction's room and waits for the webhook-driven
  // push. Also does one catch-up fetch in case the update already happened
  // before the socket connected (e.g. the page was refreshed mid-payment).
  useEffect(() => {
    if (status !== 'awaitingResult' || !transactionId) return

    const socket = createTransactionSocket()
    socket.connect()
    socket.emit('subscribe', transactionId)
    socket.on('transaction:update', (updated: Transaction) => {
      dispatch(transactionStatusUpdated(updated))
    })
    void dispatch(syncTransactionStatus(transactionId))

    return () => {
      socket.disconnect()
    }
  }, [status, transactionId, dispatch])

  return (
    <Layout>
      <div className="mx-auto flex max-w-sm flex-col items-center py-8 text-center">
        {resolving && (
          <>
            <div className="grid size-20 place-items-center rounded-full bg-neutral-soft">
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
            </div>
            <h1 className="font-heading mt-6 text-2xl font-semibold">Processing payment</h1>
            <p className="mt-2 text-sm text-neutral-muted">
              Hold tight while we confirm your order. This only takes a moment.
            </p>
          </>
        )}

        {!resolving && status === 'error' && (
          <>
            <div className="grid size-20 place-items-center rounded-full bg-red-100">
              <X className="size-7 text-red-600" strokeWidth={3} aria-hidden="true" />
            </div>
            <h1 className="font-heading mt-6 text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-neutral-muted">{error?.message ?? 'Please try again.'}</p>
            <Button
              variant="primary"
              icon={<RotateCcw className="size-4" aria-hidden="true" />}
              onClick={() => dispatch(goToStep('summary'))}
              className="mt-6 w-full"
            >
              Try again
            </Button>
          </>
        )}

        {!resolving && status === 'idle' && transaction && transaction.status === TransactionStatus.APPROVED && (
          <>
            <div className="grid size-20 place-items-center rounded-full bg-green-100">
              <Check className="size-7 text-green-700" strokeWidth={3} aria-hidden="true" />
            </div>
            <h1 className="font-heading mt-6 text-2xl font-semibold">Order confirmed</h1>
            <p className="mt-2 text-sm text-neutral-muted">
              Thank you. We&apos;re roasting your beans now.
            </p>

            <div className="card mt-6 w-full text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-muted">Order reference</span>
                <span className="font-mono font-semibold">{transaction.reference}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-neutral-muted">Amount paid</span>
                <span className="font-semibold">{formatCurrency(transaction.totalAmountInCents)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-neutral-muted">Status</span>
                <Badge status={transaction.status} />
              </div>
            </div>

            <Button
              variant="primary"
              icon={<ShoppingBag className="size-4" aria-hidden="true" />}
              onClick={() => dispatch(resetCheckout())}
              className="mt-6 w-full"
            >
              Continue shopping
            </Button>
          </>
        )}

        {!resolving &&
          status === 'idle' &&
          transaction &&
          transaction.status !== TransactionStatus.APPROVED && (
            <>
              <div className="grid size-20 place-items-center rounded-full bg-secondary/15">
                <X className="size-7 text-secondary" strokeWidth={3} aria-hidden="true" />
              </div>
              <h1 className="font-heading mt-6 text-2xl font-semibold">Payment didn&apos;t go through</h1>
              <p className="mt-2 text-sm text-neutral-muted">
                No charge was made. Your cart is saved, so you can try again.
              </p>
              <div className="mt-4">
                <Badge status={transaction.status} />
              </div>
              <Button
                variant="primary"
                icon={<RotateCcw className="size-4" aria-hidden="true" />}
                onClick={() => dispatch(goToStep('details'))}
                className="mt-6 w-full"
              >
                Try again
              </Button>
              <button
                type="button"
                onClick={() => dispatch(resetCheckout())}
                className="mt-3 text-sm text-neutral-muted hover:text-neutral"
              >
                Back to catalog
              </button>
            </>
          )}
      </div>
    </Layout>
  )
}
