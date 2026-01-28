# LouvorApp - Roadmap de Desenvolvimento

## FASE 1 - Sistema Base ✅ (Concluído)

### Funcionalidades Implementadas:
- ✅ Autenticação e autorização (Admin, Líder, Membro)
- ✅ Gestão de igrejas (multi-tenant)
- ✅ Cadastro de músicas com categorias, estilos e momentos
- ✅ Importação de músicas via CSV
- ✅ Gestão de membros e funções
- ✅ Criação de eventos (cultos, ensaios)
- ✅ Escalas de louvor
- ✅ Controle de indisponibilidades
- ✅ Notificações por email (Resend API)
  - Publicação de escalas
  - Lembretes automáticos para adicionar músicas
- ✅ Configuração de notificações por igreja
- ✅ Dashboard com visão geral

### Tecnologias:
- React 19 + TypeScript
- Ionic React 8
- Vite
- TailwindCSS 4
- Supabase (PostgreSQL + Auth + Edge Functions)
- Resend API (emails)

---

## FASE 2 - Notificações WhatsApp 📋 (Planejado)

> **Status:** Plano completo, aguardando implementação
> **Estimativa:** 11-13 horas
> **Documento:** Ver arquivo `C:\Users\jose.caetano\.claude\plans\plano-fase2-LouvorApp.md`

### Objetivo:
Implementar sistema de notificações via WhatsApp com fallback automático para email, permitindo que cada igreja configure seu próprio número WhatsApp.

### Principais Funcionalidades:
- 🎯 Integração com Evolution API (self-hosted)
- 🎯 Configuração WhatsApp por igreja (multi-tenant)
- 🎯 Notificações via WhatsApp com fallback para email
- 🎯 Preferências de canal por usuário (email, WhatsApp ou ambos)
- 🎯 Painel de configuração WhatsApp em "Dados da Igreja"
- 🎯 Logs de notificações por canal

### Arquitetura:
- **Evolution API** rodando na VPS (Docker)
- Cada igreja tem sua própria instância WhatsApp
- Edge Functions modificadas para suportar multi-canal
- Nova Edge Function `send_whatsapp`

### Quando Implementar:
Este plano está pronto para execução. Consulte o documento completo para:
- Setup da Evolution API na VPS
- Migrations do banco de dados
- Código das Edge Functions
- Alterações no frontend
- Checklist de implementação

---

## FASE 3 - Melhorias Futuras 💡 (A Definir)

Ideias para próximas fases:
- [ ] App mobile nativo (iOS/Android)
- [ ] Geração automática de setlists
- [ ] Integração com plataformas de streaming (Spotify, YouTube)
- [ ] Biblioteca de cifras e letras
- [ ] Histórico de músicas mais tocadas
- [ ] Sugestões de músicas por IA baseadas no momento do culto
- [ ] Relatórios e estatísticas
- [ ] Ensaios virtuais com compartilhamento de áudio
- [ ] Sistema de votação para escolha de músicas

---

## Como Usar Este Roadmap

1. **FASE 1** está implementada e em produção
2. **FASE 2** tem plano completo e detalhado - quando for implementar, consulte o documento do plano
3. **FASE 3** e demais fases serão definidas conforme necessidade

---

**Última atualização:** 30/12/2024
