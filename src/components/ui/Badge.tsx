import React from 'react'
import { cn } from '../../utils/classNames'

export interface BadgeProps {
  variant?: 'status' | 'category'
  color?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'primary'
  className?: string
  children: React.ReactNode
}

/**
 * Badge component with 2 variants
 * - status: Rounded full badges for status indicators (Publicada, Pendente, Cancelado)
 * - category: Rounded badges for categories/tags (Adoração, Pop Rock)
 */
export function Badge({
  variant = 'category',
  color = 'neutral',
  className,
  children,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center text-xs font-medium'

  const variantStyles = {
    status: 'px-2.5 py-1 rounded-full',
    category: 'px-2 py-0.5 rounded',
  }

  const colorStyles = {
    success: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200',
    error: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-200',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200',
    info: 'bg-info-100 text-info-700 dark:bg-info-900 dark:text-info-200',
    neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200',
  }

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        colorStyles[color],
        className
      )}
    >
      {children}
    </span>
  )
}

/**
 * Pre-configured badge variants for common use cases
 */

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: 'success' | 'pending' | 'error' | 'info'
  children: React.ReactNode
  className?: string
}) {
  const statusColors = {
    success: 'success' as const,
    pending: 'warning' as const,
    error: 'error' as const,
    info: 'info' as const,
  }

  return (
    <Badge variant="status" color={statusColors[status]} className={className}>
      {children}
    </Badge>
  )
}

export function CategoryBadge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Badge variant="category" color="primary" className={className}>
      {children}
    </Badge>
  )
}
