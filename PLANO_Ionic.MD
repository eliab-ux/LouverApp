# 📘 Plano de Implementação — Padrões de UI Ionic React (LouvorApp)

## Baseado em: Documento de Padrões de UI — Moriá Collective (Ionic Angular)

---

## 1) Objetivo do padrão

- **Mobile-first**: telas compactas, fáceis de ler e consistentes
- **Reduzir "peso visual"**: evitar bordas grossas, botões chamativos, fontes grandes
- **Cores discretas**: usar `primary` para acentos e ícones, `medium`/`gray` para texto
- **Minimizar alturas**: principalmente filtros e cards, para favorecer rolagem

---

## 2) Padrões globais (vale para todas as telas)

### 2.1 Tipografia e espaçamento (Tailwind)

| Elemento | Classes Tailwind |
|----------|------------------|
| **Títulos de seção** | `text-sm font-semibold text-gray-800` |
| **Subtítulos/descrições** | `text-xs text-gray-500 leading-tight` |
| **Texto auxiliar/metadata** | `text-[0.7rem] text-gray-500 leading-tight` |
| **Padding padrão (blocos/cards compactos)** | `p-3` |
| **Card ainda mais compacto** | `px-3 py-2` |
| **Distância entre cards** | `space-y-2` ou `space-y-3` |

### 2.2 Componentes e estilos padronizados

#### Cards
- **Componente**: `<IonCard>`
- **Regra**: card "limpo", sem borda forte. Pode ter sombra leve.
- **Classes sugeridas**: `className="p-3 shadow-sm"` ou `className="px-3 py-2 shadow-sm"`
- **Evitar**: `border` visível (a não ser em casos especiais). Preferir o card "flat" com sombra leve.

#### Botões de ação (editar/excluir, etc.)
- **Componente**: `<IonButton>`
- **Padrão**: `icon-only`, `fill="clear"`, `size="small"`, cor discreta.
- **Ícones**: `<IonIcon slot="icon-only" icon={...} />`
- **Exemplos**:
  - Editar: `createOutline`
  - Excluir: `trashOutline`
- **Cores recomendadas**:
  - Editar: `color="medium"`
  - Excluir: `color="medium"` (e só fica `danger` quando precisar de destaque/confirm)

#### Chips (informações curtas)
- **Componente**: `<IonChip>`
- **Padrão**: `outline`, cor `primary`, bem pequeno
- **Classes sugeridas**: `className="h-6 text-xs px-2"`
- **Ícones**:
  - Tom: `musicalNotesOutline`
  - BPM: `speedometerOutline`
  - Link: `linkOutline`

#### Inputs / Selects compactos
- **Input**: `<IonInput>`
- **Select**: `<IonSelect interface="popover">`
- **Regra**: labels discretos, altura reduzida, texto pequeno.
- **Labels sempre visíveis**: usar `<IonLabel>` ou `<label>` acima do campo (não deixar "sem nome").

### 2.3 Header / Nome da igreja
- **Regra geral**: não repetir aquele bloco superior com nome da igreja em todas as telas.
- **Somente na Home**, e mesmo assim bem discreto.
- **Nas outras telas**: título simples da página.

---

## 3) Tela: Home (Início)

### Estrutura principal
- **Componente base**: `<IonContent>`
- **Seções em Accordion**:
  - **Mais Tocadas**: fechado por padrão
  - **Minhas Escalas**: aberto por padrão

### 3.1 Accordion (obrigatório)

**Componentes**:
```tsx
<IonAccordionGroup value={['minhas-escalas']} multiple={true}>
  <IonAccordion value="mais-tocadas">
    <IonItem slot="header">
      <IonIcon slot="start" icon={...} />
      <IonLabel>Mais Tocadas</IonLabel>
    </IonItem>
    <div slot="content" className="p-3">
      {/* conteúdo */}
    </div>
  </IonAccordion>
  
  <IonAccordion value="minhas-escalas">
    <IonItem slot="header">
      <IonIcon slot="start" icon={...} />
      <IonLabel>Minhas Escalas</IonLabel>
    </IonItem>
    <div slot="content" className="p-3">
      {/* conteúdo */}
    </div>
  </IonAccordion>
</IonAccordionGroup>
```

**Regras de comportamento**:
- **Minhas escalas** já inicia aberto.
- **Mais tocadas** inicia fechado.
- Não mencionar/mostrar "limite" de mais tocadas (já é no código).

### 3.2 Seção "Mais Tocadas"

**Conteúdo**: um único `<IonCard>` contendo a lista.

**Componentes sugeridos**:
- `<IonCard>`
- Lista interna: `<IonList lines="none">` + `<IonItem>` (compacto) ou `<ul>` com Tailwind

**Padrão visual**:
- Nome da música: `text-sm font-semibold`
- Linha auxiliar (artista/extra): `text-[0.7rem] text-gray-500`
- Contagem "1x": `text-[0.7rem] text-gray-400` alinhada à direita

### 3.3 Seção "Minhas Escalas"

**Conteúdo**: um `<IonCard>` por evento.

**Componentes**:
- `<IonCard>`
- Header do evento: `<div>` com textos compactos
- Repertório: `<IonList lines="none">` + `<IonItem>` ou `<ul>`

**Regras visuais (card de escala)**:
- **Linha 1 (metadata)**: Culto • data • hora → `text-[0.7rem] text-gray-500`
- **Linha 2 (instrumento)**: Escalado em: Teclado → `text-xs font-semibold text-primary`
- **Equipe**: `text-[0.7rem] text-gray-500`
- **Repertório**: lista compacta, sem bordas
  - Nome: `text-xs`
  - Tom (D): `text-[0.7rem] text-gray-500`
  - Ícone de link (se tiver): `<IonIcon icon={linkOutline} />` pequeno

---

## 4) Tela: Músicas

### Estrutura principal

**Blocos**:
1. **Filtro de Músicas** (sempre visível)
2. **Lista de Músicas** (cards)
3. **Nova Música** (apenas este em Accordion)

### 4.1 Filtro de Músicas (2 colunas por linha)

**Regra obrigatória**: campos em colunas, 2 por linha, para reduzir altura.

**Componentes**:
- `<IonCard>` (container do filtro)
- `<IonSearchbar>` (busca)
- `<IonGrid>` + `<IonRow>` + `<IonCol size="6">` OU grid via Tailwind (`grid grid-cols-2`)
- `<IonSelect interface="popover">`
- Ordenação por ícone: `<IonButton fill="clear" size="small">` + `<IonIcon slot="icon-only">`

**Layout recomendado**:
```
Linha 1: Ordenar (icon-only) | Categoria (ion-select)
Linha 2: Momento (ion-select) | Estilo (ion-select)
```

**Paginação compacta**:
- `<IonButton size="small" fill="outline">` com `chevronBackOutline`
- `<IonButton size="small" fill="outline">` com `chevronForwardOutline`
- Texto do meio: `text-[0.7rem] text-gray-500`

**Regra**: Labels dos filtros devem aparecer sempre (não pode ficar "sem nome"):
- usar `<label className="text-[0.7rem] text-gray-500">Categoria</label>` acima do select
- ou `<IonLabel position="stacked">Categoria</IonLabel>` (se optar por `IonItem`)

### 4.2 Lista de Músicas (1 card por música)

**Componente**: `<IonCard>` por item

**Estrutura recomendada dentro do card**:
- **Título (nome da música)**: `text-sm font-semibold`
- **Artista (abaixo)**: `text-[0.7rem] text-gray-500 -mt-1`
- **Tags/descrição**: `text-[0.65rem] text-gray-500 leading-tight`

**Chips (Tons / BPM / Link)**:
- **Componente**: `<IonChip outline color="primary">`
- **Tamanho**: `className="h-6 text-xs px-2"`
- **Ícones**:
  - Tons: `musicalNotesOutline`
  - BPM: `speedometerOutline`
  - Link: `linkOutline`

**Botões Editar / Excluir**:
```tsx
<IonButton fill="clear" size="small" color="medium">
  <IonIcon slot="icon-only" icon={createOutline} />
</IonButton>
<IonButton fill="clear" size="small" color="medium">
  <IonIcon slot="icon-only" icon={trashOutline} />
</IonButton>
```
- Sem texto, somente ícone.

### 4.3 Nova Música (Accordion)

**Regra**: somente "Nova Música" fica em Accordion (os outros blocos não).

**Accordion**:
```tsx
<IonAccordionGroup>
  <IonAccordion value="nova-musica">
    <IonItem slot="header">
      <IonLabel>Nova música</IonLabel>
    </IonItem>
    <div slot="content" className="p-3">
      {/* campos */}
    </div>
  </IonAccordion>
</IonAccordionGroup>
```

**Campos (componentes obrigatórios)**:
- Nome: `<IonInput>`
- BPM: `<IonInput type="number">`
- Categoria principal: `<IonSelect interface="popover">`
- Momento de culto: `<IonSelect interface="popover">`
- Estilo: `<IonSelect interface="popover">`
- Possui VS: `<IonCheckbox>`
- Link da música: `<IonInput type="url">`

**Campo Tons (melhor opção)**:
- **Recomendação padrão**: `<IonSelect multiple={true} interface="popover">` (mais compacto e consistente)
- **Alternativa** (quando quiser visualizar todos os tons): Grid de checkboxes com `<IonGrid>` + `<IonCol size="2">` + `<IonCheckbox>`

---

## 5) Tela: Escala (Agenda de eventos / Eventos)

### Padrão de layout
- Bloco de filtros/form de criar evento compacto
- Lista de eventos em cards (1 por evento)

### Componentes
- **Container**: `<IonCard>` para o formulário / filtros
- **Campos**:
  - Tipo: `<IonSelect>`
  - Data: `<IonDatetimeButton>` + `<IonModal>` + `<IonDatetime>`
  - Hora: `<IonDatetime presentation="time">` (ou input time, mas datetime é mais consistente)
- **Evento exibido em**: `<IonCard>` por evento
- **Músicas do evento**: `<IonList lines="none">`
- **Membros escalados**: `<IonChip outline color="primary">` para função (ex: "Ministrante", "Voz", etc.) ou `<IonBadge>` discreto

---

## 6) Tela: Indisponibilidades

### Blocos
1. Minhas indisponibilidades (formulário)
2. Indisponibilidades da equipe (filtro + lista)

### Componentes

**Form**:
- Data: `<IonDatetimeButton>` + `<IonModal>` + `<IonDatetime>`
- Motivo: `<IonInput>` ou `<IonTextarea autoGrow={true}>` (se quiser melhor UX)
- Botão: `<IonButton size="small" color="primary">`

**Lista**:
- `<IonCard>` por registro, ou `<IonItem>` dentro de `<IonList>`
- Edição/Exclusão: `<IonButton fill="clear" size="small">` icon-only

---

## 7) Telas Admin: Categorias, Momentos, Estilos

### Padrão
- Lista compacta com ações por item (editar/excluir ícone-only)
- Formulário "Novo…" no final (pode ser accordion se quiser reduzir altura)

### Componentes

**Lista**:
- `<IonList lines="none">`
- `<IonItem>`
  - `<IonLabel>` (nome)
  - Ações: `<IonButton fill="clear" size="small">` icon-only

**Novo item**:
- Nome: `<IonInput>`
- Botão: `<IonButton size="small" color="primary">`

---

## 8) Tela Admin: Membros

### Padrão
- Lista com cards ou items compactos
- "Convidar novo membro" pode ser accordion (recomendado para reduzir scroll)

### Componentes

**Filtro (se houver)**: `<IonSelect interface="popover">`

**Lista**:
- `<IonCard>` ou `<IonItem>` em `<IonList>`
- Email e perfis em `text-[0.7rem] text-gray-500`
- Ações editar/excluir: icon-only

**Convidar novo membro**:
- `<IonInput type="email">`, `<IonInput>` (nome), `<IonInput type="tel">`
- Perfil/papel: `<IonSelect>`
- Ministérios: `<IonCheckbox>` (Voz, Músico, etc.)
- Botão enviar: `<IonButton size="small" color="primary">`

---

## 9) Regra geral para "demais telas"

**Manter sempre**:
- Layout clean
- Fontes menores
- Cards compactos
- Botões icon-only quando for ação por item
- Chips outline (primary) pequenos para metadados

**Evitar**:
- Headers grandes
- Bordas fortes
- Botões enormes
- Textos longos sem hierarquia

---

## 10) Checklist de Implementação (LouvorApp)

### ✅ Concluído
- [x] Ionic React instalado e configurado
- [x] IonTabs com rotas funcionando (Início, Músicas, Escala)
- [x] Menu lateral Admin com IonMenu + IonMenuButton
- [x] Header compacto (nome da igreja + botão sair)
- [x] Scroll funcionando em todas as telas

### 🔄 Em andamento
- [ ] Remover logs de debug (Dashboard.tsx, AdminPanel.tsx)
- [ ] Limpar imports não usados (menuController, configIcon)

### 📋 Pendente (por prioridade)

#### **Alta prioridade**
1. **Home (Início)**
   - [ ] Implementar IonAccordionGroup com "Mais Tocadas" e "Minhas Escalas"
   - [ ] Ajustar tipografia (text-sm, text-[0.7rem])
   - [ ] Compactar cards de escalas

2. **Músicas**
   - [ ] Refatorar filtros para 2 colunas (IonGrid ou Tailwind grid)
   - [ ] Compactar cards de músicas (p-3, shadow-sm)
   - [ ] Trocar botões de ação para icon-only (createOutline, trashOutline)
   - [ ] Ajustar chips (h-6, text-xs, outline)
   - [ ] Mover "Nova Música" para IonAccordion

3. **Escala**
   - [ ] Usar IonDatetimeButton + IonModal para data/hora
   - [ ] Compactar cards de eventos
   - [ ] Ajustar lista de músicas (IonList lines="none")
   - [ ] Usar IonChip para funções dos membros

#### **Média prioridade**
4. **Admin (Categorias, Momentos, Estilos)**
   - [ ] Compactar listas (IonList lines="none")
   - [ ] Botões icon-only para editar/excluir
   - [ ] Mover "Novo..." para accordion (opcional)

5. **Admin (Membros)**
   - [ ] Compactar cards/items
   - [ ] "Convidar novo membro" em accordion
   - [ ] Ajustar tipografia

#### **Baixa prioridade**
6. **Indisponibilidades** (se existir)
   - [ ] Implementar conforme padrão (IonDatetimeButton, IonTextarea)

7. **Tema e cores**
   - [ ] Ajustar CSS variables do Ionic para primary/medium/gray
   - [ ] Garantir consistência de cores em todos os componentes

---

## 11) Notas de Migração (Tailwind → Ionic)

### Componentes Ionic vs HTML/Tailwind

| Padrão Moriá (Angular) | Equivalente Ionic React |
|------------------------|-------------------------|
| `<ion-card>` | `<IonCard>` |
| `<ion-button>` | `<IonButton>` |
| `<ion-chip>` | `<IonChip>` |
| `<ion-select>` | `<IonSelect>` |
| `<ion-input>` | `<IonInput>` |
| `<ion-checkbox>` | `<IonCheckbox>` |
| `<ion-list>` | `<IonList>` |
| `<ion-item>` | `<IonItem>` |
| `<ion-label>` | `<IonLabel>` |
| `<ion-icon>` | `<IonIcon icon={...} />` |
| `<ion-accordion-group>` | `<IonAccordionGroup>` |
| `<ion-accordion>` | `<IonAccordion>` |
| `<ion-datetime-button>` | `<IonDatetimeButton>` |
| `<ion-datetime>` | `<IonDatetime>` |
| `<ion-modal>` | `<IonModal>` |

### Ícones (ionicons)

Importar de `ionicons/icons`:
```tsx
import {
  createOutline,
  trashOutline,
  musicalNotesOutline,
  speedometerOutline,
  linkOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons'
```

Usar com:
```tsx
<IonIcon icon={createOutline} />
```

---

## 12) Arquivos a serem modificados (ordem sugerida)

1. **src/pages/Dashboard.tsx** (Home/Início)
   - Implementar IonAccordionGroup
   - Ajustar tipografia e espaçamento

2. **src/pages/Musicas.tsx**
   - Refatorar filtros (2 colunas)
   - Compactar cards
   - Botões icon-only
   - Nova Música em accordion

3. **src/pages/Escala.tsx**
   - IonDatetimeButton para data/hora
   - Compactar eventos
   - IonChip para funções

4. **src/pages/Admin/*.tsx** (CategoriasPanel, MomentosPanel, EstilosPanel, MembrosPanel)
   - Compactar listas
   - Botões icon-only
   - Accordions onde aplicável

5. **src/index.css** ou theme CSS
   - Ajustar CSS variables do Ionic (cores primary/medium/gray)

---

## 13) Comandos úteis

```bash
# Rodar dev server
npm run dev

# Typecheck
npm run typecheck

# Build
npm run build
```

---

**Fim do documento**
