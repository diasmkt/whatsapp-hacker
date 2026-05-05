# WWP Bot (IRIS) - Sistema de Autenticação

## 🗄️ Banco de Dados Local

O sistema usa **PostgreSQL** local via Docker, com todas as contas salvas no banco.

### Credenciais de Acesso

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | admin@irisbot.com | admin123 |
| **Cliente** | cliente@teste.com | cliente123 |

### Comandos Úteis

```bash
# Rodar o seed (criar usuários)
npm run seed

# Ver o banco no browser
npm run db:studio

# Push das migrations
npm run db:push
```

## 🚀 Deploy no Render

### 1. Preparar o Banco de Dados

Crie um banco PostgreSQL no Render (ou use Supabase Neon free tier):

```
Render Dashboard → New → PostgreSQL
- Name: wwp-postgres
- Database: wwp_saas
- User: wwp_user
```

### 2. Configurar Variáveis de Ambiente

No Render, adicione:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=<gere-um-seguro-aqui>
DATABASE_URL=<url-do-banco-render>
NEXT_PUBLIC_API_URL=https://seu-app.onrender.com
```

### 3. Configurar o Serviço

No Render Dashboard:

1. **New → Web Service**
2. Conecte o repositório do GitHub
3. Configure:
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start`
4. Adicione o comando de seed no build (opcional)

### 4. Após o Deploy

Acesse `https://seu-app.onrender.com` e faça login com:
- Email: admin@irisbot.com
- Senha: admin123

⚠️ **Mude a senha do admin após o primeiro login!**

## 📁 Estrutura

```
├── app/                    # Frontend Next.js
│   ├── login/             # Página de login
│   ├── dashboard/         # Dashboard principal
│   └── admin/             # Área admin
├── backend/               # API Express
│   └── src/
│       ├── server.js      # Servidor principal
│       ├── auth.js        # Autenticação JWT
│       └── bot-manager.js # Gerenciador de bots
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   └── seed.js            # Script de seeding
├── docker-compose.yml     # PostgreSQL local
└── .env                   # Configurações
```
