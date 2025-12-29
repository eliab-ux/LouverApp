export type InlineToastColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'light'
  | 'medium'
  | 'dark'

export type InlineToastOptions = {
  message: string
  duration?: number
  color?: InlineToastColor
}
