# 📝 Instruções para Implementar Suporte a Medley

## ✅ O que já foi feito:

1. ✅ Script SQL criado: `supabase/migrations/20260101_add_medley_support.sql`
2. ✅ Types atualizados: `src/types/index.ts`
3. ✅ Modal de seleção de medley criado: `src/pages/Escala/agenda/MedleyPickerModal.tsx`

## 🔧 O que você precisa fazer:

### 1. Executar a migração no Supabase

```bash
# No terminal do Supabase (local ou via dashboard)
supabase migration up
```

Ou execute o SQL manualmente no editor SQL do Supabase Dashboard.

### 2. Atualizar `src/pages/Escala/hooks/useAgenda.ts`

Você precisa modificar as funções que gerenciam as músicas da escala:

#### 2.1. Adicionar states para medley

Adicione após os states existentes de `novaMusicaId` e `novaMusicaTom`:

```typescript
// Novo: tipo do item (song ou medley)
const [tipoItemRepertorio, setTipoItemRepertorio] = useState<'song' | 'medley'>('song')

// Novo: IDs das músicas do medley
const [medleySongIds, setMedleySongIds] = useState<string[]>([])

// Novo: controle do modal de medley
const [medleyModalOpen, setMedleyModalOpen] = useState(false)
```

#### 2.2. Atualizar função `adicionarMusicaEscala`

**ANTES:**
```typescript
const adicionarMusicaEscala = async (eventoId: string) => {
  if (!novaMusicaId) {
    alert('Selecione uma música')
    return
  }

  const escala = escalas.find((e) => e.evento_id === eventoId)
  if (!escala) return

  const proximaOrdem = Math.max(0, ...escalaMusicas.filter((em) => em.escala_id === escala.id).map((em) => em.ordem)) + 1

  const { error } = await supabase.from('escala_musicas').insert({
    escala_id: escala.id,
    musica_id: novaMusicaId,
    tom_escolhido: novaMusicaTom || null,
    ordem: proximaOrdem,
  })

  if (error) {
    console.error(error)
    alert('Erro ao adicionar música')
    return
  }

  setNovaMusicaId('')
  setNovaMusicaTom('')
  await carregarEscalaMusicas()
}
```

**DEPOIS:**
```typescript
const adicionarMusicaEscala = async (eventoId: string) => {
  // Validações
  if (tipoItemRepertorio === 'song' && !novaMusicaId) {
    alert('Selecione uma música')
    return
  }

  if (tipoItemRepertorio === 'medley' && medleySongIds.length === 0) {
    alert('Selecione pelo menos uma música para o medley')
    return
  }

  const escala = escalas.find((e) => e.evento_id === eventoId)
  if (!escala) return

  const proximaOrdem = Math.max(0, ...escalaMusicas.filter((em) => em.escala_id === escala.id).map((em) => em.ordem)) + 1

  const { error} = await supabase.from('escala_musicas').insert({
    escala_id: escala.id,
    tipo: tipoItemRepertorio,
    musica_ids: tipoItemRepertorio === 'song' ? [novaMusicaId] : medleySongIds,
    tom_escolhido: novaMusicaTom || null,
    ordem: proximaOrdem,
  })

  if (error) {
    console.error(error)
    alert('Erro ao adicionar item ao repertório')
    return
  }

  // Limpar states
  setTipoItemRepertorio('song')
  setNovaMusicaId('')
  setNovaMusicaTom('')
  setMedleySongIds([])
  await carregarEscalaMusicas()
}
```

#### 2.3. Atualizar função `carregarEscalaMusicas`

**ANTES:**
```typescript
const carregarEscalaMusicas = async () => {
  const { data, error } = await supabase
    .from('escala_musicas')
    .select(
      `
      id,
      escala_id,
      musica_id,
      tom_escolhido,
      ordem,
      created_at,
      musica:musicas(id, nome, tons)
    `,
    )
    .order('ordem')

  if (error) {
    console.error(error)
    return
  }

  setEscalaMusicas(data || [])
}
```

**DEPOIS:**
```typescript
const carregarEscalaMusicas = async () => {
  const { data, error } = await supabase
    .from('escala_musicas')
    .select(
      `
      id,
      escala_id,
      tipo,
      musica_ids,
      tom_escolhido,
      ordem,
      created_at
    `,
    )
    .order('ordem')

  if (error) {
    console.error(error)
    return
  }

  // Carregar dados das músicas associadas
  const items = data || []
  const allMusicIds = items.flatMap((item) => item.musica_ids)
  const uniqueMusicIds = [...new Set(allMusicIds)]

  if (uniqueMusicIds.length > 0) {
    const { data: musicasData } = await supabase
      .from('musicas')
      .select('id, nome, tons')
      .in('id', uniqueMusicIds)

    const musicasMap = new Map(musicasData?.map((m) => [m.id, m]) || [])

    const itemsComMusicas = items.map((item) => ({
      ...item,
      musicas: item.musica_ids.map((id: string) => musicasMap.get(id)).filter(Boolean),
    }))

    setEscalaMusicas(itemsComMusicas as EscalaMusica[])
  } else {
    setEscalaMusicas([])
  }
}
```

#### 2.4. Exportar novos states e funções

No `return` do hook, adicione:

```typescript
return {
  // ... existing exports ...

  // Novos exports para medley
  tipoItemRepertorio,
  setTipoItemRepertorio,
  medleySongIds,
  setMedleySongIds,
  medleyModalOpen,
  setMedleyModalOpen,
}
```

### 3. Atualizar `src/pages/Escala/agenda/AgendaSection.tsx`

#### 3.1. Adicionar import do modal

No topo do arquivo:

```typescript
import { MedleyPickerModal } from './MedleyPickerModal'
import { IonSegment, IonSegmentButton } from '@ionic/react'
```

#### 3.2. Adicionar props

Nas props do componente, adicione:

```typescript
// Adicionar depois das props existentes de músicas
tipoItemRepertorio: 'song' | 'medley'
setTipoItemRepertorio: (v: 'song' | 'medley') => void
medleySongIds: string[]
setMedleySongIds: (v: string[]) => void
medleyModalOpen: boolean
setMedleyModalOpen: (v: boolean) => void
```

#### 3.3. Substituir seção de adicionar músicas

Localize o trecho que renderiza o formulário de adicionar música (por volta da linha 620-690).

**Substitua por:**

```tsx
{podeEditarMusicas && (
  <>
    {/* Modal de seleção de medley */}
    <MedleyPickerModal
      isOpen={medleyModalOpen}
      onClose={() => setMedleyModalOpen(false)}
      musicas={musicas}
      value={medleySongIds}
      onChange={setMedleySongIds}
    />

    <IonList className="bg-transparent p-0">
      <div className="space-y-3">
        {/* Seletor de tipo: Música ou Medley */}
        <div>
          <label className={`${LABEL_CLASSES.small} block mb-2`}>
            Tipo de item
          </label>
          <IonSegment
            value={tipoItemRepertorio}
            onIonChange={(e) => {
              const newType = e.detail.value as 'song' | 'medley'
              setTipoItemRepertorio(newType)
              // Limpar seleções ao trocar de tipo
              setNovaMusicaId('')
              setMedleySongIds([])
            }}
          >
            <IonSegmentButton value="song">
              <IonLabel className={LABEL_CLASSES.field}>Música</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="medley">
              <IonLabel className={LABEL_CLASSES.field}>Medley</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Formulário para MÚSICA */}
        {tipoItemRepertorio === 'song' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <IonItem lines="none" className="rounded-xl bg-slate-900/60">
              <IonSelect
                label="Música"
                labelPlacement="stacked"
                value={novaMusicaId}
                interface="popover"
                placeholder="Selecione uma música"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onIonChange={(e) => {
                  setNovaMusicaId(String(e.detail.value ?? ''))
                  setNovaMusicaTom('')
                }}
                style={INPUT_STYLES.selectSmall}
              >
                <IonSelectOption value="">Selecione uma música</IonSelectOption>
                {musicas.map((m) => (
                  <IonSelectOption key={m.id} value={m.id}>
                    {m.nome}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem lines="none" className="rounded-xl bg-slate-900/60">
              {(() => {
                const musica = musicas.find((m) => m.id === novaMusicaId)
                const tonsDisponiveis = musica?.tons ?? []

                return (
                  <IonSelect
                    label="Tom"
                    labelPlacement="stacked"
                    value={novaMusicaTom}
                    interface="popover"
                    placeholder={tonsDisponiveis.length > 0 ? 'Selecione o tom' : 'Digite o tom'}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onIonChange={(e) => setNovaMusicaTom(String(e.detail.value ?? ''))}
                    style={INPUT_STYLES.selectSmall}
                  >
                    <IonSelectOption value="">Selecione o tom</IonSelectOption>
                    {tonsDisponiveis.map((tom) => (
                      <IonSelectOption key={tom} value={tom}>
                        {tom}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                )
              })()}
            </IonItem>

            <div className="flex items-end">
              <IonButton
                type="button"
                fill="clear"
                size="small"
                onClick={() => adicionarMusicaEscala(evento.id)}
                disabled={!podeEditarMusicas || !novaMusicaId}
                aria-label="Adicionar música"
                className="m-0 h-7"
              >
                <IonIcon icon={addOutline} />
              </IonButton>
            </div>
          </div>
        )}

        {/* Formulário para MEDLEY */}
        {tipoItemRepertorio === 'medley' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className={`${LABEL_CLASSES.small} block mb-1`}>
                Músicas do medley
              </label>
              <IonButton
                expand="block"
                fill="outline"
                size="small"
                onClick={() => setMedleyModalOpen(true)}
              >
                {medleySongIds.length === 0
                  ? 'Selecionar músicas'
                  : `${medleySongIds.length} ${medleySongIds.length === 1 ? 'música' : 'músicas'} selecionadas`}
              </IonButton>
            </div>

            <IonItem lines="none" className="rounded-xl bg-slate-900/60">
              <IonSelect
                label="Tom"
                labelPlacement="stacked"
                value={novaMusicaTom}
                interface="popover"
                placeholder="Selecione o tom"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onIonChange={(e) => setNovaMusicaTom(String(e.detail.value ?? ''))}
                style={INPUT_STYLES.selectSmall}
              >
                <IonSelectOption value="">Selecione o tom</IonSelectOption>
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((tom) => (
                  <IonSelectOption key={tom} value={tom}>
                    {tom}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <div className="flex items-end">
              <IonButton
                type="button"
                fill="clear"
                size="small"
                onClick={() => adicionarMusicaEscala(evento.id)}
                disabled={!podeEditarMusicas || medleySongIds.length === 0}
                aria-label="Adicionar medley"
                className="m-0 h-7"
              >
                <IonIcon icon={addOutline} />
              </IonButton>
            </div>
          </div>
        )}
      </div>
    </IonList>
  </>
)}
```

#### 3.4. Atualizar renderização da lista de músicas

Localize onde as músicas são exibidas (por volta da linha 424-449).

**Substitua por:**

```tsx
{musicasDoEvento.length > 0 ? (
  <ul className={`${LABEL_CLASSES.field} pl-4 list-disc space-y-0.5 text-slate-200`}>
    {musicasDoEvento.map((em) => {
      // Renderizar nome conforme tipo
      let nomeDisplay = ''
      if (em.tipo === 'medley' && em.musicas && em.musicas.length > 0) {
        nomeDisplay = em.musicas.map((m) => m.nome).join(' / ')
      } else if (em.musicas && em.musicas.length > 0) {
        nomeDisplay = em.musicas[0].nome
      } else {
        nomeDisplay = 'Item'
      }

      return (
        <li key={em.id} className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            {nomeDisplay}
            {em.tom_escolhido ? ` | Tom: ${em.tom_escolhido}` : ''}
            {em.tipo === 'medley' && (
              <span className={`ml-2 ${TEXT_CLASSES.badge} bg-purple-500/20 text-purple-300`}>
                MEDLEY
              </span>
            )}
          </span>
          {podeEditarMusicas && (
            <IonButton
              type="button"
              fill="clear"
              size="small"
              color="danger"
              onClick={() => removerMusicaEscala(em.id)}
              aria-label="Remover música"
              className="m-0 h-7"
            >
              <IonIcon slot="icon-only" icon={trashOutline} />
            </IonButton>
          )}
        </li>
      )
    })}
  </ul>
) : (
  <p className={`${LABEL_CLASSES.field} text-slate-400`}>Nenhuma música adicionada para este evento.</p>
)}
```

### 4. Atualizar Dashboard (Minhas Escalas)

No arquivo `src/pages/Dashboard.tsx`, localize onde as músicas são renderizadas e atualize:

```tsx
// Linha ~272
{item.musicas.map((em, idx) => {
  let nomeDisplay = ''
  if (em.tipo === 'medley' && em.musicas && em.musicas.length > 0) {
    nomeDisplay = em.musicas.map((m) => m.nome).join(' / ')
  } else if (em.musicas && em.musicas.length > 0) {
    nomeDisplay = em.musicas[0].nome
  }

  return (
    <div key={em.id} className="flex items-start justify-between gap-2 text-[0.65rem]">
      <div className="min-w-0 flex-1">
        <span className="text-gray-500 mr-1">{idx + 1}.</span>
        <span className="truncate">{nomeDisplay}</span>
        {em.tom_escolhido && (
          <span className="text-[0.65rem] text-gray-500"> ({em.tom_escolhido})</span>
        )}
        {em.tipo === 'medley' && (
          <span className="ml-1 text-[0.6rem] text-purple-400">MEDLEY</span>
        )}
      </div>
      {/* ... rest of code */}
    </div>
  )
})}
```

## 🚀 Pronto!

Após implementar todas essas mudanças:

1. Execute a migração SQL
2. Teste criando um evento
3. Tente adicionar uma música simples
4. Tente adicionar um medley
5. Verifique se a visualização está correta

## 📸 Resultado Esperado

- Botão de tipo: "Música | Medley"
- Para música: select de música + tom (como antes)
- Para medley: botão "Selecionar músicas" que abre modal com busca, checkbox e reordenação
- Lista exibe: "Música 1 / Música 2 / Música 3 | Tom: D" com badge "MEDLEY"
