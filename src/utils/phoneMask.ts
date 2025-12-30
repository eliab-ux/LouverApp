export function maskPhoneBR(value: string): string {
  // mantém só dígitos
  const digits = (value || '').replace(/\D/g, '').slice(0, 11) // max 11

  const ddd = digits.slice(0, 2)
  const number = digits.slice(2) // até 9 dígitos

  if (!digits.length) return ''

  if (digits.length <= 2) {
    return `(${ddd}`
  }

  // (00) 000000000
  return `(${ddd}) ${number}`
}

export function unmask(value: string): string {
  return (value || '').replace(/\D/g, '')
}
