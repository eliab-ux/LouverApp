import React, { useState } from 'react'
import { cn } from '../../utils/classNames'

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  showCharCount?: boolean
  maxCharCount?: number
}

/**
 * TextArea component with optional character counter
 * Supports error states and helper text
 */
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      showCharCount = false,
      maxCharCount,
      className,
      id,
      disabled,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const [charCount, setCharCount] = useState(
      (value?.toString().length || defaultValue?.toString().length || 0)
    )

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      onChange?.(e)
    }

    const textareaStyles = cn(
      'px-3 py-2 rounded-lg',
      'bg-neutral-50 text-sm text-neutral-900 placeholder:text-neutral-400',
      'focus:outline-none focus:bg-white',
      'resize-none',
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
          <div className="flex items-center justify-between">
            <label
              htmlFor={textareaId}
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              {label}
            </label>
            {showCharCount && maxCharCount && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {charCount}/{maxCharCount}
              </span>
            )}
          </div>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={textareaStyles}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          maxLength={maxCharCount}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-error-500 dark:text-error-400"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
            className="text-xs text-neutral-500 dark:text-neutral-400"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
