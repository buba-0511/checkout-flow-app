import { ProductCard } from '../molecules/ProductCard'
import { Spinner } from '../atoms/Spinner'
import type { ApiError } from '../../api/types'
import type { Product } from '../../api/resources'

interface ProductGridProps {
  products: Product[]
  loading: boolean
  error: ApiError | null
  onBuyNow: (product: Product, quantity: number) => void
  onAddToCart: (product: Product, quantity: number) => void
}

export function ProductGrid({ products, loading, error, onBuyNow, onAddToCart }: ProductGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (error) {
    return <p className="py-12 text-center text-red-600">{error.message}</p>
  }

  if (products.length === 0) {
    return <p className="py-12 text-center text-neutral-muted">No products available right now.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onBuyNow={onBuyNow}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
}
