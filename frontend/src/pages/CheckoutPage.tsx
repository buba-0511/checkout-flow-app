import { useAppSelector } from '../store/hooks'
import { CheckoutDetailsPage } from './CheckoutDetailsPage'
import { CheckoutSummaryPage } from './CheckoutSummaryPage'
import { CheckoutResultPage } from './CheckoutResultPage'

// Internal wizard, not routed (see project decision: checkout is linear and
// not shareable/bookmarkable per-step, unlike the catalog and product pages).
export function CheckoutPage() {
  const step = useAppSelector((state) => state.checkout.step)

  if (step === 'summary') return <CheckoutSummaryPage />
  if (step === 'result') return <CheckoutResultPage />
  return <CheckoutDetailsPage />
}
