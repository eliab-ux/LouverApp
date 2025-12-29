// ==========================================
// TIPOS GLOBAIS DO LOUVORAPP
// ==========================================

export type AuthMode = 'login' | 'register'

export type AppUser = {
  id: string
  email: string
  nome: string | null
  papel: 'admin' | 'lider' | 'membro'
  igrejaId: string
  igrejaNome: string | null
  funcoes?: string[] | null
}

// ==========================================
// ENTIDADES - MÚSICAS
// ==========================================

export type Categoria = {
  id: string
  nome: string
}

export type MomentoCulto = {
  id: string
  nome: string
}

export type Estilo = {
  id: string
  nome: string
}

export type Musica = {
  id: string
  nome: string
  bpm: number | null
  possui_vs: boolean | null
  links: string | null
  tons?: string[] | null
  categoria_principal?: { id: string; nome: string } | null
  momento?: { id: string; nome: string } | null
  estilo?: { id: string; nome: string } | null
}

// ==========================================
// ENTIDADES - ESCALA E AGENDA
// ==========================================

export type Evento = {
  id: string
  igreja_id: string
  tipo_evento_id: string | null
  data: string
  hora: string
  created_at: string
  tipo_evento?: { id: string; nome: string; ordem: number } | null
}

export type TipoEvento = {
  id: string
  nome: string
  ordem: number
}

export type Escala = {
  id: string
  evento_id: string
  igreja_id: string
  publicada: boolean
  observacoes: string | null
  criado_por: string
  created_at: string
  updated_at: string
}

export type Indisponibilidade = {
  id: string
  usuario_id: string
  igreja_id: string
  data: string
  data_fim: string | null
  motivo: string | null
  created_at: string
}

export type Escalado = {
  id: string
  escala_id: string
  usuario_id: string
  funcao: string
  is_ministrante: boolean
  created_at: string
  usuario?: { id: string; nome: string } | null
}

export type EscalaMusica = {
  id: string
  escala_id: string
  musica_id: string
  tom_escolhido: string | null
  ordem: number
  created_at: string
  musica?: { id: string; nome: string; tons: string[] | null } | null
}

export type Usuario = {
  id: string
  nome: string | null
  papel: 'admin' | 'lider' | 'membro'
  funcoes?: string[] | null
}

// ==========================================
// TIPOS DE COMPONENTES
// ==========================================

export type AuthScreenProps = {
  onAuthSuccess: () => void
}

export type DashboardProps = {
  user: AppUser
}
