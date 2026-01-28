import React from 'react'
import { cn } from '../../utils/classNames'

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'edit' | 'delete' | 'favorite'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

/**
 * IconButton component for icon-only actions
 * Pre-configured variants: default, edit, delete, favorite
 * Sizes: sm (16px icon), md (20px icon - default), lg (24px icon)
 */
export function IconButton({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: IconButtonProps) {
  const baseStyles = cn(
    'inline-flex items-center justify-center rounded-lg',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  )

  const sizeStyles = {
    sm: 'p-1.5', // 6px padding - for 16px icons (w-4 h-4)
    md: 'p-2',   // 8px padding - for 20px icons (w-5 h-5)
    lg: 'p-2.5', // 10px padding - for 24px icons (w-6 h-6)
  }

  const variantStyles = {
    default: cn(
      'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
      'focus:ring-neutral-400',
      'dark:text-neutral-300 dark:hover:bg-neutral-700'
    ),
    edit: cn(
      'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
      'focus:ring-neutral-400',
      'dark:text-neutral-300 dark:hover:bg-neutral-700'
    ),
    delete: cn(
      'text-error-500 hover:bg-error-100 active:bg-error-200',
      'focus:ring-error-500',
      'dark:text-error-400 dark:hover:bg-error-900'
    ),
    favorite: cn(
      'text-warning-500 hover:bg-warning-100 active:bg-warning-200',
      'focus:ring-warning-500',
      'dark:text-warning-400 dark:hover:bg-warning-900'
    ),
  }

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Pre-configured icon button variants for common use cases
 */

export function EditIconButton({
  onClick,
  className,
  ...props
}: Omit<IconButtonProps, 'variant' | 'children'>) {
  return (
    <IconButton variant="edit" onClick={onClick} className={className} {...props}>
      <svg
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
      <span className="sr-only">Editar</span>
    </IconButton>
  )
}

export function DeleteIconButton({
  onClick,
  className,
  ...props
}: Omit<IconButtonProps, 'variant' | 'children'>) {
  return (
    <IconButton variant="delete" onClick={onClick} className={className} {...props}>
      <svg
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span className="sr-only">Excluir</span>
    </IconButton>
  )
}

export function FavoriteIconButton({
  onClick,
  filled = false,
  className,
  ...props
}: Omit<IconButtonProps, 'variant' | 'children'> & { filled?: boolean }) {
  return (
    <IconButton variant="favorite" onClick={onClick} className={className} {...props}>
      {filled ? (
        <svg
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )}
      <span className="sr-only">{filled ? 'Desfavoritar' : 'Favoritar'}</span>
    </IconButton>
  )
}
