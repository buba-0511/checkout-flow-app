import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Zap } from 'lucide-react'
import { Button } from '../atoms/Button'
import { cn } from '../../lib/cn'
import { formatCurrency } from '../../lib/formatCurrency'
import type { Product } from '../../api/resources'

interface ProductCardProps {
  product: Product
  onBuyNow: (product: Product, quantity: number) => void
  onAddToCart: (product: Product, quantity: number) => void
}

const LOW_STOCK_THRESHOLD = 5

export function ProductCard({ product, onBuyNow, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)
  const outOfStock = product.stock <= 0
  const lowStock = !outOfStock && product.stock <= LOW_STOCK_THRESHOLD
  const stockLabel = outOfStock ? 'Out of stock' : `${product.stock} left`
  const hasGallery = product.imageUrls.length > 1

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1))
  }

  function increment() {
    setQuantity((q) => Math.min(product.stock, q + 1))
  }

  function showPrevImage(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setImageIndex((i) => (i === 0 ? product.imageUrls.length - 1 : i - 1))
  }

  function showNextImage(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setImageIndex((i) => (i === product.imageUrls.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="card group flex flex-col gap-3 transition-shadow hover:shadow-md">
      <div className="relative -mx-4 -mt-4 overflow-hidden rounded-t-xl">
        <Link to={`/products/${product.id}`}>
          <img
            src={product.imageUrls[imageIndex]}
            alt={product.name}
            className={cn(
              'aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105',
              outOfStock && 'opacity-50 grayscale',
            )}
            loading="lazy"
          />
        </Link>
        <div className="absolute inset-x-3 top-3 flex items-start gap-2">
          {product.tags.length > 0 && (
            <span className="min-w-0 truncate rounded-full border border-neutral-muted/30 bg-white/80 px-3 py-1 text-xs font-medium text-neutral shadow-sm backdrop-blur">
              {product.tags.join(' · ')}
            </span>
          )}
          {lowStock && (
            <span className="badge-pending ml-auto shrink-0 shadow-sm">{stockLabel}</span>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-neutral px-4 py-1.5 text-xs font-semibold tracking-wide text-tertiary uppercase shadow-sm">
              Out of stock
            </span>
          </div>
        )}
        {hasGallery && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={showPrevImage}
              className="absolute top-1/2 left-2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-neutral opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={showNextImage}
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-neutral opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {product.imageUrls.map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    'size-1.5 rounded-full shadow-sm transition-colors',
                    index === imageIndex ? 'bg-white' : 'bg-white/50',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <Link to={`/products/${product.id}`}>
        <h3 className="font-heading text-base font-semibold hover:underline">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-neutral-muted">{product.description}</p>
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
        <div>
          <span className="font-heading text-lg font-semibold">
            {formatCurrency(product.priceInCents)}
          </span>
          {!outOfStock && !lowStock && (
            <p className="text-xs text-neutral-muted">{stockLabel}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full border border-neutral-muted">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={decrement}
            disabled={quantity <= 1}
            className="grid size-7 place-items-center rounded-full text-neutral hover:bg-neutral-soft disabled:opacity-30"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <span className="w-4 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={increment}
            disabled={quantity >= product.stock}
            className="grid size-7 place-items-center rounded-full text-neutral hover:bg-neutral-soft disabled:opacity-30"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-auto flex gap-2">
        <Button
          variant="outlined"
          className="flex-1"
          icon={<ShoppingCart className="size-4" aria-hidden="true" />}
          disabled={outOfStock}
          onClick={() => onAddToCart(product, quantity)}
        >
          Add
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          icon={<Zap className="size-4" aria-hidden="true" />}
          disabled={outOfStock}
          onClick={() => onBuyNow(product, quantity)}
        >
          Buy now
        </Button>
      </div>
    </div>
  )
}
