import { CreditCard } from 'lucide-react'
import type { CardBrand } from '../../lib/cardFormat'

interface CardBrandMarkProps {
  brand: CardBrand
  className?: string
}

/** Renders the detected card brand logo, or a neutral card glyph. */
export function CardBrandMark({ brand, className = '' }: CardBrandMarkProps) {
  if (brand === 'visa') {
    return (
      <svg viewBox="0 0 48 32" className={className} role="img" aria-label="Visa" fill="none">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <path
          d="M20.9 21.3h-2.6l1.6-9.6h2.6l-1.6 9.6Zm7.5-9.4c-.5-.2-1.3-.4-2.3-.4-2.5 0-4.3 1.3-4.3 3.2 0 1.4 1.3 2.2 2.3 2.6 1 .5 1.3.8 1.3 1.2 0 .6-.8.9-1.5.9-1 0-1.6-.2-2.4-.5l-.3-.2-.4 2.2c.6.3 1.7.5 2.8.5 2.7 0 4.4-1.3 4.4-3.3 0-1.1-.7-2-2.2-2.6-.9-.4-1.5-.7-1.5-1.1 0-.4.4-.8 1.4-.8.8 0 1.4.2 1.9.4l.2.1.4-2.1Zm6.7-.2h-2c-.6 0-1.1.2-1.4.8l-3.9 8.8h2.7l.5-1.4h3.3l.3 1.4h2.4l-2-9.6h-.2Zm-3.2 6.2c.2-.5 1-2.6 1-2.6l.3-.8.2.8.6 2.7h-2.1v-.1Zm-15.7-6.2-2.5 6.5-.3-1.3c-.5-1.6-2-3.3-3.6-4.1l2.3 8.5h2.7l4.1-9.6h-2.7Z"
          fill="#fff"
        />
        <path
          d="M11.7 11.7H7.6l-.1.2c3.2.8 5.3 2.7 6.2 5l-.9-4.4c-.1-.6-.6-.8-1.1-.8Z"
          fill="#F7B600"
        />
      </svg>
    )
  }
  if (brand === 'mastercard') {
    return (
      <svg viewBox="0 0 48 32" className={className} role="img" aria-label="Mastercard" fill="none">
        <rect width="48" height="32" rx="4" fill="#F4F4F4" />
        <circle cx="19" cy="16" r="9" fill="#EB001B" />
        <circle cx="29" cy="16" r="9" fill="#F79E1B" fillOpacity="0.9" />
        <path d="M24 9.4a9 9 0 0 0 0 13.2 9 9 0 0 0 0-13.2Z" fill="#FF5F00" />
      </svg>
    )
  }
  return <CreditCard className={`${className} text-neutral-muted`} aria-label="Card" />
}
