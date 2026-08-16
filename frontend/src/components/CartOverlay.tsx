import { useMemo } from 'react'
import { CartSummaryBar } from './organisms/CartSummaryBar'
import { OrderSummarySheet } from './organisms/OrderSummarySheet'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  closeCartSheet,
  openCartSheet,
  removeFromCart,
  startCartCheckout,
  updateCartQuantity,
} from '../features/checkout/checkoutSlice'
import { computeFees, countItems, resolveCartLines } from '../lib/cart'

// Mounted once around the catalog routes (see App.tsx) so the nav cart icon
// (in Layout) and the mobile floating bar open the same sheet regardless of
// which page — catalog or product detail — is currently showing.
export function CartOverlay() {
  const cart = useAppSelector((state) => state.checkout.cart)
  const cartSheetOpen = useAppSelector((state) => state.checkout.cartSheetOpen)
  const dispatch = useAppDispatch()

  const lines = useMemo(() => resolveCartLines(cart), [cart])
  const fees = useMemo(() => computeFees(lines), [lines])
  const itemCount = countItems(cart)

  return (
    <>
      <CartSummaryBar
        itemCount={itemCount}
        subtotalInCents={fees.subtotalInCents}
        onViewCart={() => dispatch(openCartSheet())}
      />
      <OrderSummarySheet
        open={cartSheetOpen}
        lines={lines}
        fees={fees}
        onClose={() => dispatch(closeCartSheet())}
        onSetQuantity={(productId, quantity) => dispatch(updateCartQuantity({ productId, quantity }))}
        onRemove={(productId) => dispatch(removeFromCart(productId))}
        onPrimary={() => dispatch(startCartCheckout())}
        primaryLabel="Go to checkout"
      />
    </>
  )
}
