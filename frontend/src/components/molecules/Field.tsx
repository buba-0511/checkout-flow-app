import { useId, type ReactNode } from 'react'
import { Input } from '../atoms/Input'
import type { InputHTMLAttributes } from 'react'

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  optional?: boolean
  /** Overlay content on the right side of the input (e.g. card brand mark). */
  endAdornment?: ReactNode
}

export function Field({ label, error, optional, endAdornment, className, ...rest }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const invalid = Boolean(error)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="font-normal text-neutral-muted"> (optional)</span>}
      </label>
      <div className="relative">
        <Input
          id={id}
          invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className={endAdornment ? `pr-12 ${className ?? ''}` : className}
          {...rest}
        />
        {endAdornment && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
            {endAdornment}
          </span>
        )}
      </div>
      {invalid && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
