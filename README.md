# IRIS Bot - WhatsApp Automation Engine

## 📋 Pré-requisitos

- Node.js 18+ instalado
- NPM ou Yarn

## 🚀 Instalação Rápida

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd wwp-bot-unified

# 2. Instale as dependências
npm install

# 3. Configure o banco SQLite (já configurado por padrão)
# O arquivo .env já está pronto para uso local

# 4. Crie o banco de dados
npx prisma db push

# 5. Crie os usuários iniciais
npm run seed
```

## ▶️ Como Rodar

```bash
# Iniciar tudo (Frontend + Backend)
npm run dev

# Ou iniciar separadamente:
npm run server    # Backend na porta 3001
npm run start     # Frontend na porta 3000
```

## 🔑 Login Inicial

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@irisbot.com | admin123 |
| Cliente | cliente@teste.com | cliente123 |

## 📱 Como Conectar WhatsApp

### Método 1: QR Code
1. Crie uma instância no dashboard
2. Clique em "Iniciar"
3. Escaneie o QR Code com o WhatsApp

### Método 2: Código de Pareamento
1. Crie uma instância selecionando "CODE"
2. Insira o número do bot (com DDD, ex: 5511999999999)
3. O código aparecerá na tela
4. No WhatsApp: Aparelhos conectados → Conectar aparelho → Insira o código

## 🔧 Comandos Úteis

```bash
npm run seed         # Criar usuários iniciais
npm run db:push      # Atualizar banco
npm run db:studio    # Ver banco no navegador
```

## 📁 Estrutura do Projeto

```
├── app/              # Frontend Next.js
│   ├── login/       # Página de login
│   └── dashboard/   # Painel principal
├── backend/         # API Express
│   └── src/
│       ├── server.js
│       ├── auth.js
│       └── bot-manager.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
└── .env             # Configurações
```
