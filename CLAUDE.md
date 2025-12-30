# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LouvorApp** is a church worship management application built with React, TypeScript, Vite, and Supabase. It manages songs, worship schedules, team availability, and member roles for church worship teams.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript + Vite 7
- **UI Framework:** Ionic React 8 (mobile-first design)
- **Styling:** TailwindCSS 4 with dark mode support
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions + RLS)
- **Routing:** React Router 5 + Ionic Router
- **PWA:** vite-plugin-pwa for offline support

## Common Commands

```bash
# Development
npm run dev              # Start dev server (Vite)
npm run typecheck        # Type check without emitting files
npm run lint             # Run ESLint

# Build & Deploy
npm run build            # Type check + production build
npm run preview          # Preview production build locally

# Docker
docker compose up --build  # Build and run with Docker (needs .env file)
```

## Architecture

### Database Architecture (Supabase)

The application uses a **multi-tenant architecture** where data is scoped by `igreja_id` (church ID). Row-Level Security (RLS) policies enforce data isolation between churches.

**Core Entities:**
- **igrejas** - Churches (each tenant)
- **usuarios** - Users with roles: `admin`, `lider`, `membro`
- **musicas** - Songs with metadata (BPM, keys, links)
- **categorias, momentos_culto, estilos** - Song classification
- **eventos** - Events (worship services, rehearsals)
- **escalas** - Worship schedules linked to events
- **escalados** - Team members assigned to schedules
- **indisponibilidades** - Member unavailability dates
- **escala_musicas** - Songs assigned to schedules with chosen keys

**Templates System:**
When a new church is created, default categories, moments, and styles are copied from `template_*` tables to the church's data.

**RLS Security Model:**
- Users can only see data from their own church (`igreja_id` check)
- Only `admin` role can delete entities
- Only `admin` and `lider` roles can create/update most entities
- Schedules (`escalas`) lock member availability once published (`publicada = true`)

### Frontend Architecture

**Modular Structure:** The codebase was refactored from a monolithic 2600-line file to a modular structure:

```
src/
├── App.tsx                 # Auth wrapper + routing (~200 lines)
├── main.tsx                # Entry point + Ionic setup
├── lib/
│   ├── supabase.ts         # Supabase client singleton
│   ├── inlineToast.tsx     # Toast notification system
│   └── inlineToastContext.ts
├── types/
│   └── index.ts            # Global TypeScript types
├── theme/
│   └── theme.ts            # Theme switching (light/dark/system)
├── pages/
│   ├── Login.tsx           # Auth screen (login/register/reset)
│   ├── Dashboard.tsx       # Main shell with tabs + side menu
│   ├── Musicas.tsx         # Songs CRUD + filters + pagination
│   ├── Escala.tsx          # Schedule management hub
│   ├── AdminPanel.tsx      # Admin entities management
│   ├── MeuPerfil.tsx       # User profile settings
│   ├── DadosIgreja.tsx     # Church data settings
│   └── Admin/              # Admin sub-panels
│       ├── CategoriasPanel.tsx
│       ├── MomentosPanel.tsx
│       ├── EstilosPanel.tsx
│       ├── MembrosPanel.tsx
│       ├── ImportarCSVPanel.tsx
│       └── NotificacoesPanel.tsx
├── components/
│   └── ThemeSelectRow.tsx  # Theme selector component
└── utils/
    └── phoneMask.ts        # Phone number formatting
```

**Navigation Pattern:**
- Uses Ionic's `IonTabs` + `IonRouterOutlet` for tab navigation
- Side menu (`IonMenu`) for profile, church settings, logout
- Protected routes require authentication
- Routes: `/login`, `/dashboard/visao-geral`, `/dashboard/musicas`, `/dashboard/escala`, `/dashboard/admin`

**State Management:**
- Component-local state with `useState`
- Supabase queries load data on mount (`useEffect`)
- No global state library (Redux, Zustand, etc.)

**Data Fetching Pattern:**
```typescript
// Example: Load songs with joins
const { data, error } = await supabase
  .from('musicas')
  .select(`
    id, nome, bpm, tons, possui_vs, links,
    categoria_principal:categorias(id, nome),
    momento:momentos_culto(id, nome),
    estilo:estilos(id, nome)
  `)
  .eq('igreja_id', user.igrejaId)
  .order('nome')
```

**Role-Based UI:**
- Check `user.papel` to show/hide admin/leader-only features
- Example: Only admins see delete buttons, only admins/leaders can create entities

### Key Features

**1. Songs Management (Músicas)**
- CRUD with filters: category, moment, style, key, text search
- Pagination (5 songs per page)
- CSV import with auto-creation of missing categories/moments/styles
- Encoding detection (UTF-8 / Windows-1252)

**2. Schedule Management (Escala)**
- Events with date, time, and type
- Team member assignment with roles (`funcoes`)
- Song selection with chosen key (`tom_escolhido`)
- Member unavailability tracking (`indisponibilidades`)
- **Locking mechanism:** Once schedule is published (`publicada = true`), members cannot edit their availability

**3. Admin Panel**
- Manage categories, moments, styles (inline editing)
- Manage church members (invite via Edge Function)
- CSV import for bulk song uploads
- Notification settings

**4. Theme System**
- Light / Dark / System (auto)
- Persisted in localStorage
- Applied via CSS class on `<html>` element

## Important Patterns

### Supabase Edge Functions

**Invite User Function** (`supabase/functions/invite_user_admin/index.ts`):
- Creates a user account and sends an invite email
- Called from MembrosPanel to invite new members
- Requires admin privileges

**Notification Functions:**
- `notify_escala_publicada` - Notifies team when schedule is published
- `remind_musicas_ministrantes` - Reminds worship leaders to pick songs

### TypeScript Types

All types are centralized in `src/types/index.ts`. Always import from there:
```typescript
import type { AppUser, Musica, Evento, Escala } from '../types'
```

### Authentication Flow

1. User logs in → `supabase.auth.signInWithPassword()`
2. App loads user from `usuarios` table + church from `igrejas`
3. `AppUser` object is created with merged data
4. `appUser` state is passed to Dashboard
5. On logout → `supabase.auth.signOut()` + clear state

**Session Loading:**
- `App.tsx` handles session loading on mount
- Shows loading spinner while checking session
- Redirects to `/login` if not authenticated

### CSV Import Format

**Header (exact order):** `nome;bpm;tons;possui_vs;categoria;momento;estilo;link`

**Example row:**
```
Teu Amor Me Alcançou;140;G,A,Bb;true;Adoração;Adoração;Pop Rock;https://...
```

**Process:**
1. Parse CSV with encoding detection
2. Auto-create missing categories/moments/styles
3. Link songs via name matching (case-insensitive)
4. Insert songs in batch

## Database Migrations

**Location:** `supabase/migrations/`

**Key Migrations:**
- `20241212_templates_igreja.sql` - Template tables for new churches
- `20251219_ministrantes_e_permissoes.sql` - Worship leader permissions
- `20251220_update_usuarios_policy.sql` - User RLS policies
- `20251222_tipos_evento.sql` - Event types table

**Running migrations locally:**
```bash
supabase migration up  # Apply pending migrations
supabase db reset      # Reset local DB + apply all migrations
```

## Environment Variables

Required in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Docker builds, pass as build args (see README.md).

## Code Style & Conventions

- **File naming:** PascalCase for components (`Musicas.tsx`), camelCase for utils (`phoneMask.ts`)
- **Component props:** Define types inline or in `types/index.ts`
- **Async functions:** Prefix with `carregar*` (load), `criar*` (create), `editar*` (edit), `excluir*` (delete)
- **Portuguese:** Business logic names are in Portuguese (e.g., `musicas`, `igrejaId`, `escalas`)
- **Tailwind:** Mobile-first responsive classes, dark mode with `dark:` prefix
- **Ionic components:** Use `Ion*` components for consistent mobile UX

## Known Issues & Future Work

**From PLANO_DESENVOLVIMENTO_LOUVORAPP.md:**
- Church registration flow not fully implemented (users currently added manually)
- Export to PDF for schedules (planned)
- Advanced statistics dashboard (planned)
- Automatic schedule repetition (planned)

**From REFACTORING_PLAN.md:**
- Component extraction (future): `MusicaCard`, `EventoCard`, `MusicaForm`
- Custom hooks (future): `useMusicas`, `useEventos`, `useIndisponibilidades`

## Testing

No automated tests currently implemented. Manual testing workflow:
1. Login/logout flow
2. CRUD operations for songs, categories, moments, styles
3. Schedule creation and publishing
4. CSV import with sample file
5. Role-based permissions (test as admin, leader, member)

## Deployment

**Production build:**
```bash
npm ci
npm run build
# Output in dist/
```

**Docker deployment:**
```bash
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  -t louvorapp:latest .
docker run --rm -p 8080:80 louvorapp:latest
```

**Recommended platforms:** Vercel, Netlify (for static hosting), or self-hosted with Docker + nginx.

## Critical Implementation Notes

1. **Always check user role before showing admin/leader features:**
   ```typescript
   {user.papel === 'admin' && <DeleteButton />}
   ```

2. **Always scope queries by `igreja_id`:**
   ```typescript
   .eq('igreja_id', user.igrejaId)
   ```

3. **Handle Supabase errors gracefully:**
   ```typescript
   if (error) {
     console.error(error)
     alert('Erro ao carregar dados')
     return
   }
   ```

4. **Lock checks for schedules:**
   ```typescript
   // Check if schedule is published before allowing edits
   if (escala.publicada && user.papel === 'membro') {
     alert('Escala já publicada, não é possível editar')
     return
   }
   ```

5. **Use `maybeSingle()` instead of `single()` when record might not exist:**
   ```typescript
   .maybeSingle() // Returns null if not found, no error
   ```
