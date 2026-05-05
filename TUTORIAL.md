# IRIS Bot - Guia Rápido de Início

## 📦 Configuração Inicial (Uma vez só)

```bash
# Entre na pasta do projeto
cd wwp-bot-unified

# Instale as dependências
npm install

# Crie o banco de dados SQLite (arquivo local)
npx prisma db push

# Crie os usuários iniciais
npm run seed
```

## ▶️ Como Rodar

```bash
# Iniciar tudo de uma vez
npm run dev

# OU iniciar separadamente:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run start
```

## 🌐 Acessar

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## 🔑 Login

| Usuário | Email | Senha |
|---------|-------|-------|
| Admin | admin@irisbot.com | admin123 |
| Teste | cliente@teste.com | cliente123 |

## 📱 Conectar WhatsApp

### QR Code
1. Dashboard → Criar Instância → Tipo: QR CODE
2. Clique em "Iniciar Instância"
3. Escaneie o QR com WhatsApp

### Código (Recomendado)
1. Dashboard → Criar Instância → Tipo: CODE
2. Insira o número do bot (ex: 5511999999999)
3. Clique em "Gerar Código"
4. No WhatsApp: Aparelhos conectados → Conectar aparelho → Código de 8 dígitos

## ⚠️ Problemas Comuns

| Problema | Solução |
|----------|---------|
| Código expirou | Clique em "Gerar Código" novamente |
| Fica em "awaiting_pairing" | Aguarde 30s ou clique em "Parar" e tente de novo |
| Não conecta | Verifique se o número está correto (com DDD) |

## 🔧 Comandos Úteis

```bash
npm run seed      # Recriar usuários
npm run db:push   # Atualizar banco
npm run db:studio # Ver banco no navegador
```
