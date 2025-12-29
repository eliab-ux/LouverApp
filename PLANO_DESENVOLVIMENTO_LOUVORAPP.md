# LouvorApp – Plano de Desenvolvimento

## 1. Preparação do Ambiente
- [x] Criar conta e projeto no Supabase
- [x] Anotar URL do projeto e chave anônima pública
- [x] Criar projeto frontend (React + Vite ou CRA)
- [x] Configurar TailwindCSS
- [x] Instalar e configurar `@supabase/supabase-js`

## 2. Modelagem das Entidades no Supabase
Tabelas principais:
- [x] `igrejas (id, nome, data_cadastro, created_at)`
- [x] `usuarios (id, nome, email, papel, igreja_id, created_at)`
- [x] `categorias (id, igreja_id, nome, created_at)`
- [x] `momentos_culto (id, igreja_id, nome, created_at)`
- [x] `estilos (id, igreja_id, nome, created_at)` ✅ **IMPLEMENTADO**
- [x] `musicas (id, igreja_id, nome, bpm, categoria_principal_id, momento_culto_id, estilo_id, possui_vs, tons[], links, created_at)` ✅ **ATUALIZADO**

## 3. Autenticação com Supabase Auth
- [x] Habilitar email/senha (e opcional magic link) no Supabase
- [x] Criar serviço `supabaseClient` no frontend
- [x] Implementar fluxo de login/logout:
  - [x] `signUp(email, senha, nome, nomeIgreja?)` (nome/nomeIgreja pendentes)
  - [x] `signIn(email, senha)`
  - [x] `signOut()`
- [ ] Definir fluxo de cadastro:
  - [ ] Criar nova igreja
  - [ ] Entrar em igreja existente (código/convite)

## 4. RLS e Segurança
Ativar RLS em:
- [x] `igrejas`
- [x] `usuarios`
- [x] `categorias`
- [x] `momentos_culto`
- [x] `estilos` ✅ **IMPLEMENTADO**
- [x] `musicas`

Políticas (alto nível):
- [x] Igreja: usuário vê apenas a igreja onde `igrejas.id = usuarios.igreja_id`
- [x] Usuário: vê apenas seu próprio registro em `usuarios`
- [x] Categorias/Momentos/Estilos/Músicas:
  - [x] Select: `igreja_id = usuario.igreja_id`
  - [x] Insert/Update: apenas `admin` ou `lider`
  - [x] Delete: apenas `admin` ✅ **CORRIGIDO COM RLS**

## 5. Carga Inicial ao Criar Igreja
Backend (Cascade Flows / Edge Functions):
- [ ] Criar flow/endpoint `criar_igreja_e_usuario_admin`:
  - [ ] Criar registro em `igrejas`
  - [ ] Criar registro em `usuarios` vinculado ao `auth.user()` com papel `admin`
  - [ ] Inserir categorias padrão
  - [ ] Inserir momentos de culto padrão

Frontend:
- [ ] Tela de cadastro chamando o flow após o `signUp`

## 6. Estrutura do Frontend (Rotas e Layout)
Rotas (Single Page App com abas):
- [x] Autenticação (Login/Register)
- [x] Dashboard integrado com abas:
  - [x] Músicas
  - [x] Administração (Categorias, Momentos, Estilos, CSV)
  - [x] Sair

Infra:
- [x] Layout principal (header + navegação por abas)
- [x] Proteção de rotas autenticadas
- [x] Design mobile-first ✅ **IMPLEMENTADO**

## 7. Telas e CRUDs
### 7.1 Dashboard
- [x] Mostrar total de músicas ✅
- [x] Filtros por categoria, momento, estilo e tons ✅
- [x] Navegação por abas ✅
- [x] Paginação (5 músicas por página) ✅

### 7.2 Músicas
- [x] Lista de músicas simplificada (nome + link + botões) ✅
- [x] Filtros por categoria, momento, estilo e tom (seleção única) ✅
- [x] Form de criação/edição completo (admin/lider) ✅
- [x] Exclusão de música (apenas admin) ✅
- [x] Todos os campos: nome, BPM, tons (array), categoria, momento, estilo, possui VS, link ✅

### 7.3 Categorias, Momentos de Culto e Estilos
- [x] Listagem em cards ✅
- [x] CRUD completo (criar, editar inline, excluir) ✅
- [x] Respeitar papéis (admin/lider para edição) ✅
- [x] Integrado na aba Administração ✅

### 7.4 Gestão de Membros (Admin)
- [x] Listar `usuarios` da igreja
- [x] Alterar papel (admin, lider, membro) apenas como admin
- [x] Convidar membro por email (versão simples para MVP)

## 8. Importação de Repertório (CSV)
Formato implementado:
- [x] `nome;bpm;tons;possui_vs;categoria;momento;estilo;link` ✅

Frontend:
- [x] Tela de importação na aba Administração ✅
- [x] Upload de arquivo com preview das primeiras linhas ✅
- [x] Validação de cabeçalho (ordem correta) ✅
- [x] Detecção automática de encoding (UTF-8/Windows-1252) ✅
- [x] Botão "Importar músicas do CSV" ✅
- [x] Template CSV disponível para download ✅

Backend:
- [x] Validar formato e cabeçalho do CSV ✅
- [x] Criar automaticamente categorias/momentos/estilos se não existirem ✅
- [x] Associar por nome (case-insensitive) ✅
- [x] Inserir músicas no banco ✅
- [x] Feedback de erro detalhado ✅

## 9. Design e UX (Tailwind)
- [x] Configurar paleta (slate/cinza escuro, verde emerald para sucesso, vermelho para erros) ✅
- [x] Design dark mode por padrão ✅
- [x] Componentes customizados:
  - [x] Cards, Badges, Buttons
  - [x] Inputs, Labels, Selects, Checkboxes
  - [x] Listas e tabelas responsivas
- [x] Mobile-first (botões acessíveis, fontes legíveis) ✅
- [x] Feedback visual (loading states, disabled states) ✅

## 10. Deploy e Testes
- [x] Configurar variáveis de ambiente (Supabase) ✅
- [ ] Testar fluxos principais:
  - [x] Login / logout ✅
  - [ ] Cadastro e criação de nova igreja
  - [x] CRUD de músicas, categorias, momentos e estilos ✅
  - [x] Permissões por papel (admin pode excluir, lider pode editar) ✅
  - [x] Importação de CSV com encoding correto ✅
  - [x] Filtros e paginação
- [ ] Configurar build e deploy (Vercel/Netlify)
- [ ] Testar com múltiplos usuários e igrejas

---

## 11. Melhorias Futuras (Backlog)

### 11.1 Funcionalidades Gerais
- [x] **Busca por texto** - filtrar músicas por nome usando pesquisa textual
- [ ] **Exportação CSV** - exportar músicas filtradas para CSV
- [x] **Ordenação customizável** - ordenar músicas por BPM, nome, data de criação
- [ ] **Backup automático** - export periódico dos dados da igreja
- [ ] **Temas/cores customizáveis** - permitir igreja customizar paleta de cores

### 11.2 Dashboard e Estatísticas
- [x] **Dashboard com métricas** - total de músicas por categoria, momento, estilo
- [ ] **Gráficos de uso** - músicas mais tocadas, tons mais comuns
- [ ] **Histórico de alterações** - auditoria de criação/edição/exclusão

### 11.3 Melhorias de RLS
- [ ] **Verificar e corrigir políticas DELETE** - executar script `fix_all_delete_rls.sql` em produção
- [ ] **Testes de permissões** - garantir que membros não podem editar/excluir

### 11.4 Gestão de Usuários
- [x] **Listar membros da igreja** - tela de administração de usuários
- [x] **Alterar papel de usuários** - admin pode promover/rebaixar membros
- [x] **Convite por email** - sistema de convite para novos membros
- [x] **Remover membros** - admin pode remover usuários da igreja

---

## 12. 🎛️ MÓDULO DE ESCALA E AGENDA

### 12.1 Visão Geral
Sistema para gerenciar escalas de louvor com:
- Membros podem marcar indisponibilidades
- Líder monta escalas com base nas indisponibilidades
- Escala publicada fica travada para membros (apenas líder pode alterar)
- Notificações quando membro é escalado

### 12.2 Metas
🎯 Garantir previsão e organização do time de louvor  
🔄 Permitir membros declararem indisponibilidades com antecedência  
🧑‍🤝‍🧑 Dar ao Líder controle completo sobre escalas  
🔒 Trava automática após a escala ser publicada

### 12.3 Stack Técnica
- **Frontend:** React + Tailwind (integrado ao LouvorApp)
- **Backend:** Supabase (mesmas tabelas e RLS)
- **Deploy:** Integrado ao app existente

### 12.4 Novas Entidades

#### Tabela: `eventos`
```sql
- id (uuid, PK)
- igreja_id (uuid, FK → igrejas)
- tipo (enum: 'culto' | 'ensaio')
- data (date)
- hora (time)
- created_at (timestamp)
```

#### Tabela: `escalas`
```sql
- id (uuid, PK)
- evento_id (uuid, FK → eventos)
- igreja_id (uuid, FK → igrejas)
- publicada (boolean, default: false)
- observacoes (text, nullable)
- criado_por (uuid, FK → usuarios)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabela: `indisponibilidades`
```sql
- id (uuid, PK)
- usuario_id (uuid, FK → usuarios)
- igreja_id (uuid, FK → igrejas)
- data (date)
- motivo (text, nullable)
- created_at (timestamp)
```

#### Tabela: `escalados`
```sql
- id (uuid, PK)
- escala_id (uuid, FK → escalas)
- usuario_id (uuid, FK → usuarios)
- funcao (text) -- ex: 'Voz', 'Teclado', 'Bateria', 'Guitarra'
- created_at (timestamp)
```

### 12.5 Telas e Fluxos

#### 12.5.1 Agenda (todos os usuários)
- [ ] Lista de eventos futuros (data, tipo, status da escala)
- [ ] Filtro por tipo (Culto/Ensaio)
- [ ] Badge indicando se membro está escalado
- [ ] Acesso à escala detalhada (se publicada)

#### 12.5.2 Marcar Indisponibilidade (membros)
- [ ] Formulário: selecionar data + motivo opcional
- [ ] Listar indisponibilidades cadastradas
- [ ] Permitir editar/excluir apenas se escala não foi publicada
- [ ] Validação: apenas datas futuras

#### 12.5.3 Montar Escala (líder/admin)
- [ ] Selecionar evento da agenda
- [ ] Seletor de membros por função (Voz, Instrumento, etc)
- [ ] Aviso visual se membro está indisponível
- [ ] Campo de observação para recados
- [ ] Botão "Publicar Escala" (trava para membros)
- [ ] Preview antes de publicar

#### 12.5.4 Escala Publicada (todos)
- [ ] Lista de escalados com funções
- [ ] Badge "Você está escalado como..."
- [ ] Visualização das observações
- [ ] Botão para compartilhar (futuro)
- [ ] Exportar como PDF (futuro)

### 12.6 Permissões e RLS

#### Políticas de Segurança

**Eventos:**
- SELECT: Todos os membros da igreja
- INSERT/UPDATE/DELETE: Apenas líder/admin

**Escalas:**
- SELECT: Todos os membros da igreja
- INSERT/UPDATE: Apenas líder/admin
- DELETE: Apenas admin
- Escala publicada só pode ser alterada por líder/admin

**Indisponibilidades:**
- SELECT: Próprio usuário + líder/admin da igreja
- INSERT/UPDATE/DELETE: Próprio usuário (bloqueado se escala já publicada)

**Escalados:**
- SELECT: Todos os membros da igreja
- INSERT/UPDATE/DELETE: Apenas líder/admin

### 12.7 Regras de Negócio

#### Indisponibilidade
- ✅ Membro pode marcar apenas datas futuras
- ✅ Não pode editar/excluir se já existe escala publicada para a data
- ✅ Líder/admin pode ver todas as indisponibilidades

#### Escala
- ✅ Líder vê quais membros estão indisponíveis ao montar escala
- ✅ Alerta visual se tentar escalar membro indisponível
- ✅ Após publicar, apenas líder/admin pode alterar
- ✅ Membros recebem notificação ao serem escalados (futuro)

#### Travamento
- ✅ Ao publicar escala (`publicada = true`):
  - Membros não podem mais editar indisponibilidades para aquela data
  - Apenas líder/admin pode alterar os escalados
  - Badge "Publicada" aparece na agenda

### 12.8 Design Guidelines

#### Componentes
- [ ] **Calendário/Agenda**: Visualização mensal com marcadores
- [ ] **Cards de Evento**: Data, tipo (Culto/Ensaio), status
- [ ] **Listas de Escalados**: Avatar, nome, função
- [ ] **Formulário de Indisponibilidade**: Data picker + campo texto
- [ ] **Badge de Status**: Escalado, Indisponível, Publicada

#### Cores e Estados
- 🟢 **Verde**: Confirmado/escalado
- 🟡 **Amarelo**: Pendente/não publicado
- 🔴 **Vermelho**: Indisponível
- ⚪ **Cinza**: Sem escala

#### UX Mobile-First
- Toques simples (sem drag & drop)
- Badges claros como "Você está indisponível" ou "Escalado como Bateria"
- Feedback ao salvar ou publicar (toast de sucesso)
- Confirmação antes de publicar escala

### 12.9 Fluxo de Implementação

#### Etapa 1 - Database ✅ CONCLUÍDO (2024-12-11)
- [x] Criar tabelas: eventos, escalas, indisponibilidades, escalados
- [x] Configurar RLS para todas as tabelas
- [x] Criar índices para performance
- [x] Testar políticas de segurança

#### Etapa 2 - Backend/API 🔄 PRÓXIMO
- [ ] CRUD de eventos
- [ ] CRUD de indisponibilidades (com validação de data)
- [ ] CRUD de escalas (com lógica de publicação)
- [ ] CRUD de escalados
- [ ] Função para verificar conflitos (membro indisponível escalado)

#### Etapa 3 - Frontend Base
- [ ] Nova aba "Escala" no dashboard
- [ ] Tela de Agenda (lista de eventos)
- [ ] Componente de calendário/date picker
- [ ] Componentes de badge e status

#### Etapa 4 - Funcionalidades Membro
- [ ] Tela de marcar indisponibilidade
- [ ] Lista de indisponibilidades cadastradas
- [ ] Validação de datas (apenas futuras)
- [ ] Feedback de bloqueio se escala já publicada

#### Etapa 5 - Funcionalidades Líder
- [ ] Tela de montar escala
- [ ] Seletor de membros por função
- [ ] Indicador visual de indisponibilidade
- [ ] Campo de observações
- [ ] Botão "Publicar Escala" com confirmação
- [ ] Preview da escala antes de publicar

#### Etapa 6 - Visualização de Escala
- [ ] Tela de escala publicada
- [ ] Lista de escalados com funções
- [ ] Badge personalizado para usuário logado
- [ ] Exibição de observações

#### Etapa 7 - Melhorias
- [ ] Notificações ao ser escalado
- [ ] Confirmação de presença
- [ ] Exportar escala como PDF
- [ ] Compartilhar link da escala
- [ ] Repetição automática de escalas (padrão semanal)
- [ ] Dashboard com estatísticas de escalas

### 12.10 Diferenciais do Módulo
✨ **Fluxo claro e respeitoso** para membros  
🔒 **Trava automática** evita confusão após publicação  
🎯 **Total integração** com cadastro de usuários existente  
📱 **Mobile-first** com UX simplificada  
⚡ **Performance** com RLS e índices otimizados

---

## 13. UX / UI – Backlog de Melhorias

### 13.1 Cabeçalho e Navegação Global
- [ ] Reduzir tamanho da fonte do nome da igreja e padding do topo
- [ ] Melhorar contraste e espaçamento dos botões: Visão geral | Músicas | Escala
- [ ] Adicionar ícones nas abas (lucide-react / heroicons)
- [ ] Criar menu colapsável para mobile (hambúrguer / drawer com animação suave)

### 13.2 Tela Visão Geral
- [ ] Usar cards com `rounded-2xl`, sombra suave e separação clara entre seções
- [ ] Ajustar alinhamento e espaçamento dos textos de estatísticas (título + contador “1x”)
- [ ] Usar ícones menores e suaves nos títulos (ex.: 🎵 “Mais tocadas”)
- [ ] Usar `text-xs` ou `text-sm` para o número de execuções (1x, 2x, etc.)

### 13.3 Tela Músicas
- [ ] Transformar seleção de tom em grade de botões menores (`grid grid-cols-3` ou `grid-cols-4`)
- [ ] Destacar tom selecionado com pill e `bg-muted`/cor de destaque
- [ ] Substituir botões “Editar” / “Excluir” por ícones em menu (kebab / dropdown)
- [ ] Aplicar o design de filtros: busca com ícone, “Ordenar por”, direção A-Z/Z-A

### 13.4 Tela Escala
- [ ] Usar inputs com labels consistentes (ou labels flutuantes estilo Material)
- [ ] Agrupar cada evento em cards com borda, sombra e ícones (hora, membros, repertório)
- [ ] Destacar botão “Montar escala” com cor primária (`bg-primary`, `hover:scale-105`)
- [ ] Tornar seções “Membros escalados” e “Músicas da escala” colapsáveis

### 13.5 Telas Administrativas (Categorias, Momentos, Estilos, Membros)
- [ ] Transformar itens de lista em cards compactos com ícones + ações embutidas
- [ ] Colocar formulários de “Nova categoria/estilo/etc.” dentro de cards mais baixos e suaves
- [ ] Padronizar campos de formulário (label em cima, foco visível, mesma borda/cor)
- [ ] Manter mesma linguagem visual entre Categorias / Momentos / Estilos / Membros

### 13.6 Tela Importar CSV
- [ ] Usar accordion para mostrar/esconder instruções (“Instruções” com seta)
- [ ] Destacar botão “Baixar Template CSV” com estilo primário + ícone de download
- [ ] Melhorar formatação dos bullets de instruções (ícones de checklist / dashes finos)
- [ ] Organizar campos: seletor de arquivo + botão “Importar músicas” em layout claro

### 13.7 Stack de UI Avançada (Opcional / Evolução)
- [ ] Avaliar adoção de **shadcn/ui** para:
  - [ ] `<Button>` com variantes (primary, outline, ghost)
  - [ ] `<Tabs>` com ícones
  - [ ] `<Input>`, `<Label>`, `<Textarea>`
  - [ ] `<Card>` (CardHeader, CardContent)
- [ ] Integrar **Framer Motion** para animações suaves (tabs, modais, drawer)
- [ ] Padronizar ícones com **Lucide React**
- [ ] Ajustar **Tailwind** com container queries para responsividade mais detalhada

### 13.8 Design Tokens e Estilo Visual
- [ ] Ajustar `tailwind.config` com:
  - [ ] `fontFamily.sans = ['Inter', 'system-ui', 'sans-serif']`
  - [ ] `borderRadius` estendido (`2xl`, `3xl`)
  - [ ] `boxShadow.soft` para cards
  - [ ] Paleta `brand.primary` (roxo) e variações
- [ ] Criar camada base de estilos em `src/styles/index.css`:
  - [ ] `page-shell`, `page-inner`
  - [ ] `.card`, `.card-section`, `.card-divider`
  - [ ] `.section-title`, `.section-title-icon`, `.section-title-text`
  - [ ] `.pill-tabs`, `.pill-tab`, `.pill-tab--active`
  - [ ] `.chip`, `.chip-soft`, `.btn-primary`, `.btn-ghost`
- [ ] Definir esquema de cores dark:
  - [ ] Fundo: `#050509 ~ #111111`
  - [ ] Cards: `#1b1b1f ~ #161624`
  - [ ] Texto primário/secundário
  - [ ] Ações: roxo, azul, vermelho para delete

---

## 📝 Observações Finais

### Status Atual do Projeto
- ✅ **MVP do LouvorApp implementado** com músicas, categorias, momentos, estilos
- ✅ **Importação CSV** funcionando com detecção automática de encoding
- ✅ **Paginação e filtros** implementados
- ✅ **RLS DELETE CORRIGIDO** - Apenas admin pode deletar (2024-12-11)
- ✅ **Refatoração completa** - Código modular em 6 arquivos (2024-12-11)
- 🚧 **Gestão de membros** pendente
- 🎯 **Módulo de Escala** pronto para iniciar implementação

### Prioridades
1. ✅ ~~Corrigir RLS DELETE~~ (concluído)
2. 🎯 Implementar módulo de Escala e Agenda (próximo)
3. 📊 Dashboard com estatísticas (futuro)
4. 👥 Gestão completa de membros (futuro)
