import { useEffect } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { formatCurrency } from '../../lib/formatCurrency'
import type { Fees, ResolvedCartLine } from '../../lib/cart'

interface OrderSummarySheetProps {
  open: boolean
  lines: ResolvedCartLine[]
  fees: Fees
  onClose: () => void
  onSetQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  onPrimary: () => void
  primaryLabel: string
}

export function OrderSummarySheet({
  open,
  lines,
  fees,
  onClose,
  onSetQuantity,
  onRemove,
  onPrimary,
  primaryLabel,
}: OrderSummarySheetProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const empty = lines.length === 0

  return (
    <div role="dialog" aria-modal="true" aria-label="Order summary">
      <button
        type="button"
        aria-label="Close order summary"
        onClick={onClose}
        className="backdrop-scrim"
      />

      <div className="backdrop-sheet">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Your order</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-neutral hover:bg-neutral-soft"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-neutral-soft">
              <ShoppingBag className="size-6 text-neutral-muted" aria-hidden="true" />
            </div>
            <p className="text-sm text-neutral-muted">Your cart is empty.</p>
          </div>
        ) : (
          <ul className="flex flex-1 flex-col gap-4">
            {lines.map(({ line, lineTotalInCents }) => (
              <li key={line.productId} className="flex gap-3">
                <img
                  src={line.imageUrl}
                  alt=""
                  className="size-16 shrink-0 rounded-xl object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium text-neutral">{line.name}</p>
                    <span className="shrink-0 font-semibold text-neutral">
                      {formatCurrency(lineTotalInCents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border border-neutral-muted">
                      <button
                        type="button"
                        aria-label={`Decrease ${line.name} quantity`}
                        onClick={() => onSetQuantity(line.productId, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        className="grid size-7 place-items-center rounded-full text-neutral hover:bg-neutral-soft disabled:opacity-30"
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-4 text-center text-sm font-medium">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${line.name} quantity`}
                        onClick={() => onSetQuantity(line.productId, line.quantity + 1)}
                        disabled={line.quantity >= line.stock}
                        className="grid size-7 place-items-center rounded-full text-neutral hover:bg-neutral-soft disabled:opacity-30"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(line.productId)}
                      aria-label={`Remove ${line.name}`}
                      className="grid size-8 place-items-center rounded-full text-neutral-muted hover:bg-neutral-soft hover:text-red-600"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!empty && (
          <div className="mt-4 shrink-0 border-t border-neutral-muted/20 pt-4">
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="Subtotal" valueInCents={fees.subtotalInCents} />
              <Row label="Base fee" valueInCents={fees.baseFeeInCents} />
              <Row label="Delivery" valueInCents={fees.deliveryFeeInCents} />
              <div className="my-1 border-t border-dashed border-neutral-muted/30" />
              <div className="flex items-center justify-between">
                <dt className="font-heading text-lg font-semibold">Total</dt>
                <dd className="font-heading text-lg font-semibold">
                  {formatCurrency(fees.totalInCents)}
                </dd>
              </div>
            </dl>
            <button type="button" onClick={onPrimary} className="btn-primary mt-4 w-full">
              {primaryLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, valueInCents }: { label: string; valueInCents: number }) {
  return (
    <div className="flex items-center justify-between text-neutral-muted">
      <dt>{label}</dt>
      <dd className="text-neutral">{formatCurrency(valueInCents)}</dd>
    </div>
  )
}
