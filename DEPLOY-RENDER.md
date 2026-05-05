# Deploy no Render (Grátis)

## 1. Prepare o GitHub

```bash
# Entre na pasta do projeto
cd wwp-bot-unified

# Inicialize o git (se não tiver)
git init
git add .
git commit -m "IRIS Bot - Ready for deploy"

# Crie um repositório no GitHub e faça push
git remote add origin https://github.com/seu-usuario/wwp-bot.git
git push -u origin main
```

## 2. Crie o Serviço no Render

1. Acesse https://dashboard.render.com
2. Clique em **New +** → **Web Service**
3. Conecte seu repositório do GitHub
4. Configure:

| Campo | Valor |
|-------|-------|
| Name | wwp-bot |
| Region | Oregon (ou mais próximo) |
| Branch | main |
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npx prisma db push && npm run seed && npm run build` |
| Start Command | `npm run start` |

## 3. Variáveis de Ambiente

Adicione em **Environment**:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=coloque-aqui-uma-senha-super-secreta-randomica
DATABASE_URL=file:./prisma/dev.db
NEXT_PUBLIC_API_URL=https://wwp-bot.onrender.com
```

⚠️ **Atenção:** O SQLite no Render é efêmero (reseta a cada deploy). Para dados persistentes, use o PostgreSQL do Render (tem free tier de 90 dias) ou SQLite externo.

## 4. Alternativa: SQLite Persistente

Para manter o banco persistente no Render gratuito, configure um volume:

1. No serviço, vá em **Disks**
2. Crie um disco de 1GB
3. Monte em `/data`
4. Mude o `DATABASE_URL` para: `file:/data/prisma/dev.db`

## 5. Deploy

1. Clique em **Create Web Service**
2. Aguarde o build (2-3 minutos)
3. Acesse sua URL: `https://wwp-bot.onrender.com`

## 6. Primeiro Acesso

1. Acesse a URL do deploy
2. Login: admin@irisbot.com / admin123
3. **Mude a senha imediatamente!**

## ⚠️ Limitações do Render Gratuito

- Servidor dorme após 15 min sem acesso
- Build limitado a 500min/mês
- Primeira requisição após dormir leva ~30s

## 🔧 Se o Build Falhar

Verifique os logs no Render. Erros comuns:
- Falta de `npx prisma generate` no build
- Versão do Node incompatível (use 18+)
- Falta de variáveis de ambiente
