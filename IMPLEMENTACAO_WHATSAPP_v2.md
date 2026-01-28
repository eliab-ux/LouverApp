# Implementação de Notificações Multi-canal (Email + WhatsApp) - v2

**Data:** 31/12/2024
**Status:** ✅ Implementação Completa (Opção B - Funções v2)

## Resumo

Implementação bem-sucedida do sistema de notificações multi-canal, permitindo que usuários escolham receber notificações via **Email**, **WhatsApp** ou **Ambos**.

A estratégia escolhida foi a **Opção B** (conservadora): criar versões v2 das Edge Functions existentes para testar antes de substituir as originais em produção.

---

## Arquivos Modificados/Criados

### 1. Database Migration
**Arquivo:** `supabase/migrations/20251231_add_whatsapp_support.sql`

**Mudanças:**
- Adiciona coluna `canal_notificacao` na tabela `usuarios` (valores: 'email', 'whatsapp', 'ambos')
- Adiciona colunas de configuração WhatsApp na tabela `igrejas`:
  - `whatsapp_habilitado` (boolean)
  - `whatsapp_instance_id` (text)
  - `whatsapp_api_key` (text)
- Cria índices para otimização de queries

**Status:** ✅ Aplicado em produção via SQL Editor

---

### 2. Edge Functions

#### 2.1. send_whatsapp (NOVA)
**Arquivo:** `supabase/functions/send_whatsapp/index.ts`

**Função:** Edge Function auxiliar para envio de mensagens via WhatsApp

**Funcionalidades:**
- Valida se WhatsApp está habilitado para a igreja
- Busca credenciais da Evolution API do banco de dados
- Formata número de telefone (adiciona +55 se necessário)
- Envia mensagem via Evolution API
- Retorna sucesso/erro

**Status:** ✅ Deployada em produção

---

#### 2.2. notify_escala_publicada_v2 (NOVA)
**Arquivo:** `supabase/functions/notify_escala_publicada_v2/index.ts`

**Função:** Versão v2 com suporte multi-canal para notificar membros escalados

**Interface Atualizada:**
```typescript
interface EscaladoInfo {
  id: string              // UUID do usuário (NOVO)
  nome: string
  email: string
  telefone?: string       // Telefone do usuário (NOVO)
  funcao?: string
  canal_notificacao: 'email' | 'whatsapp' | 'ambos'  // (NOVO)
}

interface NotifyPayload {
  evento: { id, tipo, data, hora }
  escalados: EscaladoInfo[]
  igreja_id: string       // ID da igreja (NOVO)
  igreja_nome?: string
}
```

**Lógica de Envio:**
- Para cada escalado, verifica preferência de canal
- Envia email se preferência incluir 'email' ou 'ambos'
- Envia WhatsApp se preferência incluir 'whatsapp' ou 'ambos' E tiver telefone
- Executa envios em paralelo (Promise.all)
- Retorna estatísticas separadas de email e WhatsApp

**Status:** ✅ Deployada em produção

---

#### 2.3. remind_musicas_ministrantes_v2 (NOVA)
**Arquivo:** `supabase/functions/remind_musicas_ministrantes_v2/index.ts`

**Função:** Versão v2 com suporte multi-canal para lembrar ministrantes de escolher músicas

**Mudanças principais:**
- Busca `canal_notificacao` e `telefone` dos ministrantes
- Envia lembretes via email e/ou WhatsApp conforme preferência
- Retorna estatísticas de `emails_enviados` e `whatsapp_enviados`

**Status:** ✅ Deployada em produção

---

### 3. TypeScript Types

**Arquivo:** `src/types/index.ts`

**Mudanças no tipo `AppUser`:**
```typescript
export type AppUser = {
  // ... campos existentes ...
  telefone?: string | null
  canal_notificacao?: 'email' | 'whatsapp' | 'ambos'  // NOVO
  igrejaWhatsAppHabilitado?: boolean                   // NOVO
  igrejaWhatsAppInstanceId?: string | null             // NOVO
}
```

**Novo tipo `Igreja`:**
```typescript
export type Igreja = {
  id: string
  nome: string
  cnpj?: string | null
  whatsapp_habilitado: boolean        // NOVO
  whatsapp_instance_id?: string | null // NOVO
  whatsapp_api_key?: string | null    // NOVO
  created_at: string
}
```

**Mudanças no tipo `Usuario`:**
```typescript
export type Usuario = {
  // ... campos existentes ...
  telefone?: string | null                            // NOVO
  canal_notificacao?: 'email' | 'whatsapp' | 'ambos' // NOVO
}
```

**Status:** ✅ Implementado

---

### 4. Frontend - App.tsx

**Arquivo:** `src/App.tsx`

**Mudanças:**
- Atualiza query para buscar `canal_notificacao` de `usuarios`
- Atualiza query para buscar `whatsapp_habilitado` e `whatsapp_instance_id` de `igrejas`
- Popula campos adicionais no objeto `AppUser`

**Status:** ✅ Implementado

---

### 5. Frontend - MeuPerfil.tsx

**Arquivo:** `src/pages/MeuPerfil.tsx`

**Mudanças:**
- Adiciona campo `canal_notificacao` no formulário
- Adiciona `IonSelect` com opções:
  - 📧 Email
  - 💬 WhatsApp
  - 📧💬 Ambos (Email + WhatsApp)
- Exibe aviso se usuário escolher WhatsApp mas não tiver telefone cadastrado
- Salva preferência no banco ao clicar em "Salvar"

**Status:** ✅ Implementado

---

### 6. Frontend - DadosIgreja.tsx

**Arquivo:** `src/pages/DadosIgreja.tsx`

**Mudanças:**
- Adiciona seção "Notificações via WhatsApp"
- Toggle para habilitar/desabilitar WhatsApp
- Campos condicionais quando WhatsApp está habilitado:
  - Instance ID (Evolution API)
  - API Key (Evolution API) - campo tipo password, não carrega valor do banco
- Atualiza banco ao salvar

**Observação de Segurança:**
- API Key nunca é carregada do banco para o frontend
- Só é atualizada se um novo valor for fornecido
- Campo com placeholder "deixe em branco para manter a atual"

**Status:** ✅ Implementado

---

## Fluxo Completo de Uso

### 1. Configuração do Admin (Uma vez)

1. Admin acessa **Dados da Igreja**
2. Ativa toggle "Notificações via WhatsApp"
3. Preenche:
   - Instance ID da Evolution API
   - API Key da Evolution API
4. Clica em "Salvar"

### 2. Configuração do Usuário

1. Usuário acessa **Meu Perfil**
2. Preenche telefone (se quiser WhatsApp)
3. Escolhe canal de notificação preferido:
   - Email
   - WhatsApp
   - Ambos
4. Clica em "Salvar"

### 3. Notificação Automática

Quando uma escala for publicada:

1. Frontend chama `notify_escala_publicada_v2` (quando integrado)
2. Edge Function recebe lista de escalados com:
   - id, nome, email, telefone, funcao, canal_notificacao
3. Para cada escalado:
   - Se preferência = 'email' ou 'ambos' → envia email
   - Se preferência = 'whatsapp' ou 'ambos' E tem telefone → envia WhatsApp
4. Retorna estatísticas de sucesso

---

## Próximos Passos (Para Testar v2 e Migrar)

### Passo 1: Testar Funções v2

**Opção A) Teste Manual via Dashboard Supabase:**
1. Acesse o Dashboard do Supabase
2. Vá em Edge Functions
3. Selecione `notify_escala_publicada_v2`
4. Clique em "Invoke" e teste com payload de exemplo:

```json
{
  "evento": {
    "id": "uuid-do-evento",
    "tipo": "culto",
    "data": "2025-01-05",
    "hora": "19:00"
  },
  "escalados": [
    {
      "id": "uuid-do-usuario",
      "nome": "Fulano de Tal",
      "email": "fulano@email.com",
      "telefone": "11999999999",
      "funcao": "Voz",
      "canal_notificacao": "ambos"
    }
  ],
  "igreja_id": "uuid-da-igreja",
  "igreja_nome": "Minha Igreja"
}
```

**Opção B) Teste via Frontend (Recomendado):**
1. Atualizar [AgendaSection.tsx](src/pages/Escala/agenda/AgendaSection.tsx) para chamar `notify_escala_publicada_v2` temporariamente
2. Publicar uma escala de teste
3. Verificar se notificações foram enviadas
4. Verificar logs no Dashboard Supabase

---

### Passo 2: Integrar v2 no Frontend

**Arquivo a modificar:** `src/pages/Escala/agenda/AgendaSection.tsx`

Procurar pela chamada da Edge Function original e substituir por v2:

**ANTES:**
```typescript
const { error } = await supabase.functions.invoke('notify_escala_publicada', {
  body: {
    evento: { ... },
    escalados: escalados.map(e => ({
      nome: e.nome,
      email: e.email,
      funcao: e.funcao
    })),
    igreja_nome: user.igrejaNome
  }
})
```

**DEPOIS:**
```typescript
// IMPORTANTE: A query que busca escalados precisa incluir telefone e canal_notificacao
const { error } = await supabase.functions.invoke('notify_escala_publicada_v2', {
  body: {
    evento: { ... },
    escalados: escalados.map(e => ({
      id: e.usuario_id,              // NOVO
      nome: e.nome,
      email: e.email,
      telefone: e.telefone,           // NOVO
      funcao: e.funcao,
      canal_notificacao: e.canal_notificacao  // NOVO
    })),
    igreja_id: user.igrejaId,         // NOVO
    igreja_nome: user.igrejaNome
  }
})
```

**ATENÇÃO:** Verificar se a query que busca os escalados já inclui os campos `telefone` e `canal_notificacao`. Caso contrário, adicionar:

```typescript
const { data: escalados } = await supabase
  .from('escalados')
  .select(`
    id,
    usuario_id,
    funcao,
    usuario:usuarios!inner (
      id,
      nome,
      email,
      telefone,          // ADICIONAR
      canal_notificacao  // ADICIONAR
    )
  `)
  .eq('escala_id', escalaId)
```

---

### Passo 3: Após Confirmação de Funcionamento

Quando tudo estiver funcionando perfeitamente com as versões v2:

**Opção 1: Manter Ambas (Recomendado Temporariamente)**
- Deixar as versões originais (`notify_escala_publicada` e `remind_musicas_ministrantes`) como backup
- Continuar usando v2 em produção
- Após algumas semanas sem problemas, deletar as originais

**Opção 2: Substituir Completamente**
1. Fazer backup das funções originais (já feito via git)
2. Deletar as funções originais via CLI:
   ```bash
   supabase functions delete notify_escala_publicada --project-ref wajbaxzpehfkapqndfwv
   supabase functions delete remind_musicas_ministrantes --project-ref wajbaxzpehfkapqndfwv
   ```
3. Renomear as pastas v2 removendo o sufixo:
   ```bash
   mv supabase/functions/notify_escala_publicada_v2 supabase/functions/notify_escala_publicada
   mv supabase/functions/remind_musicas_ministrantes_v2 supabase/functions/remind_musicas_ministrantes
   ```
4. Fazer deploy novamente:
   ```bash
   supabase functions deploy notify_escala_publicada --project-ref wajbaxzpehfkapqndfwv
   supabase functions deploy remind_musicas_ministrantes --project-ref wajbaxzpehfkapqndfwv
   ```
5. Atualizar chamadas no frontend para remover `_v2`

---

## Configuração da Evolution API

**Requisitos:**
- VPS ou servidor com Evolution API instalada
- URL da API (ex: `https://evolution.meudominio.com`)
- Instance ID criada no Evolution
- API Key da instância

**Configuração no Supabase:**

1. Acessar Dashboard do Supabase
2. Ir em **Project Settings** > **Edge Functions**
3. Adicionar variável de ambiente:
   - Nome: `EVOLUTION_API_URL`
   - Valor: URL da sua Evolution API (sem barra no final)
   - Exemplo: `https://evolution.meudominio.com`

---

## Checklist de Validação

### Backend
- [x] Migration aplicada em produção
- [x] Edge Function `send_whatsapp` deployada
- [x] Edge Function `notify_escala_publicada_v2` deployada
- [x] Edge Function `remind_musicas_ministrantes_v2` deployada
- [ ] Variável `EVOLUTION_API_URL` configurada no Supabase
- [ ] Evolution API configurada e testada

### Frontend
- [x] Types atualizados
- [x] App.tsx carregando novos campos
- [x] MeuPerfil.tsx com seletor de canal
- [x] DadosIgreja.tsx com config WhatsApp
- [ ] AgendaSection.tsx integrado com v2
- [ ] Queries atualizadas para buscar telefone/canal_notificacao

### Testes
- [ ] Teste de envio de email (canal = 'email')
- [ ] Teste de envio de WhatsApp (canal = 'whatsapp')
- [ ] Teste de envio de ambos (canal = 'ambos')
- [ ] Teste de fallback quando WhatsApp falha
- [ ] Teste com usuário sem telefone (deve enviar só email)
- [ ] Teste com igreja sem WhatsApp habilitado

---

## Logs e Monitoramento

### Visualizar Logs das Edge Functions

1. Acessar Dashboard do Supabase
2. Ir em **Edge Functions**
3. Selecionar a função
4. Clicar em "Logs"

### Principais Logs a Verificar

**send_whatsapp:**
- "WhatsApp não está habilitado para esta igreja"
- "Configuração do WhatsApp incompleta na igreja"
- "Erro Evolution API:" (se houver falha no envio)

**notify_escala_publicada_v2:**
- "Email desabilitado (RESEND_API_KEY não configurada)"
- "Escalado X tem preferência de email mas não tem email cadastrado"
- "Escalado X tem preferência de WhatsApp mas não tem telefone cadastrado"

---

## Rollback (Se Necessário)

Caso algo dê errado com as funções v2:

1. Atualizar frontend para voltar a chamar as funções originais (remover `_v2`)
2. As funções originais continuam funcionando normalmente
3. Investigar problema nas funções v2
4. Corrigir e testar novamente

---

## Conclusão

A implementação está **completa e pronta para testes**. A estratégia conservadora (Opção B) permite testar as novas funcionalidades sem risco de quebrar o sistema atual.

**Próximos passos recomendados:**
1. Configurar Evolution API no VPS
2. Testar função `send_whatsapp` manualmente
3. Integrar `notify_escala_publicada_v2` no frontend
4. Fazer testes com usuários reais
5. Monitorar logs por alguns dias
6. Quando estável, considerar substituir funções originais

---

## Documentação Relacionada

- [ROADMAP.md](ROADMAP.md) - Roadmap completo do projeto
- [PLANO_MODIFICACAO_EDGE_FUNCTIONS.md](PLANO_MODIFICACAO_EDGE_FUNCTIONS.md) - Plano detalhado da implementação
- [Evolution API Docs](https://doc.evolution-api.com/) - Documentação oficial da Evolution API
