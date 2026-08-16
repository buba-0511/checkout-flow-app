import { Layout } from '../components/Layout'
import { ProductGrid } from '../components/organisms/ProductGrid'
import { useProducts } from '../features/catalog/useProducts'
import { useAppDispatch } from '../store/hooks'
import { addToCart, startBuyNow } from '../features/checkout/checkoutSlice'
import type { Product } from '../api/resources'

export function ProductCatalogPage() {
  const { products, loading, error } = useProducts()
  const dispatch = useAppDispatch()

  function handleBuyNow(product: Product, quantity: number) {
    dispatch(startBuyNow({ product, quantity }))
  }

  function handleAddToCart(product: Product, quantity: number) {
    dispatch(addToCart({ product, quantity }))
  }

  return (
    <Layout>
      <div className="mb-8 max-w-xl sm:mb-10">
        <h1 className="font-heading text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">
          Small-batch coffee, roasted to order.
        </h1>
        <p className="mt-3 text-neutral-muted">
          Single-origin beans from farms we know by name, roasted weekly and shipped fresh.
        </p>
      </div>
      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        onBuyNow={handleBuyNow}
        onAddToCart={handleAddToCart}
      />
    </Layout>
  )
}
