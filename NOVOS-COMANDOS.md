# IRIS Bot - Adicionar Novos Comandos

## 📍 Onde Editar

Arquivo: `index.js` (linha 179-235)

## 📝 Como Adicionar

Procure o `switch (command)` e adicione um novo `case`:

```javascript
case "comando":
    // sua lógica aqui
    reply("Resposta do comando");
    break;
```

---

## 🎯 Comandos Prontos para Copiar

### 1. Horário Atual
```javascript
case "hora":
case "horario":
    const agora = new Date();
    const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const data = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    reply(`🕐 *Horário Atual*\n\n${data}\n${hora}`);
    break;
```

### 2. Dono do Bot
```javascript
case "dono":
case "owner":
    reply(`👤 *Dono do Bot*\n\nNúmero: ${adminNumber}\nInstância: ${uuid}`);
    break;
```

### 3. Velocidade de Resposta
```javascript
case "speed":
case "velocidade":
    const start = Date.now();
    const msg = await sock.sendMessage(from, { text: "Calculando..." }, { quoted: msg });
    const end = Date.now();
    await sock.sendMessage(from, { text: `⚡ *Velocidade*\n\n${end - start}ms de resposta` }, { quoted: msg });
    break;
```

### 4. Sticker (imagem para figurinha)
```javascript
case "sticker":
case "fig":
    if (type !== 'imageMessage') return reply("Responda a uma imagem com .fig");
    const media = await downloadContentFromMessage(msg.message.imageMessage, 'image');
    let buffer = Buffer.from([]);
    for await (const chunk of media) buffer = Buffer.concat([buffer, chunk]);
    await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
    break;
```

### 5. Ping com Latência
```javascript
case "ping":
    const latency = Date.now() - msg.messageTimestamp * 1000;
    reply(`🏓 *Pong!\n\nLatência: ${latency}ms\nStatus: Online ✅`);
    break;
```

### 6. Grupo Info (se estiver em grupo)
```javascript
case "grupinfo":
case "groupinfo":
    if (!isGroup) return reply("Este comando só funciona em grupos.");
    const groupInfo = await sock.groupMetadata(from);
    reply(`👥 *Info do Grupo*\n\nNome: ${groupInfo.subject}\nMembros: ${groupInfo.participants.length}\nDono: ${groupInfo.owner || 'Desconhecido'}`);
    break;
```

### 7. Tag Todos (apenas admin)
```javascript
case "tagall":
case "marcar":
    if (!isOwner) return reply("Apenas o dono pode usar este comando.");
    if (!isGroup) return reply("Use este comando em grupo.");
    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    let mensagem = "📢 *Mensagem para todos*\n\n";
    participants.forEach(p => {
        mensagem += `@${p.id.split('@')[0]}\n`;
    });
    await sock.sendMessage(from, { text: mensagem, mentions: participants.map(p => p.id) }, { quoted: msg });
    break;
```

### 8. Sistema de Ban (apenas admin em grupo)
```javascript
case "ban":
case "kick":
    if (!isOwner) return reply("Apenas o dono pode banir.");
    if (!isGroup) return reply("Use em grupo.");
    const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return reply("Marque o usuário para banir.");
    await sock.groupParticipantsUpdate(from, [target], "remove");
    reply("✅ Usuário removido do grupo.");
    break;
```

### 9. Sistema de AFK
```javascript
case "afk":
    if (!q) return reply("Digite seu motivo AFK.");
    db.users[sender] = db.users[sender] || {};
    db.users[sender].afk = { reason: q, time: Date.now() };
    saveDatabase();
    reply(`😴 *AFK Ativado*\n\nMotivo: ${q}`);
    break;
```

---

## 🔧 Onde Colar no index.js

Abra o arquivo e procure por:

```javascript
switch (command) {
    case "ping":
        // ... código existente
        break;
```

Adicione os novos cases antes do `default:`.

---

## 📁 Estrutura do Arquivo

```
index.js
├── Configurações (linha 1-50)
├── Database (linha 45-65)
├── Conexão Baileys (linha 68-87)
├── Pareamento (linha 89-120)
├── Eventos (linha 122-148)
├── Comandos ← ESTÁ AQUI (linha 150-240)
└── Export (linha 242-255)
```
