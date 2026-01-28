import React from 'react'
import { cn } from '../../utils/classNames'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  children: React.ReactNode
}

/**
 * Select/Dropdown component with custom styling
 * Uses native select element with custom arrow icon
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className,
      id,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    const selectStyles = cn(
      'px-3 py-2 pr-10 rounded-lg',
      'bg-neutral-50 text-sm text-neutral-900',
      'focus:outline-none focus:bg-white',
      'appearance-none cursor-pointer',
      'transition-all duration-200',
      'border-0',
      'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed',
      'dark:bg-neutral-700 dark:text-neutral-100 dark:focus:bg-neutral-600',
      fullWidth && 'w-full',
      className
    )

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={selectStyles}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helperText
                ? `${selectId}-helper`
                : undefined
            }
            {...props}
          >
            {children}
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-neutral-400 dark:text-neutral-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
            className="text-xs text-error-500 dark:text-error-400"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="text-xs text-neutral-500 dark:text-neutral-400"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
