import { ProductCatalogPage } from './pages/ProductCatalogPage'
import { Layout } from './components/Layout'
import { useAppSelector } from './store/hooks'

function App() {
  const view = useAppSelector((state) => state.checkout.view)

  if (view === 'catalog') {
    return <ProductCatalogPage />
  }

  // Checkout screens (details/summary/result) land in a follow-up change.
  return (
    <Layout>
      <p className="text-neutral-muted">Checkout coming soon.</p>
    </Layout>
  )
}

export default App
