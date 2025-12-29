import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonInput,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react'
import {
  eyeOffOutline,
  eyeOutline,
  logInOutline,
  personAddOutline,
  refreshOutline,
} from 'ionicons/icons'
import { supabase } from '../lib/supabase'
import type { AuthMode, AuthScreenProps } from '../types'

import './Login.css'

type RegisterType = 'new_church' | 'invited' | null

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '')

  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false

  // Verifica se todos os dígitos são iguais (ex: 00000000000000)
  if (/^(\d)\1+$/.test(cnpj)) return false

  // Validação dos dígitos verificadores
  const calcDigito = (cnpj: string, tamanho: number): number => {
    let soma = 0
    let pos = tamanho - 7

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(cnpj.charAt(tamanho - i)) * pos--
      if (pos < 2) pos = 9
    }

    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const tamanho = cnpj.length - 2
  const digitos = cnpj.substring(tamanho)
  
  const digito1 = calcDigito(cnpj, tamanho)
  if (digito1 !== parseInt(digitos.charAt(0))) return false

  const digito2 = calcDigito(cnpj, tamanho + 1)
  if (digito2 !== parseInt(digitos.charAt(1))) return false

  return true
}

// Função para formatar CNPJ
function formatarCNPJ(valor: string): string {
  const numeros = valor.replace(/[^\d]/g, '').slice(0, 14)
  
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 5) return `${numeros.slice(0, 2)}.${numeros.slice(2)}`
  if (numeros.length <= 8) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`
  if (numeros.length <= 12) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`
  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12)}`
}

export function Login({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [registerType, setRegisterType] = useState<RegisterType>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [nomeIgreja, setNomeIgreja] = useState('')
  const [cnpjIgreja, setCnpjIgreja] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false
    if (mode === 'register') {
      if (!registerType) return false
      if (password !== confirmPassword) return false
      if (registerType === 'new_church') {
        if (!nomeIgreja.trim() || !cnpjIgreja.trim() || !nomeUsuario.trim()) return false
        if (!validarCNPJ(cnpjIgreja)) return false
      }
    }
    return true
  }, [
    email,
    password,
    confirmPassword,
    mode,
    registerType,
    nomeIgreja,
    cnpjIgreja,
    nomeUsuario,
  ])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      if (mode === 'register') {
        // Validações para criar nova igreja
        if (registerType === 'new_church') {
          if (!nomeIgreja.trim()) {
            setError('Por favor, informe o nome da igreja.')
            setLoading(false)
            return
          }
          if (!cnpjIgreja.trim()) {
            setError('Por favor, informe o CNPJ da igreja.')
            setLoading(false)
            return
          }
          if (!validarCNPJ(cnpjIgreja)) {
            setError('CNPJ inválido. Verifique os números informados.')
            setLoading(false)
            return
          }
          if (!nomeUsuario.trim()) {
            setError('Por favor, informe seu nome.')
            setLoading(false)
            return
          }
        }

        // Criar conta no Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome: nomeUsuario || null,
            }
          }
        })

        if (signUpError) {
          let errorMessage = signUpError.message
          
          if (errorMessage.includes('User already registered')) {
            errorMessage = 'Este e-mail já está cadastrado. Tente fazer login.'
          } else if (errorMessage.includes('Password should be at least')) {
            errorMessage = 'A senha deve ter no mínimo 6 caracteres.'
          } else if (errorMessage.includes('Invalid email')) {
            errorMessage = 'E-mail inválido.'
          }
          
          setError(errorMessage)
          return
        }

        // Se está criando nova igreja
        if (registerType === 'new_church' && signUpData.user) {
          // Criar a igreja (o trigger vai popular os templates automaticamente)
          const cnpjLimpo = cnpjIgreja.replace(/[^\d]/g, '')
          const { data: igrejaData, error: igrejaError } = await supabase
            .from('igrejas')
            .insert({ nome: nomeIgreja.trim(), cnpj: cnpjLimpo })
            .select()
            .single()

          if (igrejaError) {
            console.error('Erro ao criar igreja:', igrejaError)
            setError('Erro ao criar igreja. Tente novamente.')
            return
          }

          // Criar registro do usuário como admin da igreja
          const { error: usuarioError } = await supabase
            .from('usuarios')
            .insert({
              id: signUpData.user.id,
              email: email,
              nome: nomeUsuario.trim(),
              papel: 'admin',
              funcoes: [],
              igreja_id: igrejaData.id,
            })

          if (usuarioError) {
            console.error('Erro ao criar usuário:', usuarioError)
            // Não é crítico, o usuário pode ser criado depois
          }

          setMessage('Igreja e conta criadas! Verifique seu e-mail para confirmar o cadastro.')
        } else {
          setMessage('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          // Traduzir erros comuns para português
          let errorMessage = signInError.message
          
          if (errorMessage.includes('Invalid login credentials')) {
            errorMessage = 'E-mail ou senha incorretos. Verifique e tente novamente.'
          } else if (errorMessage.includes('Email not confirmed')) {
            errorMessage = 'E-mail não confirmado. Verifique sua caixa de entrada.'
          } else if (errorMessage.includes('Invalid email')) {
            errorMessage = 'E-mail inválido.'
          }
          
          setError(errorMessage)
          return
        }

        setMessage('Login realizado com sucesso!')
        onAuthSuccess()
      }
    } catch (e) {
      console.error(e)
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault()
    
    if (!email.trim()) {
      setError('Por favor, digite seu e-mail.')
      return
    }

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
      setEmail('')
      
      // Voltar para tela de login após 3 segundos
      setTimeout(() => {
        setShowForgotPassword(false)
        setMessage(null)
      }, 3000)
    } catch (e) {
      console.error(e)
      setError('Erro ao enviar e-mail de recuperação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Tela de recuperação de senha
  if (showForgotPassword) {
    return (
      <IonPage className="login-page">
        <IonContent fullscreen>
          <div className="min-h-full w-full px-4 py-10 flex items-center justify-center bg-slate-50">
            <div className="w-full max-w-sm">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 justify-center">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IonIcon icon={refreshOutline} className="text-primary text-lg" />
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900">Recuperar senha</h1>
                </div>

                <p className="mt-2 text-xs text-gray-500 leading-tight">
                  Digite seu e-mail para receber instruções de recuperação.
                </p>
              </div>

              <IonCard className="login-card">
                <IonCardContent>
                  <form onSubmit={handleForgotPassword} className="space-y-3">
                    <IonInput
                      value={email}
                      onIonInput={(e) => setEmail(String(e.detail.value ?? ''))}
                      type="email"
                      inputMode="email"
                      autocomplete="email"
                      fill="outline"
                      label="E-mail"
                      labelPlacement="stacked"
                      placeholder="voce@igreja.com"
                      className="login-input"
                    />

                    {error && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {error}
                      </p>
                    )}

                    {message && !error && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                        {message}
                      </p>
                    )}

                    <IonButton expand="block" disabled={loading || !email.trim()} type="submit" className="login-submit">
                      {loading ? 'Enviando...' : 'Enviar e-mail de recuperação'}
                    </IonButton>

                    <div className="flex justify-center">
                      <IonButton
                        fill="clear"
                        size="small"
                        color="medium"
                        className="login-link"
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false)
                          setError(null)
                          setMessage(null)
                        }}
                      >
                        Voltar para o login
                      </IonButton>
                    </div>
                  </form>
                </IonCardContent>
              </IonCard>
            </div>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage className="login-page">
      <IonContent fullscreen>
        <div className="min-h-full w-full px-4 py-10 flex items-center justify-center bg-slate-50">
          <div className="w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 justify-center">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-lg">♫</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">LouvorApp</h1>
              </div>

              <p className="mt-2 text-xs text-gray-500 leading-tight">
                {mode === 'login'
                  ? 'Entre para acessar seu ministério de louvor.'
                  : 'Crie sua conta para começar a usar o LouvorApp.'}
              </p>
            </div>

            <IonCard className="login-card">
              <IonCardContent>
                <IonSegment
                  value={mode}
                  onIonChange={(e) => {
                    const v = (e.detail.value as AuthMode | undefined) ?? 'login'
                    setMode(v)
                    setError(null)
                    setMessage(null)
                    setPassword('')
                    setConfirmPassword('')
                    if (v === 'login') {
                      setRegisterType(null)
                      setNomeIgreja('')
                      setCnpjIgreja('')
                      setNomeUsuario('')
                    }
                  }}
                  className="login-segment"
                >
                  <IonSegmentButton value="login">
                    <IonLabel>Entrar</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="register">
                    <IonLabel>Criar conta</IonLabel>
                  </IonSegmentButton>
                </IonSegment>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  {mode === 'register' && !registerType && (
                    <div className="space-y-2">
                      <p className="text-[0.7rem] text-gray-500 text-center leading-tight">
                        Como deseja se cadastrar?
                      </p>

                      <IonButton
                        type="button"
                        expand="block"
                        fill="outline"
                        onClick={() => setRegisterType('new_church')}
                      >
                        Criar nova igreja
                      </IonButton>

                      <IonButton
                        type="button"
                        expand="block"
                        fill="outline"
                        onClick={() => setRegisterType('invited')}
                      >
                        Fui convidado
                      </IonButton>
                    </div>
                  )}

                  {(mode === 'login' || registerType) && (
                    <>
                      {mode === 'register' && registerType === 'new_church' && (
                        <>
                          <IonInput
                            value={nomeIgreja}
                            onIonInput={(e) => setNomeIgreja(String(e.detail.value ?? ''))}
                            type="text"
                            fill="outline"
                            label="Nome da Igreja"
                            labelPlacement="stacked"
                            placeholder="Igreja Batista Central"
                            className="login-input"
                          />

                          <IonInput
                            value={cnpjIgreja}
                            onIonInput={(e) => setCnpjIgreja(formatarCNPJ(String(e.detail.value ?? '')))}
                            type="text"
                            fill="outline"
                            label="CNPJ da Igreja"
                            labelPlacement="stacked"
                            placeholder="00.000.000/0000-00"
                            className="login-input"
                          />

                          <IonInput
                            value={nomeUsuario}
                            onIonInput={(e) => setNomeUsuario(String(e.detail.value ?? ''))}
                            type="text"
                            fill="outline"
                            label="Seu Nome"
                            labelPlacement="stacked"
                            placeholder="João Silva"
                            className="login-input"
                          />
                        </>
                      )}

                      <IonInput
                        value={email}
                        onIonInput={(e) => setEmail(String(e.detail.value ?? ''))}
                        type="email"
                        inputMode="email"
                        autocomplete="email"
                        fill="outline"
                        label="E-mail"
                        labelPlacement="stacked"
                        placeholder="voce@igreja.com"
                        className="login-input"
                      />

                      <IonInput
                        value={password}
                        onIonInput={(e) => setPassword(String(e.detail.value ?? ''))}
                        type={showPassword ? 'text' : 'password'}
                        autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
                        fill="outline"
                        label="Senha"
                        labelPlacement="stacked"
                        placeholder="••••••••"
                        className="login-input"
                      >
                        <IonButton
                          slot="end"
                          fill="clear"
                          size="small"
                          className="login-eye-btn"
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label="Mostrar/ocultar senha"
                        >
                          <IonIcon slot="icon-only" icon={showPassword ? eyeOffOutline : eyeOutline} />
                        </IonButton>
                      </IonInput>

                      {mode === 'register' && registerType && (
                        <IonInput
                          value={confirmPassword}
                          onIonInput={(e) => setConfirmPassword(String(e.detail.value ?? ''))}
                          type={showPassword ? 'text' : 'password'}
                          autocomplete="new-password"
                          fill="outline"
                          label="Confirmar senha"
                          labelPlacement="stacked"
                          placeholder="Repita a senha"
                          className="login-input"
                        />
                      )}

                      {error && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                          {error}
                        </p>
                      )}

                      {message && !error && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                          {message}
                        </p>
                      )}

                      <IonButton
                        expand="block"
                        disabled={loading || !canSubmit}
                        type="submit"
                        className="login-submit"
                      >
                        <IonIcon slot="start" icon={mode === 'login' ? logInOutline : personAddOutline} />
                        {loading
                          ? 'Aguarde...'
                          : mode === 'login'
                            ? 'Entrar'
                            : registerType === 'new_church'
                              ? 'Criar Igreja e Conta'
                              : 'Criar conta'}
                      </IonButton>

                      {mode === 'login' && (
                        <div className="flex justify-center">
                          <IonButton
                            fill="clear"
                            size="small"
                            color="medium"
                            className="login-link"
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Esqueci minha senha
                          </IonButton>
                        </div>
                      )}

                      {mode === 'register' && registerType && (
                        <div className="flex justify-center">
                          <IonButton
                            fill="clear"
                            size="small"
                            color="medium"
                            className="login-link"
                            type="button"
                            onClick={() => {
                              setRegisterType(null)
                              setNomeIgreja('')
                              setCnpjIgreja('')
                              setNomeUsuario('')
                              setPassword('')
                              setConfirmPassword('')
                              setError(null)
                              setMessage(null)
                            }}
                          >
                            Voltar
                          </IonButton>
                        </div>
                      )}

                      {mode === 'register' && registerType === 'new_church' && (
                        <p className="text-[0.7rem] text-gray-500 text-center leading-tight pt-1">
                          Ao criar sua igreja, você será o administrador e poderá convidar outros membros.
                        </p>
                      )}

                      {mode === 'register' && registerType === 'invited' && (
                        <p className="text-[0.7rem] text-gray-500 text-center leading-tight pt-1">
                          Use o mesmo e-mail que recebeu o convite para ser associado à igreja.
                        </p>
                      )}
                    </>
                  )}
                </form>
              </IonCardContent>
            </IonCard>

            <div className="text-center text-[0.7rem] text-gray-400 mt-4">
              © {new Date().getFullYear()} LouvorAPP (PSI Equipamentos)
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
