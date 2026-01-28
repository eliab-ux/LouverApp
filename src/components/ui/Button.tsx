import React from 'react'
import { cn } from '../../utils/classNames'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'icon'
  fullWidth?: boolean
  loading?: boolean
  children: React.ReactNode
}

/**
 * Button component with 5 variants
 * - primary: Main action buttons (Criar, Adicionar, Salvar)
 * - secondary: Secondary actions (Cancelar, Voltar)
 * - destructive: Destructive actions (Excluir, Remover)
 * - ghost: Subtle actions (Editar, Ver detalhes)
 * - icon: Icon-only buttons
 */
export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: cn(
      'bg-primary-500 hover:bg-primary-600 active:bg-primary-700',
      'text-white',
      'py-3 px-4',
      'focus:ring-primary-500',
      'dark:bg-primary-600 dark:hover:bg-primary-700'
    ),
    secondary: cn(
      'bg-white hover:bg-neutral-50 active:bg-neutral-100',
      'text-neutral-700 border border-neutral-300',
      'py-3 px-4',
      'focus:ring-neutral-400',
      'dark:bg-neutral-700 dark:text-neutral-100 dark:border-neutral-600',
      'dark:hover:bg-neutral-600'
    ),
    destructive: cn(
      'bg-error-500 hover:bg-error-600 active:bg-error-700',
      'text-white',
      'py-2 px-3',
      'focus:ring-error-500'
    ),
    ghost: cn(
      'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
      'py-2 px-3',
      'focus:ring-neutral-400',
      'dark:text-neutral-300 dark:hover:bg-neutral-700'
    ),
    icon: cn(
      'p-2 rounded-lg hover:bg-neutral-100 active:bg-neutral-200',
      'text-neutral-600',
      'focus:ring-neutral-400',
      'dark:text-neutral-300 dark:hover:bg-neutral-700'
    ),
  }

  const widthStyles = fullWidth ? 'w-full' : ''

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], widthStyles, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
