import { useEffect, useState } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import { IonApp } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { supabase } from './lib/supabase'
import { InlineToastProvider } from './lib/inlineToast'
import type { AppUser } from './types'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'
import { AcceptInvite } from './pages/AcceptInvite'
import { Dashboard } from './pages/Dashboard'

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-sans">
      <div className="mx-auto w-full max-w-[980px] px-4 sm:px-6 lg:px-8 py-4">{children}</div>
    </div>
  )
}

function App() {
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const carregarSessao = async () => {
    setLoadingSession(true)
    setSessionError(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      // "Auth session missing" não é erro - é apenas usuário deslogado
      if (userError && userError.message !== 'Auth session missing!') {
        setSessionError(userError.message)
        setAppUser(null)
        return
      }

      if (!user) {
        setAppUser(null)
        return
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, nome, email, papel, igreja_id')
        .eq('id', user.id)
        .maybeSingle()

      if (usuarioError) {
        setSessionError(usuarioError.message)
        setAppUser(null)
        return
      }

      if (!usuario) {
        setSessionError(
          'Usuário autenticado, mas não encontrado na tabela "usuarios". Verifique a configuração.',
        )
        setAppUser(null)
        return
      }

      const { data: igreja, error: igrejaError } = await supabase
        .from('igrejas')
        .select('id, nome')
        .eq('id', usuario.igreja_id)
        .maybeSingle()

      if (igrejaError) {
        setSessionError(igrejaError.message)
        setAppUser(null)
        return
      }

      setAppUser({
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        papel: usuario.papel,
        igrejaId: usuario.igreja_id,
        igrejaNome: igreja?.nome ?? null,
      })
    } catch (e) {
      console.error(e)
      setSessionError('Erro ao carregar sessão. Tente novamente.')
      setAppUser(null)
    } finally {
      setLoadingSession(false)
    }
  }

  // Verificar tipo de link (reset, invite, signup) ANTES de carregar sessão
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const linkType = hashParams.get('type')
  const hasAccessToken = !!hashParams.get('access_token')
  
  const isResetPassword = linkType === 'recovery' && hasAccessToken
  const isInvite = (linkType === 'invite' || linkType === 'signup' || linkType === 'magiclink') && hasAccessToken

  useEffect(() => {
    // Não carregar sessão se estiver em página especial
    if (!isResetPassword && !isInvite) {
      void carregarSessao()
    }
  }, [isResetPassword, isInvite])

  // Se for página de reset, mostrar diretamente sem carregar sessão
  if (isResetPassword) {
    return <ResetPassword />
  }

  // Se for convite, mostrar tela de ativação
  if (isInvite) {
    return <AcceptInvite onSuccess={() => void carregarSessao()} />
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        Carregando...
      </div>
    )
  }

  if (sessionError) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-2rem)] flex items-center justify-center bg-slate-900 px-4 rounded-2xl">
          <div className="max-w-md bg-slate-800/80 border border-red-500/40 rounded-xl p-6 text-sm text-red-200">
            <p className="font-semibold mb-2">Erro de sessão</p>
            <p className="mb-4">{sessionError}</p>
            <button
              onClick={() => void carregarSessao()}
              className="rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-emerald-400"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!appUser) {
    return <Login onAuthSuccess={() => void carregarSessao()} />
  }

  return (
    <IonApp>
      <InlineToastProvider>
        <IonReactRouter>
          <AppShell>
            <Switch>
              <Route path="/app" render={() => <Dashboard user={appUser} />} />
              <Redirect exact from="/" to="/app/inicio" />
            </Switch>
          </AppShell>
        </IonReactRouter>
      </InlineToastProvider>
    </IonApp>
  )
}

export default App