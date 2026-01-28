/**
 * Utility function to combine class names conditionally
 * Similar to clsx pattern
 *
 * @example
 * cn('base', isActive && 'active', 'text-lg')
 * // => 'base active text-lg'
 */
export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(' ')
}
