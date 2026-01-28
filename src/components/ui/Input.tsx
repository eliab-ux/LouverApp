import React from 'react'
import { cn } from '../../utils/classNames'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

/**
 * Input component with label, error state, and helper text
 * Supports all standard input types: text, email, tel, number, password, etc.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    const inputStyles = cn(
      'px-3 py-2 rounded-lg',
      'bg-neutral-50 text-sm text-neutral-900 placeholder:text-neutral-400',
      'focus:outline-none focus:bg-white',
      'transition-all duration-200',
      'border-0',
      'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed',
      'dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:bg-neutral-600',
      fullWidth && 'w-full',
      className
    )

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={inputStyles}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-error-500 dark:text-error-400"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-neutral-500 dark:text-neutral-400"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
