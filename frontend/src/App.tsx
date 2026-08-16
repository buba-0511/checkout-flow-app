import { Navigate, Route, Routes } from 'react-router-dom'
import { ProductCatalogPage } from './pages/ProductCatalogPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { Layout } from './components/Layout'
import { CartOverlay } from './components/CartOverlay'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { resetCheckout } from './features/checkout/checkoutSlice'

function App() {
  const view = useAppSelector((state) => state.checkout.view)
  const dispatch = useAppDispatch()

  // Checkout overlays whatever route the user was on — it isn't itself
  // routed (see project decision: checkout is a linear wizard, not a set
  // of shareable/bookmarkable pages, unlike the catalog and product pages).
  if (view !== 'catalog') {
    // Checkout screens (details/summary/result) land in a follow-up change —
    // this placeholder just needs a working way back until then.
    return (
      <Layout>
        <p className="text-neutral-muted">Checkout coming soon.</p>
        <button
          type="button"
          onClick={() => dispatch(resetCheckout())}
          className="btn-secondary mt-4"
        >
          Back to catalog
        </button>
      </Layout>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<ProductCatalogPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CartOverlay />
    </>
  )
}

export default App
