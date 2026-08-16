import { useMemo } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Button } from '../components/atoms/Button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { goToStep, submitTransaction } from '../features/checkout/checkoutSlice'
import { computeFees, resolveCartLines } from '../lib/cart'
import { formatCurrency } from '../lib/formatCurrency'

export function CheckoutSummaryPage() {
  const dispatch = useAppDispatch()
  const cart = useAppSelector((state) => state.checkout.cart)
  const customer = useAppSelector((state) => state.checkout.customer)
  const delivery = useAppSelector((state) => state.checkout.delivery)
  const cardBrand = useAppSelector((state) => state.checkout.cardBrand)
  const cardLastFour = useAppSelector((state) => state.checkout.cardLastFour)
  const status = useAppSelector((state) => state.checkout.status)
  const error = useAppSelector((state) => state.checkout.error)

  const lines = useMemo(() => resolveCartLines(cart), [cart])
  const fees = useMemo(() => computeFees(lines), [lines])
  const submitting = status === 'submitting'

  return (
    <Layout
      header={
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            aria-label="Back to details"
            onClick={() => dispatch(goToStep('details'))}
            className="grid size-9 place-items-center rounded-full text-neutral hover:bg-neutral-soft"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <h2 className="font-heading text-lg font-semibold">Review order</h2>
          <span className="ml-auto flex items-center gap-1 text-xs text-neutral-muted">
            <Lock className="size-3.5" aria-hidden="true" />
            Secure
          </span>
        </div>
      }
    >
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <section className="card flex flex-col gap-3">
          <h3 className="font-heading text-base font-semibold">Items</h3>
          <ul className="flex flex-col gap-3">
            {lines.map(({ line, lineTotalInCents }) => (
              <li key={line.productId} className="flex items-center gap-3">
                <img src={line.imageUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.name}</p>
                  <p className="text-xs text-neutral-muted">Qty {line.quantity}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{formatCurrency(lineTotalInCents)}</span>
              </li>
            ))}
          </ul>
        </section>

        {customer && delivery && (
          <section className="card flex flex-col gap-3 text-sm">
            <div>
              <h3 className="font-heading text-base font-semibold">Delivery to</h3>
              <p className="mt-1 text-neutral-muted">
                {customer.fullName} · {customer.email}
              </p>
              <p className="text-neutral-muted">
                {delivery.address}, {delivery.city}, {delivery.region}
              </p>
            </div>
            {cardBrand && cardLastFour && (
              <div>
                <h3 className="font-heading text-base font-semibold">Payment</h3>
                <p className="mt-1 text-neutral-muted">
                  {cardBrand} •••• {cardLastFour}
                </p>
              </div>
            )}
          </section>
        )}

        <section className="card flex flex-col gap-2 text-sm">
          <Row label="Subtotal" valueInCents={fees.subtotalInCents} />
          <Row label="Base fee" valueInCents={fees.baseFeeInCents} />
          <Row label="Delivery" valueInCents={fees.deliveryFeeInCents} />
          <div className="my-1 border-t border-dashed border-neutral-muted/30" />
          <div className="flex items-center justify-between">
            <span className="font-heading text-lg font-semibold">Total</span>
            <span className="font-heading text-lg font-semibold">{formatCurrency(fees.totalInCents)}</span>
          </div>
        </section>

        {error && <p className="field-error">{error.message}</p>}

        <Button
          type="button"
          variant="primary"
          loading={submitting}
          onClick={() => dispatch(submitTransaction())}
        >
          Pay {formatCurrency(fees.totalInCents)}
        </Button>
      </div>
    </Layout>
  )
}

function Row({ label, valueInCents }: { label: string; valueInCents: number }) {
  return (
    <div className="flex items-center justify-between text-neutral-muted">
      <span>{label}</span>
      <span className="text-neutral">{formatCurrency(valueInCents)}</span>
    </div>
  )
}
