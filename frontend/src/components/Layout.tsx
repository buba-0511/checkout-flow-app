import type { ReactNode } from 'react'
import { ShoppingBag } from 'lucide-react'
import { Logo } from './atoms/Logo'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { openCartSheet } from '../features/checkout/checkoutSlice'
import { countItems } from '../lib/cart'

interface LayoutProps {
  children: ReactNode
  header?: ReactNode
}

// Mobile-first shell (brief: minimum reference iPhone SE, 375px viewport) —
// stays a fixed-width column on phones, then goes full-bleed (edge padding
// only, no content max-width) from sm and up.
export function Layout({ children, header }: LayoutProps) {
  const itemCount = useAppSelector((state) => countItems(state.checkout.cart))
  const dispatch = useAppDispatch()

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col sm:max-w-none">
        <header className="flex items-center justify-between gap-2 border-b border-neutral-muted/20 px-4 py-4 sm:px-8 lg:px-12">
          {header ?? (
            <>
              <div className="flex items-center gap-2">
                <Logo className="size-12 text-primary" />
                <span className="font-heading text-2xl font-semibold mt-2">Kōfe</span>
              </div>
              {/* Mobile relies on the floating cart bar instead — this is desktop-only nav real estate. */}
              <button
                type="button"
                aria-label={`View cart${itemCount > 0 ? ` (${itemCount} item${itemCount === 1 ? '' : 's'})` : ''}`}
                onClick={() => dispatch(openCartSheet())}
                className="relative hidden size-10 items-center justify-center rounded-full text-neutral hover:bg-neutral-soft sm:flex"
              >
                <ShoppingBag className="size-5" aria-hidden="true" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid size-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-[11px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </button>
            </>
          )}
        </header>
        <main className="flex-1 px-4 py-4 sm:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  )
}
