import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isValidToken, setIsValidToken] = useState(false)

  useEffect(() => {
    // Verificar se há um token de reset na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (accessToken && type === 'recovery') {
      setIsValidToken(true)
    } else {
      setError('Link inválido ou expirado. Solicite um novo e-mail de recuperação.')
    }
  }, [])

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    // Validações
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        // Traduzir erros comuns para português
        let errorMessage = updateError.message
        
        if (errorMessage.includes('New password should be different from the old password')) {
          errorMessage = 'A nova senha deve ser diferente da senha anterior.'
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter no mínimo 6 caracteres.'
        }
        
        setError(errorMessage)
        return
      }

      setMessage('Senha alterada com sucesso! Redirecionando...')
      setNewPassword('')
      setConfirmPassword('')

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (e) {
      console.error(e)
      setError('Erro ao alterar senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isValidToken && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg text-center">
          <p className="text-slate-400">Verificando link...</p>
        </div>
      </div>
    )
  }

  if (error && !isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-red-400 text-center mb-4">
            Link Inválido
          </h1>
          <p className="text-sm text-slate-300 text-center mb-6">
            {error}
          </p>
          <a
            href="/"
            className="block w-full text-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
          >
            Voltar para o login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-emerald-400 text-center mb-2">
          Redefinir Senha
        </h1>
        <p className="text-sm text-slate-300 text-center mb-6">
          Digite sua nova senha abaixo.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200" htmlFor="newPassword">
              Nova Senha
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200" htmlFor="confirmPassword">
              Confirmar Nova Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Digite a senha novamente"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {message && !error && (
            <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 rounded-md px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Alterando senha...' : 'Redefinir Senha'}
          </button>
        </form>

        <a
          href="/"
          className="mt-4 block text-center text-sm text-slate-400 hover:text-slate-200 underline"
        >
          Voltar para o login
        </a>
      </div>
    </div>
  )
}
