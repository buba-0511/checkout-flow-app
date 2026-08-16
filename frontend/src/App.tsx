import { Navigate, Route, Routes } from 'react-router-dom'
import { ProductCatalogPage } from './pages/ProductCatalogPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { CartOverlay } from './components/CartOverlay'
import { useAppSelector } from './store/hooks'

function App() {
  const view = useAppSelector((state) => state.checkout.view)

  // Checkout overlays whatever route the user was on — it isn't itself
  // routed (see project decision: checkout is a linear wizard, not a set
  // of shareable/bookmarkable pages, unlike the catalog and product pages).
  if (view !== 'catalog') {
    return <CheckoutPage />
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
