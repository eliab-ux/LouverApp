# 🔐 Configuração de Reset de Senha no Supabase

## ✅ Funcionalidade Implementada

A funcionalidade "Esqueci minha senha" foi implementada no login! 🎉

### O que foi adicionado:
- ✅ Link "Esqueci minha senha" na tela de login
- ✅ Tela dedicada para recuperação de senha
- ✅ Envio de e-mail de recuperação via Supabase
- ✅ Validação de e-mail
- ✅ Mensagens de feedback amigáveis

---

## ⚙️ Configuração Necessária no Supabase

Para que a recuperação de senha funcione corretamente, você precisa configurar o Supabase:

### 1. **Acessar Dashboard do Supabase**
   - Vá em: https://supabase.com/dashboard
   - Selecione seu projeto: `LouvorApp`

### 2. **Configurar E-mail Templates**
   - No menu lateral → **Authentication** → **Email Templates**
   - Selecione **Reset Password**

### 3. **Template Padrão (já funciona)**
   O Supabase já tem um template padrão de reset de senha.
   O e-mail será enviado automaticamente com um link para resetar.

### 4. **Configurar URL de Redirecionamento (opcional)**
   - No menu lateral → **Authentication** → **URL Configuration**
   - Em **Site URL**, certifique-se que está: `http://localhost:5173`
   - Em **Redirect URLs**, adicione: `http://localhost:5173/reset-password`

---

## 🧪 Como Testar

### **Passo 1: Solicitar Reset**
1. Vá para a tela de login: http://localhost:5173
2. Clique em **"Esqueci minha senha"**
3. Digite seu **e-mail cadastrado**
4. Clique em **"Enviar e-mail de recuperação"**
5. Você verá: `"E-mail de recuperação enviado! Verifique sua caixa de entrada."`

### **Passo 2: Verificar E-mail**
1. Abra seu e-mail
2. Procure por e-mail do Supabase com assunto "Reset Your Password"
3. Clique no link "Reset Password"
4. Você será redirecionado para uma página do Supabase

### **Passo 3: Definir Nova Senha**
1. Na página do Supabase, digite sua **nova senha**
2. Confirme a nova senha
3. Clique em **"Update Password"**
4. Pronto! Senha alterada ✅

### **Passo 4: Fazer Login**
1. Volte para: http://localhost:5173
2. Faça login com seu e-mail e a **nova senha**
3. Sucesso! 🎉

---

## 📧 E-mail de Teste

Se você não recebeu o e-mail:

### **Verificar:**
- ✅ Pasta de Spam/Lixo Eletrônico
- ✅ E-mail está correto (sem erros de digitação)
- ✅ Conta de e-mail existe no sistema

### **Alternativa:**
Você pode visualizar os e-mails enviados no Supabase:
- Dashboard → **Authentication** → **Logs**
- Lá você verá todos os e-mails enviados

---

## 🎨 Interface Implementada

### **Tela de Login**
```
[ Entrar ] [ Criar conta ]

E-mail: _______________
Senha:  _______________

[    Entrar    ]
Esqueci minha senha  👈 NOVO!
```

### **Tela de Recuperação**
```
Recuperar Senha

Digite seu e-mail para receber
instruções de recuperação de senha.

E-mail: _______________

[ Enviar e-mail de recuperação ]

Voltar para o login
```

---

## 🔄 Fluxo Completo

```
1. Login → "Esqueci minha senha"
                ↓
2. Digite e-mail → Enviar
                ↓
3. Supabase envia e-mail
                ↓
4. Usuário clica no link do e-mail
                ↓
5. Página do Supabase para definir nova senha
                ↓
6. Usuário define nova senha
                ↓
7. Volta para o app → Faz login ✅
```

---

## 🆘 Troubleshooting

### **Não recebi o e-mail**
- Verifique se o e-mail existe no sistema
- Verifique a pasta de spam
- Aguarde alguns minutos (pode demorar)
- Tente solicitar novamente

### **Link expirou**
- Links de reset expiram após **1 hora**
- Solicite um novo e-mail de recuperação

### **Erro ao redefinir senha**
- Senha deve ter no mínimo **6 caracteres**
- Verifique se o link não expirou
- Tente solicitar novo link

---

## 🚀 Melhorias Futuras (Opcional)

- [ ] Criar página customizada `/reset-password` no app
- [ ] Customizar template de e-mail com logo da igreja
- [ ] Adicionar expiração visível do link (1h)
- [ ] Adicionar limite de tentativas (anti-spam)

---

**Status:** ✅ Funcionalidade implementada e pronta para uso!
