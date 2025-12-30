export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'louvorapp:theme'

export function getSavedTheme(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  return saved ?? 'system'
}

export function saveTheme(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEY, mode)
}

export function getSystemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
}

export function applyTheme(mode: ThemeMode) {
  const shouldUseDark = mode === 'dark' || (mode === 'system' && getSystemPrefersDark())

  document.documentElement.classList.toggle('dark', shouldUseDark)
  document.body.classList.toggle('dark', shouldUseDark)
}
