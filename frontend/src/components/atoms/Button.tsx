import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'inverted'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outlined: 'btn-outlined',
  inverted: 'btn-inverted',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(VARIANT_CLASS[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner className="size-5" /> : icon}
      {children}
    </button>
  )
}
