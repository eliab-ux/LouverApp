import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { AppUser, Categoria, MomentoCulto, Estilo } from '../types'
import { CategoriasPanel } from './Admin/CategoriasPanel'
import { MomentosPanel } from './Admin/MomentosPanel'
import { EstilosPanel } from './Admin/EstilosPanel'
import { MembrosPanel } from './Admin/MembrosPanel'
import { ImportarCSVPanel } from './Admin/ImportarCSVPanel'
import { NotificacoesPanel } from './Admin/NotificacoesPanel'

interface AdminPanelProps {
  user: AppUser
  categorias: Categoria[]
  momentos: MomentoCulto[]
  estilos: Estilo[]
  initialSection?: 'categorias' | 'momentos' | 'estilos' | 'membros' | 'importar' | 'notificacoes'
  onCategoriasChange: () => void
  onMomentosChange: () => void
  onEstilosChange: () => void
}

export function AdminPanel({
  user,
  categorias,
  momentos,
  estilos,
  initialSection = 'categorias',
  onCategoriasChange,
  onMomentosChange,
  onEstilosChange,
}: AdminPanelProps) {
  const location = useLocation()
  
  const [adminSection, setAdminSection] = useState<
    'categorias' | 'momentos' | 'estilos' | 'membros' | 'importar' | 'notificacoes'
  >(initialSection)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const sectionFromQuery = params.get('section')
    
    const next =
      sectionFromQuery === 'categorias' ||
      sectionFromQuery === 'momentos' ||
      sectionFromQuery === 'estilos' ||
      sectionFromQuery === 'membros' ||
      sectionFromQuery === 'importar' ||
      sectionFromQuery === 'notificacoes'
        ? sectionFromQuery
        : initialSection

    queueMicrotask(() => {
      setAdminSection(next)
    })
  }, [location.search, initialSection])

  return (
    <main className="space-y-3">
      {adminSection === 'categorias' && (
        <CategoriasPanel user={user} categorias={categorias} onCategoriasChange={onCategoriasChange} />
      )}
      {adminSection === 'momentos' && (
        <MomentosPanel user={user} momentos={momentos} onMomentosChange={onMomentosChange} />
      )}
      {adminSection === 'estilos' && (
        <EstilosPanel user={user} estilos={estilos} onEstilosChange={onEstilosChange} />
      )}
      {adminSection === 'membros' && <MembrosPanel user={user} />}
      {adminSection === 'importar' && (
        <ImportarCSVPanel
          user={user}
          categorias={categorias}
          momentos={momentos}
          estilos={estilos}
          onCategoriasChange={onCategoriasChange}
          onMomentosChange={onMomentosChange}
          onEstilosChange={onEstilosChange}
        />
      )}
      {adminSection === 'notificacoes' && <NotificacoesPanel user={user} />}
    </main>
  )
}
