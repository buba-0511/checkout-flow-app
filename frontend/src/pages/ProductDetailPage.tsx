import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingCart, Zap } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Button } from '../components/atoms/Button'
import { Spinner } from '../components/atoms/Spinner'
import { useProduct } from '../features/catalog/useProduct'
import { useAppDispatch } from '../store/hooks'
import { addToCart, startBuyNow } from '../features/checkout/checkoutSlice'
import { cn } from '../lib/cn'
import { formatCurrency } from '../lib/formatCurrency'

const LOW_STOCK_THRESHOLD = 5

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { product, loading, error } = useProduct(id ?? '')
  const dispatch = useAppDispatch()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  // Reset the gallery selection when navigating to a different product —
  // adjusting state during render (not in an effect) avoids an extra frame
  // where the old image briefly shows for the new product.
  const [renderedForId, setRenderedForId] = useState(id)
  if (id !== renderedForId) {
    setRenderedForId(id)
    setSelectedImage(0)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner className="size-8 text-primary" />
        </div>
      </Layout>
    )
  }

  if (error || !product) {
    return (
      <Layout>
        <p className="py-12 text-center text-red-600">
          {error?.message ?? 'This product could not be found.'}
        </p>
        <Link to="/" className="btn-secondary mx-auto w-fit">
          Back to catalog
        </Link>
      </Layout>
    )
  }

  const outOfStock = product.stock <= 0
  const lowStock = !outOfStock && product.stock <= LOW_STOCK_THRESHOLD
  const stockLabel = outOfStock ? 'Out of stock' : `${product.stock} left`

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1))
  }

  function increment() {
    if (!product) return
    setQuantity((q) => Math.min(product.stock, q + 1))
  }

  return (
    <Layout>
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-muted hover:text-neutral">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to catalog
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="max-w-xl">
          <div className="relative overflow-hidden rounded-xl">
            <img
              src={product.imageUrls[selectedImage]}
              alt={product.name}
              className={cn('aspect-square w-full object-cover', outOfStock && 'opacity-50 grayscale')}
            />
            {outOfStock && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="rounded-full bg-neutral px-4 py-1.5 text-xs font-semibold tracking-wide text-tertiary uppercase shadow-sm">
                  Out of stock
                </span>
              </div>
            )}
          </div>
          {product.imageUrls.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {product.imageUrls.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Show image ${index + 1} of ${product.name}`}
                  aria-current={index === selectedImage}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'overflow-hidden rounded-lg border-2 transition-colors',
                    index === selectedImage ? 'border-primary' : 'border-transparent',
                  )}
                >
                  <img src={url} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-neutral-muted/30 bg-white px-3 py-1 text-xs font-medium text-neutral"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div>
            <h1 className="font-heading text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-neutral-muted">{product.description}</p>
          </div>

          <div>
            <span className="font-heading text-2xl font-semibold">
              {formatCurrency(product.priceInCents)}
            </span>
            {lowStock && <p className="mt-1 text-sm font-medium text-secondary">Only {stockLabel}</p>}
            {!outOfStock && !lowStock && (
              <p className="mt-1 text-sm text-neutral-muted">{stockLabel}</p>
            )}
          </div>

          <div className="flex items-center gap-1 self-start rounded-full border border-neutral-muted">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={decrement}
              disabled={quantity <= 1}
              className="grid size-10 place-items-center rounded-full text-neutral hover:bg-neutral-soft disabled:opacity-30"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="w-6 text-center font-medium">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={increment}
              disabled={quantity >= product.stock}
              className="grid size-10 place-items-center rounded-full text-neutral hover:bg-neutral-soft disabled:opacity-30"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2 flex gap-2">
            <Button
              variant="outlined"
              className="flex-1"
              icon={<ShoppingCart className="size-4" aria-hidden="true" />}
              disabled={outOfStock}
              onClick={() => dispatch(addToCart({ product, quantity }))}
            >
              Add to cart
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              icon={<Zap className="size-4" aria-hidden="true" />}
              disabled={outOfStock}
              onClick={() => dispatch(startBuyNow({ product, quantity }))}
            >
              Buy now
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
