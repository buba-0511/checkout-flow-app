import { ShoppingBag } from 'lucide-react'
import { formatCurrency } from '../../lib/formatCurrency'

interface CartSummaryBarProps {
  itemCount: number
  subtotalInCents: number
  onViewCart: () => void
}

export function CartSummaryBar({ itemCount, subtotalInCents, onViewCart }: CartSummaryBarProps) {
  if (itemCount === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* A floating pill stays a comfortable fixed width even on a full-bleed page — it's a toast, not page content. */}
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={onViewCart}
          className="flex w-full items-center justify-between gap-4 rounded-full bg-primary px-3 py-3 pl-5 text-white shadow-lg transition-transform active:scale-[0.98]"
        >
          <span className="flex items-center gap-3">
            <span className="relative grid size-9 place-items-center rounded-full bg-white/10">
              <ShoppingBag className="size-4" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 grid size-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-[11px] font-bold text-white">
                {itemCount}
              </span>
            </span>
            <span className="text-sm font-medium">View cart</span>
          </span>
          <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
            {formatCurrency(subtotalInCents)}
          </span>
        </button>
      </div>
    </div>
  )
}
