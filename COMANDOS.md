# IRIS Bot - Comandos Disponíveis

## 📋 Como Usar

O bot responde a mensagens que começam com o **prefixo** (padrão: `.`)

Exemplo: `.ping`

---

## 🤖 Comandos do Bot

| Comando | Descrição | Quem Pode Usar |
|---------|-----------|----------------|
| `.ping` | Testa se o bot está online | Todos |
| `.menu` | Mostra lista de comandos | Todos |
| `.help` | Same que .menu | Todos |
| `.info` | Info da instância (UUID, nome, admin) | Todos |
| `.prefix [novo]` | Mostra ou altera o prefixo | Admin only |
| `.self [on/off]` | Modo self (bot responde só pra admin) | Admin only |
| `.eval [código]` | Executa código JavaScript | Admin only |

---

## 📱 Exemplos de Uso

### Testar se está online
```
.ping
```
Resposta: `Pong! Estação IRIS Bot operando em plena capacidade.`

### Ver o menu
```
.menu
```

### Ver informações da instância
```
.info
```

### Alterar o prefixo (de . para !)
```
.prefix !
```

### Ativar modo self (só admin responde)
```
.self on
```

### Desativar modo self
```
.self off
```

---

## 🔧 Comandos Avançados (Admin)

### Executar JavaScript
```
.eval console.log("teste")
```

### Usar ">" como alternativa ao eval
```
> 2 + 2
```

---

## ⚠️ Limitações Atuais

O bot está com comandos básicos. Para adicionar mais funcionalidades:

1. **Arquivo principal:** `index.js` (linha 179-235)
2. **Estrutura:** cada comando é um `case` dentro do switch

### Para adicionar um novo comando:

Abra o `index.js` e adicione um novo case:

```javascript
case "dono":
    reply("Meu dono é: 551199999999");
    break;
```

---

## 📂 Onde Fica o Código

```
index.js              ← Comandos do bot (linha 179-235)
backend/src/          ← API do dashboard
instances/            ← Sessões de cada instância
```

---

## 💡 Dica: Prefixo Padrão

O prefixo padrão é `.` mas você pode mudar:

| Prefixo | Exemplo |
|---------|---------|
| `.` (padrão) | `.ping` |
| `!` | `!ping` |
| `/` | `/ping` |
| `#` | `#ping` |

Para mudar, envie no WhatsApp:
```
.prefix !
```
