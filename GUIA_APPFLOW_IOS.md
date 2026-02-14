# 📱 GUIA COMPLETO: Build iOS com Ionic Appflow

Este guia te levará do zero até ter seu app **Louvor APP** publicado na App Store usando Ionic Appflow.

---

## 📋 PRÉ-REQUISITOS

Antes de começar, você precisa ter:

- ✅ **Conta Apple Developer** (você já tem!)
- ✅ **Repositório Git** (GitHub, GitLab ou Bitbucket)
- ✅ **Certificados iOS** (vamos criar juntos)
- ✅ **Cartão de crédito** (para trial de 14 dias do Appflow)

---

## PARTE 1: PREPARAR O PROJETO (10 minutos)

### Passo 1: Sincronizar o projeto iOS

No terminal do seu projeto, execute:

```bash
npm run ios:prepare
```

Este comando irá:
- Fazer build do projeto web (Vite)
- Sincronizar o código com a pasta `ios/`
- Atualizar plugins do Capacitor

### Passo 2: Verificar se está tudo OK

```bash
# Verificar se a pasta ios foi atualizada
ls -la ios/App/App/

# Você deve ver os arquivos nativos iOS
```

### Passo 3: Fazer commit e push para o Git

```bash
git add .
git commit -m "chore: preparar projeto para build iOS com Appflow"
git push origin main
```

⚠️ **IMPORTANTE:** Seu código precisa estar em um repositório Git remoto (GitHub, GitLab, etc).

---

## PARTE 2: CONFIGURAR IONIC APPFLOW (15 minutos)

### Passo 1: Criar conta no Ionic Appflow

1. Acesse: https://ionic.io/appflow
2. Clique em **"Start Free Trial"**
3. Crie uma conta (pode usar Google/GitHub)
4. Escolha o plano **"Trial"** (14 dias grátis)

### Passo 2: Conectar seu repositório

1. No dashboard do Appflow, clique em **"New App"**
2. Escolha **"Connect to a Git Host"**
3. Selecione onde está seu código:
   - **GitHub** (recomendado)
   - GitLab
   - Bitbucket
   - Azure DevOps
4. Autorize o Appflow a acessar seus repositórios
5. Selecione o repositório **LouvorApp-New**
6. Clique em **"Connect"**

### Passo 3: Configurar o projeto

Após conectar, o Appflow irá detectar automaticamente:
- ✅ Que é um projeto Ionic
- ✅ Que usa Capacitor
- ✅ Que tem suporte iOS

Se pedir para confirmar:
- **App Name:** Louvor APP
- **App ID:** com.louvorapp.psi
- **Framework:** Ionic React
- **Capacitor:** Yes

---

## PARTE 3: CERTIFICADOS iOS (30-40 minutos)

Esta é a parte mais importante! Você precisa de:

1. **iOS Development Certificate** (para testar)
2. **iOS Distribution Certificate** (para publicar na App Store)
3. **Provisioning Profile** (perfil de provisionamento)

### Opção A: Deixar o Appflow criar automaticamente (RECOMENDADO)

O Appflow pode criar tudo automaticamente para você!

1. No Appflow, vá em **Settings → Certificates**
2. Clique em **"iOS Certificates"**
3. Clique em **"Generate Credentials"**
4. Faça login com sua **Apple ID do Developer Program**
5. O Appflow irá:
   - Criar os certificados
   - Criar o App ID na Apple
   - Criar os Provisioning Profiles
   - Armazenar tudo de forma segura

### Opção B: Criar manualmente (mais trabalhoso)

Se preferir criar você mesmo:

1. Acesse: https://developer.apple.com
2. Vá em **Certificates, Identifiers & Profiles**
3. Crie um **App ID**:
   - Bundle ID: `com.louvorapp.psi`
   - Description: Louvor APP
4. Crie um **Certificate**:
   - iOS Distribution (para App Store)
5. Crie um **Provisioning Profile**:
   - Type: App Store
   - Vincule ao App ID e Certificate
6. Baixe os arquivos (.p12 e .mobileprovision)
7. No Appflow, faça upload em **Settings → Certificates**

---

## PARTE 4: FAZER O PRIMEIRO BUILD (10 minutos)

### Passo 1: Configurar o Build

1. No Appflow, vá na aba **"Builds"**
2. Clique em **"New Build"**
3. Configure:
   - **Commit:** Latest (main)
   - **Target Platform:** iOS
   - **Build Type:**
     - **Development** (para testar no seu iPhone)
     - **App Store** (para publicar)
   - **Build Stack:** Escolha a versão mais recente
   - **Xcode Version:** 15.x (mais recente)

### Passo 2: Configurações Avançadas (opcional)

Expanda **"Advanced Options"** se quiser:
- Definir variáveis de ambiente (ex: `VITE_SUPABASE_URL`)
- Customizar comandos de build
- Adicionar scripts pré/pós build

**Para seu projeto, adicione as variáveis:**

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### Passo 3: Iniciar o Build

1. Clique em **"Start Build"**
2. Aguarde (leva de 5 a 15 minutos)
3. Você verá os logs em tempo real

### Passo 4: Download do .ipa

Quando o build terminar com sucesso:
1. Clique no build na lista
2. Baixe o arquivo **.ipa**
3. Você também verá um **QR Code** para instalar direto no iPhone (se for Development build)

---

## PARTE 5: TESTAR NO IPHONE (apenas Development build)

Se você fez um **Development Build**:

1. Instale o app **Ionic Appflow** no seu iPhone (App Store)
2. Escaneie o QR Code que aparece no build
3. O app será instalado no seu iPhone
4. Teste todas as funcionalidades

---

## PARTE 6: PUBLICAR NA APP STORE

### Passo 1: Fazer Build de Produção

1. No Appflow, crie um novo build
2. Escolha **"App Store"** como tipo
3. Aguarde o build terminar

### Passo 2: Fazer Upload para App Store Connect

#### Opção A: Deixar o Appflow fazer (mais fácil)

1. No build concluído, clique em **"Deploy to App Store"**
2. Faça login com sua Apple ID
3. O Appflow fará upload automaticamente

#### Opção B: Upload manual via Transporter

1. Baixe o arquivo **.ipa**
2. Baixe o app **Transporter** (Mac App Store ou Windows)
3. Arraste o .ipa para o Transporter
4. Clique em **"Deliver"**

### Passo 3: Configurar no App Store Connect

1. Acesse: https://appstoreconnect.apple.com
2. Clique em **"My Apps"** → **"+"** → **"New App"**
3. Preencha:
   - **Platform:** iOS
   - **Name:** Louvor APP
   - **Primary Language:** Português (Brasil)
   - **Bundle ID:** com.louvorapp.psi
   - **SKU:** louvorapp-001
4. Preencha as informações obrigatórias:
   - Screenshots (pelo menos 2 - iPhone 6.7" e 5.5")
   - Description (descrição do app)
   - Keywords (palavras-chave)
   - Support URL
   - Privacy Policy URL
   - Category (Productivity ou Music)
5. Na seção **"Build"**, selecione o build que você enviou
6. Clique em **"Submit for Review"**

### Passo 4: Aguardar aprovação da Apple

- Demora de 1 a 3 dias úteis
- Você receberá emails sobre o status
- Se rejeitado, ajuste e reenvie

---

## 🎯 COMANDOS ÚTEIS

```bash
# Sincronizar código web → iOS
npm run ios:prepare

# Apenas sincronizar (sem rebuild)
npm run cap:sync:ios

# Fazer build local (se tiver Mac)
npm run cap:open:ios
```

---

## ⚠️ PROBLEMAS COMUNS

### 1. Build falha com erro de certificado

**Solução:** Verifique se os certificados estão válidos e não expiraram.

### 2. "Missing compliance" ao enviar para App Store

**Solução:** No App Store Connect, responda o questionário sobre criptografia:
- O app usa HTTPS? Sim
- Adiciona criptografia? Não (apenas usa a do iOS)

### 3. Variáveis de ambiente não funcionam

**Solução:** No Appflow, vá em **Settings → Environments** e adicione as variáveis lá.

### 4. App abre tela branca no iPhone

**Solução:**
- Verifique se rodou `npm run ios:prepare` antes do build
- Verifique se o `webDir` no capacitor.config.ts está correto (dist)

---

## 📊 MONITORAMENTO DE BUILDS

- Appflow mantém histórico de todos os builds
- Você pode comparar builds
- Ver logs detalhados
- Download de .ipa a qualquer momento

---

## 💰 APÓS O TRIAL (14 dias)

Quando o trial acabar, você precisará escolher:

1. **Continuar com Appflow** ($29/mês Starter ou $99/mês Growth)
2. **Migrar para alternativa gratuita** (Codemagic, GitHub Actions)
3. **Comprar um Mac** (para fazer builds localmente)

---

## 🎓 PRÓXIMOS PASSOS

Depois que tudo estiver funcionando:

1. Configure **Deploy Automático** (quando der push, faz build automaticamente)
2. Configure **Live Updates** (atualizar app sem enviar para App Store)
3. Configure **Notificações** para builds concluídos
4. Configure **Webhooks** para integrar com outros serviços

---

## 📚 RECURSOS ÚTEIS

- Documentação Appflow: https://ionic.io/docs/appflow
- Capacitor iOS: https://capacitorjs.com/docs/ios
- App Store Connect: https://appstoreconnect.apple.com
- Apple Developer: https://developer.apple.com

---

## 🆘 PRECISA DE AJUDA?

Se tiver problemas em qualquer etapa, me chame! Estou aqui para ajudar. 😊

---

**Boa sorte com o build!** 🚀
