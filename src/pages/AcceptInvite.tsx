import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface AcceptInviteProps {
  onSuccess: () => void
}

export function AcceptInvite({ onSuccess }: AcceptInviteProps) {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: senha,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      
      // Aguarda um pouco e redireciona
      setTimeout(() => {
        // Limpa o hash da URL
        window.location.hash = ''
        onSuccess()
      }, 2000)
    } catch (e) {
      console.error(e)
      setError('Erro ao definir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-lg font-bold text-slate-100 mb-2">Conta ativada!</h1>
          <p className="text-sm text-slate-300">
            Sua conta foi ativada com sucesso. Redirecionando...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700 rounded-xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-100">Bem-vindo ao LouvorApp!</h1>
          <p className="text-sm text-slate-400 mt-1">
            Defina sua senha para ativar sua conta.
          </p>
        </div>

        {error && (
          <p className="mb-4 text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="senha">
              Nova senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="confirmarSenha">
              Confirmar senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Digite a senha novamente"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Ativando conta...' : 'Ativar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
