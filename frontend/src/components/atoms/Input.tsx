import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn('field-input', invalid && 'border-red-500', className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
})
