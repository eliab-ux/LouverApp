import React from 'react'
import { cn } from '../../utils/classNames'

export interface CardProps {
  variant?: 'event' | 'song' | 'simple'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

/**
 * Card component with 3 variants
 * - event: For event/schedule listings (neutral background)
 * - song: For music listings (white background with badges)
 * - simple: For simple list items (white background, minimal)
 */
export function Card({ variant = 'simple', className, children, onClick }: CardProps) {
  const baseStyles = cn(
    'rounded-xl border transition-shadow duration-200',
    onClick && 'cursor-pointer'
  )

  const variantStyles = {
    event: cn(
      'bg-neutral-50 border-neutral-200 p-4 space-y-3',
      'hover:shadow-md',
      'dark:bg-neutral-800 dark:border-neutral-700'
    ),
    song: cn(
      'bg-white border-neutral-200 p-4 space-y-2',
      'hover:shadow-md',
      'dark:bg-neutral-800 dark:border-neutral-700'
    ),
    simple: cn(
      'bg-white border-neutral-200 p-3',
      'hover:bg-neutral-50',
      'dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-750'
    ),
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}

// Sub-components for better composition

export interface CardTitleProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

Card.Title = function CardTitle({ children, className, size = 'md' }: CardTitleProps) {
  const sizeStyles = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-semibold',
    lg: 'text-xl font-semibold',
  }

  return (
    <h3
      className={cn(
        sizeStyles[size],
        'text-neutral-900 dark:text-neutral-100',
        className
      )}
    >
      {children}
    </h3>
  )
}

export interface CardDescriptionProps {
  children: React.ReactNode
  className?: string
}

Card.Description = function CardDescription({
  children,
  className,
}: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}>
      {children}
    </p>
  )
}

export interface CardActionsProps {
  children: React.ReactNode
  className?: string
}

Card.Actions = function CardActions({ children, className }: CardActionsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {children}
    </div>
  )
}

export interface CardBadgesProps {
  children: React.ReactNode
  className?: string
}

Card.Badges = function CardBadges({ children, className }: CardBadgesProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  )
}

export interface CardMetaProps {
  children: React.ReactNode
  className?: string
}

Card.Meta = function CardMeta({ children, className }: CardMetaProps) {
  return (
    <div className={cn('flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400', className)}>
      {children}
    </div>
  )
}
