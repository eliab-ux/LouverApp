# Plano de Modificação das Edge Functions para Suporte Multi-canal

## Resumo
Modificar as Edge Functions existentes (`notify_escala_publicada` e `remind_musicas_ministrantes`) para suportarem notificações via email E WhatsApp, baseado na preferência de cada usuário.

## Mudanças Necessárias

### 1. notify_escala_publicada

#### Mudanças no Input
**Antes:**
```typescript
interface EscaladoInfo {
  nome: string
  email: string
  funcao?: string
}
```

**Depois:**
```typescript
interface EscaladoInfo {
  id: string              // UUID do usuário (NOVO)
  nome: string
  email: string
  telefone?: string       // Telefone do usuário (NOVO)
  funcao?: string
  canal_notificacao: 'email' | 'whatsapp' | 'ambos'  // Preferência (NOVO)
}

interface NotifyPayload {
  evento: { ... }
  escalados: EscaladoInfo[]
  igreja_id: string       // ID da igreja (NOVO - necessário para WhatsApp)
  igreja_nome?: string
}
```

#### Lógica de Envio (NOVO)
```typescript
// Para cada escalado:
for (const escalado of escalados) {
  const promises = []

  // Se preferência incluir email
  if (escalado.canal_notificacao === 'email' || escalado.canal_notificacao === 'ambos') {
    promises.push(enviarEmail(escalado))
  }

  // Se preferência incluir WhatsApp E tem telefone
  if ((escalado.canal_notificacao === 'whatsapp' || escalado.canal_notificacao === 'ambos')
      && escalado.telefone) {
    promises.push(enviarWhatsApp(escalado))
  }

  await Promise.all(promises)
}
```

#### Função enviarWhatsApp (NOVA)
```typescript
async function enviarWhatsApp(escalado: EscaladoInfo, evento: Evento, igreja_id: string) {
  // Formatar mensagem de texto (sem HTML)
  const mensagem = `
📋 *Você foi escalado!*

Olá ${escalado.nome},

Você foi escalado para:

📅 ${tipoEvento}
📆 ${dataFormatada}
${evento.hora ? `🕐 ${evento.hora}` : ''}
${escalado.funcao ? `🎵 Função: ${escalado.funcao}` : ''}

Por favor, confirme sua disponibilidade com o líder do louvor.

_Mensagem automática do Louvor App_
  `.trim()

  // Chamar Edge Function send_whatsapp
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send_whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      phone: escalado.telefone,
      message: mensagem,
      igreja_id: igreja_id,
    }),
  })

  return response.ok
}
```

---

### 2. remind_musicas_ministrantes

**Mesmas mudanças da função anterior**, mas adaptadas para o contexto de "lembrete de escolher músicas".

#### Mensagem WhatsApp exemplo:
```
🎵 *Lembrete: Escolha as músicas*

Olá ${ministrante.nome},

Você está escalado como ministrante e ainda não escolheu as músicas.

📅 ${tipoEvento}
📆 ${dataFormatada}
${evento.hora ? `🕐 ${evento.hora}` : ''}

Por favor, acesse o sistema e escolha as músicas o quanto antes.

_Mensagem automática do Louvor App_
```

---

## Mudanças no Frontend (para chamar as funções corretamente)

### Local: src/pages/Escala/agenda/AgendaSection.tsx

**Antes (linha ~XXX):**
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

**Depois:**
```typescript
const { error } = await supabase.functions.invoke('notify_escala_publicada', {
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

**ATENÇÃO:** Isso requer que a query que busca os escalados também busque `telefone` e `canal_notificacao` da tabela `usuarios`.

---

## Impacto e Riscos

### ✅ Vantagens
- Notificações mais eficazes (WhatsApp tem taxa de abertura maior que email)
- Usuários escolhem como querem ser notificados
- Sistema flexível (pode usar ambos os canais)

### ⚠️ Riscos
- **PRODUÇÃO**: Mudança direta em produção pode causar problemas se houver erro
- **Dependência externa**: Se Evolution API estiver offline, notificações WhatsApp falham
- **Dados**: Precisa garantir que telefones estão no formato correto
- **Custo**: Cada mensagem WhatsApp pode ter custo (dependendo do provedor)

### 🛡️ Mitigações
1. **Fallback gracioso**: Se WhatsApp falhar, ainda envia email
2. **Logs detalhados**: Registrar todas as tentativas e falhas
3. **Validação**: Verificar formato do telefone antes de enviar
4. **Configuração por igreja**: Só envia WhatsApp se igreja tiver configurado

---

## Ordem de Execução Recomendada

1. ✅ **CONCLUÍDO** - Criar migration de suporte WhatsApp
2. ✅ **CONCLUÍDO** - Criar Edge Function `send_whatsapp`
3. ⏳ **PRÓXIMO** - Modificar `notify_escala_publicada`
4. ⏳ **DEPOIS** - Modificar `remind_musicas_ministrantes`
5. ⏳ **DEPOIS** - Atualizar Types TypeScript
6. ⏳ **DEPOIS** - Atualizar Frontend (MeuPerfil.tsx - seletor de canal)
7. ⏳ **DEPOIS** - Atualizar Frontend (DadosIgreja.tsx - config WhatsApp)
8. ⏳ **DEPOIS** - Atualizar Frontend (AgendaSection.tsx - passar dados adicionais)
9. ⏳ **FINAL** - Testar end-to-end em produção

---

## Alternativa Conservadora

Se preferir uma abordagem mais segura:

1. **Criar as funções novas SEM modificar as antigas** (com sufixo `_v2`)
2. **Testar as novas funções** com dados reais
3. **Quando confirmado funcionando**, substituir as antigas
4. **Manter as antigas como backup** por alguns dias

Exemplo:
- `notify_escala_publicada` → mantém funcionando só com email
- `notify_escala_publicada_v2` → nova versão com WhatsApp
- Depois de testar, renomear a v2 para substituir a original

---

## Decisão Necessária

**Você prefere:**

**Opção A) Modificar direto** - Alterar as funções existentes agora (mais rápido, mas mais arriscado)

**Opção B) Criar versões v2** - Criar novas funções e testar antes de substituir (mais lento, mas mais seguro)

**Opção C) Pausar implementação** - Fazer o resto do frontend primeiro e deixar as Edge Functions para depois

Qual opção você escolhe?
