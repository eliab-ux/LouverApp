# Guia de Padronização de UI - LouvorApp

## 📋 Visão Geral

Este guia documenta o sistema de design padronizado para garantir consistência visual em todo o aplicativo.

**Arquivo central:** [`src/styles/form-styles.ts`](src/styles/form-styles.ts)

---

## 🎨 Sistema de Design

### Tamanhos de Fonte Padronizados

| Elemento | Tamanho | Classe/Style | Uso |
|----------|---------|--------------|-----|
| **Label de campo** | 11px | `LABEL_CLASSES.field` | Labels de inputs/selects |
| **Label pequeno** | 10px | `LABEL_CLASSES.small` | Labels secundários |
| **Título de seção** | 14px (text-sm) | `LABEL_CLASSES.section` | Títulos de painéis |
| **Título de item** | 13px | `LABEL_CLASSES.item` | Títulos em cards/listas |
| **Descrição** | 12px (text-xs) | `LABEL_CLASSES.description` | Subtítulos/descrições |
| **Input** | 10.5px | `INPUT_STYLES.default` | Campos de texto |
| **Select** | 11px | `INPUT_STYLES.select` | Dropdowns |
| **Contador** | 10px | `TEXT_CLASSES.counter` | Paginação/contadores |

---

## 📝 Exemplos de Migração

### ANTES vs DEPOIS

#### 1. Labels de Formulário

**❌ ANTES (Inconsistente):**
```tsx
// Arquivo: src/pages/Musicas.tsx
<label className="block text-[11px] text-slate-900 mb-1" style={{ marginLeft: '5px' }}>
  Ordenação
</label>

// Arquivo: src/pages/Escala/agenda/AgendaSection.tsx
<label className="block text-[10px] text-slate-400 mb-1" htmlFor="mesExportacao">
  Mês para exportação
</label>

// Arquivo: src/pages/Admin/MembrosPanel.tsx
<IonLabel position="stacked" className="text-[11px] font-semibold" style={{ fontWeight: 700 }}>
  Nome do membro
</IonLabel>
```

**✅ DEPOIS (Padronizado):**
```tsx
import { LABEL_CLASSES } from '../styles/form-styles'

// Para label principal
<IonLabel position="stacked" className={LABEL_CLASSES.field}>
  Nome do membro
</IonLabel>

// Para label secundário/pequeno
<label className={LABEL_CLASSES.small + ' block mb-1'}>
  Mês para exportação
</label>
```

---

#### 2. Inputs e Selects

**❌ ANTES (Inconsistente):**
```tsx
// Arquivo: src/pages/Musicas.tsx
const ionSelectSmallStyle: CSSProperties & Record<string, string> = {
  fontSize: '11px',
  ['--placeholder-color']: '#94a3b8',
  ['--color']: '#94a3b8',
}

<IonInput
  value={novaMusicaNome}
  onIonInput={(e) => setNovaMusicaNome(String(e.detail.value ?? ''))}
  placeholder="Ex: Grande é o Senhor"
  style={{ fontSize: '10.5px' }}
/>

<IonSelect
  value={filtroCategoriaId}
  interface="popover"
  placeholder="Todas"
  style={ionSelectSmallStyle}
/>
```

**✅ DEPOIS (Padronizado):**
```tsx
import { INPUT_STYLES } from '../styles/form-styles'

<IonInput
  value={novaMusicaNome}
  onIonInput={(e) => setNovaMusicaNome(String(e.detail.value ?? ''))}
  placeholder="Ex: Grande é o Senhor"
  style={INPUT_STYLES.default}
/>

<IonSelect
  value={filtroCategoriaId}
  interface="popover"
  placeholder="Todas"
  style={INPUT_STYLES.selectSmall}
/>
```

---

#### 3. Botões

**❌ ANTES (Inconsistente):**
```tsx
// Arquivo: src/pages/Musicas.tsx
const iconOnlyButtonStyle: CSSProperties & Record<string, string> = {
  ['--padding-start']: '6px',
  ['--padding-end']: '6px',
  ['--color']: '#94a3b8',
}

const addButtonPaddingStyle: CSSProperties & Record<string, string> = {
  ['--padding-start']: '14px',
  ['--padding-end']: '14px',
}

<IonButton
  type="button"
  fill="clear"
  size="small"
  onClick={() => handleDelete(id)}
  style={iconOnlyButtonStyle}
>
  <IonIcon slot="icon-only" icon={trashOutline} />
</IonButton>

<IonButton
  type="submit"
  expand="block"
  size="small"
  style={addButtonPaddingStyle}
>
  Adicionar música
</IonButton>
```

**✅ DEPOIS (Padronizado):**
```tsx
import { BUTTON_STYLES, BUTTON_CLASSES } from '../styles/form-styles'

<IonButton
  type="button"
  fill="clear"
  size="small"
  onClick={() => handleDelete(id)}
  style={BUTTON_STYLES.icon}
  className={BUTTON_CLASSES.iconSmall}
>
  <IonIcon slot="icon-only" icon={trashOutline} />
</IonButton>

<IonButton
  type="submit"
  expand="block"
  size="small"
  style={BUTTON_STYLES.primary}
>
  Adicionar música
</IonButton>
```

---

#### 4. Títulos e Seções

**❌ ANTES (Inconsistente):**
```tsx
// Arquivo: src/pages/Musicas.tsx
<h2 className="text-sm font-semibold mb-3 text-slate-100">Músicas</h2>

// Arquivo: src/pages/Escala/agenda/AgendaSection.tsx
<h3 className="text-[13px] font-bold text-slate-100 truncate">
  {nomeTipoEvento(evento)}
</h3>

// Arquivo: src/pages/Admin/CategoriasPanel.tsx
<span className="flex-1 truncate text-[15px] font-medium text-slate-100">
  {cat.nome}
</span>
```

**✅ DEPOIS (Padronizado):**
```tsx
import { LABEL_CLASSES } from '../styles/form-styles'

// Título de seção/painel
<h2 className={LABEL_CLASSES.section + ' mb-3'}>Músicas</h2>

// Título de item em card
<h3 className={LABEL_CLASSES.item + ' truncate'}>
  {nomeTipoEvento(evento)}
</h3>

// Título de item em lista (usar o mesmo padrão)
<span className={LABEL_CLASSES.item + ' flex-1 truncate'}>
  {cat.nome}
</span>
```

---

#### 5. Mensagens de Erro/Sucesso

**❌ ANTES (Inconsistente):**
```tsx
// Arquivo: src/pages/Musicas.tsx
{musicaError && (
  <p className="mb-2 text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
    {musicaError}
  </p>
)}

// Arquivo: src/pages/Admin/ImportarCSVPanel.tsx
<IonText color="success">
  <p className="text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
    {success}
  </p>
</IonText>
```

**✅ DEPOIS (Padronizado):**
```tsx
import { TEXT_CLASSES } from '../styles/form-styles'

{musicaError && (
  <p className={TEXT_CLASSES.error + ' mb-2'}>
    {musicaError}
  </p>
)}

{success && (
  <p className={TEXT_CLASSES.success}>
    {success}
  </p>
)}
```

---

#### 6. Acordeões (Nova Música, etc.)

**❌ ANTES:**
```tsx
<IonItem slot="header" lines="none">
  <IonLabel>
    <h2 className="text-sm font-semibold text-gray-800">Nova música</h2>
  </IonLabel>
</IonItem>
```

**✅ DEPOIS:**
```tsx
import { ACCORDION_CLASSES } from '../styles/form-styles'

<IonItem slot="header" lines="none">
  <IonLabel>
    <h2 className={ACCORDION_CLASSES.header}>Nova música</h2>
  </IonLabel>
</IonItem>
```

---

## 🔧 Utilitários Disponíveis

### Mesclar Estilos

```tsx
import { mergeStyles, BUTTON_STYLES } from '../styles/form-styles'

const customStyle = mergeStyles(
  BUTTON_STYLES.primary,
  { ['--background']: 'red' }
)

<IonButton style={customStyle}>Botão customizado</IonButton>
```

### Mesclar Classes

```tsx
import { mergeClasses, LABEL_CLASSES } from '../styles/form-styles'

const className = mergeClasses(
  LABEL_CLASSES.field,
  'mb-2',
  isError && 'text-red-500'
)

<IonLabel className={className}>Nome</IonLabel>
```

---

## 📦 Referência Completa de Constantes

### LABEL_CLASSES
```tsx
LABEL_CLASSES.field        // Label de campo (11px, semibold)
LABEL_CLASSES.small        // Label pequeno (10px)
LABEL_CLASSES.section      // Título de seção (14px/text-sm)
LABEL_CLASSES.item         // Título de item (13px)
LABEL_CLASSES.description  // Descrição (12px/text-xs)
```

### INPUT_STYLES
```tsx
INPUT_STYLES.default       // Input padrão (10.5px)
INPUT_STYLES.select        // Select padrão (11px)
INPUT_STYLES.selectSmall   // Select de filtro (11px)
```

### BUTTON_STYLES
```tsx
BUTTON_STYLES.icon         // Botão ícone compacto
BUTTON_STYLES.primary      // Botão de ação primária
BUTTON_STYLES.compact      // Botão compacto com texto
```

### BUTTON_CLASSES
```tsx
BUTTON_CLASSES.iconSmall   // Classes para botão ícone pequeno
BUTTON_CLASSES.primary     // Classes para botão primário
```

### TEXT_CLASSES
```tsx
TEXT_CLASSES.counter       // Contador/paginação (10px)
TEXT_CLASSES.badge         // Badge/tag pequeno
TEXT_CLASSES.error         // Mensagem de erro
TEXT_CLASSES.success       // Mensagem de sucesso
TEXT_CLASSES.warning       // Mensagem de aviso
TEXT_CLASSES.hint          // Texto de ajuda/hint
```

### CARD_CLASSES
```tsx
CARD_CLASSES.default       // Card padrão
CARD_CLASSES.listItem      // Card de item em lista
CARD_CLASSES.form          // Container de formulário
CARD_CLASSES.editor        // Container de editor inline
```

### ITEM_STYLES
```tsx
ITEM_STYLES.compact        // IonItem compacto
ITEM_STYLES.default        // IonItem padrão
```

### ACCORDION_CLASSES
```tsx
ACCORDION_CLASSES.header   // Título do acordeão
ACCORDION_CLASSES.subtitle // Subtítulo do acordeão
```

---

## 🎯 Plano de Migração

### Prioridade Alta (Usuário reportou problema)
1. ✅ **src/styles/form-styles.ts** - Criado
2. ⏳ **src/pages/Musicas.tsx** - Migrar formulário "Nova música"
3. ⏳ **src/pages/Escala/agenda/AgendaSection.tsx** - Padronizar todos os campos

### Prioridade Média
4. **src/pages/Admin/MembrosPanel.tsx** - Formulários de membros
5. **src/pages/Admin/CategoriasPanel.tsx** - Formulários de categorias
6. **src/pages/Admin/MomentosPanel.tsx** - Formulários de momentos
7. **src/pages/Admin/EstilosPanel.tsx** - Formulários de estilos

### Prioridade Baixa
8. **src/pages/MeuPerfil.tsx** - Já está relativamente padronizado
9. **src/pages/Admin/ImportarCSVPanel.tsx** - Migrar mensagens
10. **src/pages/Admin/NotificacoesPanel.tsx** - Migrar mensagens

---

## ✅ Checklist de Migração por Arquivo

Ao migrar um arquivo, seguir este checklist:

- [ ] Importar constantes de `../styles/form-styles`
- [ ] Substituir `fontSize: '10.5px'` por `INPUT_STYLES.default`
- [ ] Substituir `fontSize: '11px'` por `INPUT_STYLES.select`
- [ ] Substituir `text-[11px] font-semibold` por `LABEL_CLASSES.field`
- [ ] Substituir `text-[10px]` por `LABEL_CLASSES.small`
- [ ] Substituir `text-sm font-semibold` por `LABEL_CLASSES.section`
- [ ] Substituir `text-[13px]` por `LABEL_CLASSES.item`
- [ ] Substituir padding de botões por `BUTTON_STYLES.*`
- [ ] Substituir mensagens de erro por `TEXT_CLASSES.error`
- [ ] Remover definições locais de estilos duplicados
- [ ] Testar visualmente todas as mudanças

---

## 🚀 Benefícios

1. **Consistência Visual**: Todos os componentes seguem o mesmo padrão
2. **Manutenibilidade**: Mudanças centralizadas em um único arquivo
3. **Produtividade**: Não precisa definir estilos repetidamente
4. **DX (Developer Experience)**: Autocomplete e type-safety com TypeScript
5. **Performance**: Redução de CSS inline duplicado

---

## 📞 Contato

Dúvidas sobre a padronização? Consulte este guia ou o arquivo [`src/styles/form-styles.ts`](src/styles/form-styles.ts).
