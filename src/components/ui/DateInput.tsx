import React from 'react'
import { cn } from '../../utils/classNames'

export interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  showIcon?: boolean
}

/**
 * DateInput component with calendar icon
 * Wrapper around native HTML date input
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      showIcon = true,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `date-input-${Math.random().toString(36).substr(2, 9)}`

    const inputStyles = cn(
      'px-3 py-2 rounded-lg',
      'bg-neutral-50 text-sm text-neutral-900',
      'focus:outline-none focus:bg-white',
      'transition-all duration-200',
      'border-0',
      'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed',
      'dark:bg-neutral-700 dark:text-neutral-100 dark:focus:bg-neutral-600',
      '[color-scheme:light] dark:[color-scheme:dark]', // Fix for date picker icon in dark mode
      showIcon && 'pr-10',
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
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type="date"
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
          {showIcon && (
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
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
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

DateInput.displayName = 'DateInput'
