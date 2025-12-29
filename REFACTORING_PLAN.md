# 🏗️ Plano de Refatoração - LouvorApp

## 📋 Status Atual
O arquivo `App.tsx` tem **~2600 linhas** com toda a lógica misturada:
- Autenticação
- Dashboard
- CRUD de Músicas, Categorias, Momentos, Estilos
- Módulo de Escala (Eventos, Indisponibilidades)
- Importação CSV

## 🎯 Objetivo
Separar responsabilidades e criar uma estrutura escalável e maintível.

---

## 📁 Nova Estrutura de Arquivos

```
src/
├── App.tsx                      ✅ Apenas roteamento e auth wrapper (~100 linhas)
├── lib/
│   └── supabase.ts              ✅ Cliente do Supabase (CRIADO)
├── types/
│   └── index.ts                 ✅ Tipagens globais (CRIADO)
├── pages/
│   ├── Login.tsx                🔄 Tela de autenticação (~150 linhas)
│   ├── Dashboard.tsx            🔄 Shell principal com abas (~200 linhas)
│   ├── Musicas.tsx              🔄 Lista + CRUD de músicas (~400 linhas)
│   ├── Escala.tsx               🔄 Eventos + Indisponibilidades (~300 linhas)
│   └── AdminPanel.tsx           🔄 Categorias, Momentos, Estilos, CSV (~600 linhas)
├── components/
│   ├── MusicaCard.tsx           🆕 Card de música (~50 linhas)
│   ├── MusicaForm.tsx           🆕 Formulário de música (~100 linhas)
│   ├── MusicaFilters.tsx        🆕 Filtros de música (~80 linhas)
│   ├── EventoCard.tsx           🆕 Card de evento (~50 linhas)
│   ├── IndisponibilidadeForm.tsx 🆕 Formulário de indisponibilidade (~80 linhas)
│   └── Header.tsx               🆕 Header com navegação (~50 linhas)
└── hooks/                       🆕 Custom hooks (futuro)
    ├── useMusicas.ts            🆕 Lógica de músicas
    ├── useEventos.ts            🆕 Lógica de eventos
    └── useIndisponibilidades.ts 🆕 Lógica de indisponibilidades
```

---

## 🔄 Etapas da Refatoração

### **Etapa 1: Arquivos Base** ✅ CONCLUÍDO
- [x] Criar `src/types/index.ts` com todos os tipos
- [x] Criar `src/lib/supabase.ts` com cliente do Supabase
- [x] Documentar plano de refatoração

### **Etapa 2: Extrair Página de Login** ✅ CONCLUÍDO
- [x] Criar `src/pages/Login.tsx`
- [x] Implementar componente de autenticação completo
- [x] Login com email e senha
- [x] Cadastro de novos usuários
- [x] Recuperação de senha ("Esqueci minha senha")
- [x] Validações e tratamento de erros
- [x] Mensagens traduzidas para português
- [x] Testar login/registro

### **Etapa 3: Extrair Dashboard** ✅ CONCLUÍDO
- [x] Criar `src/pages/Dashboard.tsx`
- [x] Mover lógica de abas e navegação
- [x] Manter apenas shell (Header + Tabs + Outlet)
- [x] Testar navegação entre abas

### **Etapa 4: Extrair Página de Músicas** ✅ CONCLUÍDO
- [x] Criar `src/pages/Musicas.tsx`
- [x] Mover estados: musicas, categorias, momentos, estilos, filtros, paginação
- [x] Mover funções: carregarMusicas, criarMusica, editarMusica, excluirMusica
- [x] Mover formulários de criação/edição
- [x] Testar CRUD completo
- [x] Remover todo código de músicas do Dashboard
- [x] Remover seção CSV (será movida para AdminPanel)

### **Etapa 5: Extrair AdminPanel** ✅ CONCLUÍDO
- [x] Criar `src/pages/AdminPanel.tsx`
- [x] Mover gestão de Categorias, Momentos, Estilos
- [x] Implementar CRUD completo para cada entidade
- [x] Testar todas as funções de admin
- [x] Remover todo código de admin do Dashboard

### **Etapa 6: Extrair Página de Escala** ✅ CONCLUÍDO
- [x] Criar `src/pages/Escala.tsx`
- [x] Mover estados: eventos, escalas, indisponibilidades, escalados
- [x] Mover funções: carregarEventos, carregarEscalas, carregarIndisponibilidades, carregarEscalados
- [x] Criar interface básica de eventos (lista + mensagem placeholder)
- [x] Criar interface básica de indisponibilidades (lista + mensagem placeholder)
- [x] Preparar estrutura para futuras funções CRUD
- [x] Testar compilação

### **Etapa 7: Componentizar** (Opcional, mas recomendado)
- [ ] Criar componentes reutilizáveis
- [ ] `MusicaCard`, `EventoCard`, etc.
- [ ] Reduzir duplicação de código

### **Etapa 8: Custom Hooks** (Futuro)
- [ ] `useMusicas()` - Lógica de músicas
- [ ] `useEventos()` - Lógica de eventos
- [ ] `useIndisponibilidades()` - Lógica de indisponibilidades

---

## 📊 Benefícios Esperados

### **Manutenibilidade**
- ✅ Cada arquivo tem **uma responsabilidade clara**
- ✅ Fácil localizar e modificar funcionalidades
- ✅ Redução de bugs por isolamento de lógica

### **Escalabilidade**
- ✅ Adicionar novas funcionalidades sem impactar código existente
- ✅ Fácil adicionar novas páginas (ex: Relatórios, Membros)
- ✅ Preparado para Flows serverless

### **Colaboração**
- ✅ Múltiplos desenvolvedores podem trabalhar simultaneamente
- ✅ Code review mais fácil (mudanças isoladas)
- ✅ Onboarding de novos devs mais rápido

### **Performance**
- ✅ Code splitting automático por página
- ✅ Lazy loading de rotas
- ✅ Bundle menor inicial

---

## ⚠️ Riscos e Mitigações

### **Quebrar funcionalidade existente**
- **Mitigação:** Fazer etapa por etapa, testando a cada mudança
- **Mitigação:** Manter commits pequenos e atômicos
- **Mitigação:** Testar login, músicas, escala após cada etapa

### **Perder estado ou dados**
- **Mitigação:** Não alterar banco de dados, apenas código frontend
- **Mitigação:** Manter mesma lógica, apenas reorganizar

### **Import errados**
- **Mitigação:** Usar paths absolutos (`@/types`, `@/lib`)
- **Mitigação:** TypeScript vai avisar de imports quebrados

---

## 🚀 Próximos Passos

1. **REVISAR este plano** - Aprovar ou sugerir mudanças
2. **Executar Etapa 2** - Extrair Login.tsx
3. **Testar Login** - Garantir que funciona
4. **Continuar etapas** - Uma de cada vez

---

## 📝 Notas Importantes

- **NÃO deletar** `App.tsx` atual até tudo funcionar
- **MANTER** backup do código atual
- **TESTAR** após cada etapa
- **COMMIT** após cada etapa funcional

---

## ✅ Checklist de Validação por Etapa

Após cada etapa, verificar:
- [ ] Aplicação compila sem erros TypeScript
- [ ] Aplicação carrega no navegador
- [ ] Funcionalidade específica funciona corretamente
- [ ] Console sem erros
- [ ] Commit realizado com mensagem descritiva

---

**Status Final:** 
- ✅ Etapa 1: Arquivos Base - CONCLUÍDO
- ✅ Etapa 2: Login - CONCLUÍDO
- ✅ Etapa 3: Dashboard - CONCLUÍDO  
- ✅ Etapa 4: Músicas - CONCLUÍDO
- ✅ Etapa 5: AdminPanel - CONCLUÍDO
- ✅ Etapa 6: Escala - CONCLUÍDO

**🎉 Progresso: 6 de 6 etapas principais concluídas (100%)! 🎉**

**Resultados Alcançados:**
- **Dashboard.tsx:** De 2600 → 270 linhas (redução de 90%)
- **Login.tsx:** ~290 linhas (extraído e completo)
- **Musicas.tsx:** ~600 linhas (CRUD completo)
- **AdminPanel.tsx:** ~700 linhas (gestão de dados)
- **Escala.tsx:** ~230 linhas (eventos e escalas)
- **Código organizado:** Cada funcionalidade em seu próprio arquivo
- **TypeScript:** 100% tipado sem erros
- **Build:** ✅ Compilação perfeita
