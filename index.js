const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    getContentType,
    jidDecode,
    downloadContentFromMessage,
    Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FileType = require("file-type");

/**
 * ENGINE IRIS V2026 (sistema Unified)
 * Esta versão foi unificada para suportar o sistema Multi-Instância sem perder
 * as funcionalidades originais do bot singular.
 */
async function startInstance(config = {}) {
    // Configurações padrão ou injetadas pelo Manager
    const {
        uuid = "IRIS-CORE",
        botName = "IRIS",
        adminNumber: rawAdminNumber = "5511963239892",
        botNumber: rawBotNumber = "5511963239892",
        usePairingCode = true,
        prefix: defaultPrefix = "."
    } = config;

    // Normalização dos números
    const adminNumber = rawAdminNumber.endsWith('@s.whatsapp.net') ? rawAdminNumber : `${rawAdminNumber}@s.whatsapp.net`;
    const botNumber = rawBotNumber.replace(/\D/g, '');

    // Isolamento de Instância
    const baseDir = path.resolve(__dirname, "instances", uuid);
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    const authDir = path.join(baseDir, "auth");
    const dbFile = path.join(baseDir, "baileys_db.json");

    // Banco de Dados Local com Auto-Save
    let db = {
        users: {},
        groups: {},
        settings: {
            prefix: defaultPrefix,
            self: false,
            autoread: false,
            owner: adminNumber
        }
    };

    const loadDatabase = () => {
        if (fs.existsSync(dbFile)) {
            try { db = JSON.parse(fs.readFileSync(dbFile)); } catch (e) { }
        }
    };
    const saveDatabase = () => {
        try { fs.writeFileSync(dbFile, JSON.stringify(db, null, 2)); } catch (e) { }
    };

    loadDatabase();

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`\x1b[1;36m[IRIS] [${uuid}] Iniciando Motor Baileys...\x1b[0m`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: !usePairingCode,
        auth: state,
        browser: Browsers.ubuntu("Chrome"),
        syncFullHistory: false,
        qrTimeout: 120000,           // Estende o timeout do emparelhamento para 2 minutos (sem isso, ele matará a sessão em poucos decissegundos ou ms dependendo da versão)
        connectTimeoutMs: 120000,    // Aguarda o Node do Whatsapp Web estabilizar por 2 minutos
        keepAliveIntervalMs: 30000,  // Intervalo de PING para manter o socket abertíssimo
        defaultQueryTimeoutMs: 60000,
        getMessage: async (key) => {
            return { conversation: "Bot Engine Ready" };
        },
    });

    // Sistema de Pareamento  (Emite eventos compatíveis com o Manager)
    if (usePairingCode && !sock.authState.creds.registered && !config.disableAutoPairing) {
        let codeRequested = false;
        sock.ev.on('connection.update', (update) => {
            if (codeRequested) return;

            // O socket está 100% pronto para gerar código de pareamento logo após o servidor disparar o payload do QR
            // O update traz update.qr quando a conexão base foi finalizada e aberta
            if (update.qr !== undefined || update.connection === 'open') {
                codeRequested = true;

                const requestPairing = async (retries = 0) => {
                    try {
                        await new Promise(r => setTimeout(r, 1500)); // Pequena pausa pra garantir sincronismo no node
                        const code = await sock.requestPairingCode(botNumber);
                        console.log(`\n\x1b[1;33m[PAIRING] [${uuid}] CÓDIGO gerado com sucesso: ${code}\x1b[0m\n`);
                        // Sinaliza ao Manager que o código está pronto
                        sock.ev.emit("connection.update", { pairingCode: code });
                    } catch (err) {
                        console.error(`[IRIS] [${uuid}] Erro ao gerar pairing code (Tentativa ${retries + 1}):`, err.message);
                        if (retries < 6) {
                            setTimeout(() => requestPairing(retries + 1), 3000); // Tentar denovo
                        } else {
                            sock.ev.emit("connection.update", { pairingCodeError: err });
                        }
                    }
                };

                requestPairing();
            }
        });
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === "open") {
            console.log(`\x1b[1;32m[IRIS] [${uuid}] CONECTADO COM SUCESSO!\x1b[0m`);
            sock.ev.emit("status", { status: "CONNECTED" });

            // Mensagem de ativação ao admin
            await sock.sendMessage(adminNumber, { text: `✅ *IRIS Bot ATIVADA*\nInstância: ${uuid}\nStatus: Online` }).catch(() => { });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ?
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;

            console.log(`\x1b[1;31m[IRIS] [${uuid}] Conexão fechada. Reconectando: ${shouldReconnect}\x1b[0m`);
            sock.ev.emit("status", { status: "DISCONNECTED" });

            if (shouldReconnect && !config.isManaged) {
                setTimeout(() => startInstance(config), 5000);
            } else if (shouldReconnect && config.isManaged) {
                sock.ev.emit("connection.update", { reconnect: true });
            }
        }
    });

    // Handler Coletivo de Mensagens - Comandos do Usuário
    sock.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

            const from = msg.key.remoteJid;
            const type = getContentType(msg.message);
            const pushname = msg.pushName || "Usuário";
            const isGroup = from.endsWith("@g.us");
            const sender = isGroup ? msg.key.participant : from;
            const isMe = msg.key.fromMe;

            const body = (type === "conversation") ? msg.message.conversation :
                (type === "extendedTextMessage") ? msg.message.extendedTextMessage.text :
                    (type === "imageMessage") ? msg.message.imageMessage.caption :
                        (type === "videoMessage") ? msg.message.videoMessage.caption : "";

            const prefix = db.settings.prefix || defaultPrefix;
            if (!body.startsWith(prefix)) return;

            const args = body.trim().split(/ +/).slice(1);
            const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();
            const q = args.join(" ");
            const isOwner = sender.includes(rawAdminNumber) || isMe;

            const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

            // Comandos Preservados do IRIS Original
            switch (command) {
                case "ping":
                    reply("Pong! Estação IRIS Bot operando em plena capacidade.");
                    break;
                case "menu":
                case "help":
                    let textMenu = `╭─── 「 *IRIS Bot* 」 ───\n`;
                    textMenu += `│ Olá, ${pushname}!\n`;
                    textMenu += `│ Instância: ${uuid}\n`;
                    textMenu += `│ Prefixo: [ ${prefix} ]\n`;
                    textMenu += `├───────────────────\n`;
                    textMenu += `│ .ping\n`;
                    textMenu += `│ .info\n`;
                    textMenu += `│ .self (on/off)\n`;
                    textMenu += `│ .prefix (novo)\n`;
                    textMenu += `│ .eval (código)\n`;
                    textMenu += `╰───────────────────`;
                    reply(textMenu);
                    break;
                case "info":
                    reply(`*Status da Instância*\n\nUUID: ${uuid}\nBot: ${botName}\nAdmin: ${adminNumber}\nGrupos: ${isGroup ? 'Sim' : 'Não'}`);
                    break;
                case "prefix":
                    if (!isOwner) return reply("Acesso negado.");
                    if (!q) return reply(`Prefixo atual: ${prefix}`);
                    db.settings.prefix = q;
                    saveDatabase();
                    reply(`Prefixo alterado para: ${q}`);
                    break;
                case "self":
                    if (!isOwner) return reply("Acesso negado.");
                    if (!q) return reply(`Modo Self: ${db.settings.self ? 'Ativado' : 'Desativado'}`);
                    db.settings.self = (q === "on" || q === "true");
                    saveDatabase();
                    reply(`Modo Self ${db.settings.self ? 'Ativado' : 'Desativado'}`);
                    break;
                case "eval":
                    if (!isOwner) return;
                    try {
                        let evaled = await eval(q);
                        if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
                        reply(evaled);
                    } catch (err) {
                        reply(String(err));
                    }
                    break;
                default:
                    if (isOwner && body.startsWith(">")) {
                        try {
                            let evaled = await eval(body.slice(1));
                            if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
                            reply(evaled);
                        } catch (err) {
                            reply(String(err));
                        }
                    }
            }

        } catch (e) {
            console.error(`[IRIS] [${uuid}] Erro m.upsert:`, e.stack);
        }
    });

    return sock;
}

// Inicia se rodar diretamente
if (require.main === module) {
    require('dotenv').config();
    startInstance({
        uuid: process.env.IRIS_UUID || "MAIN",
        botNumber: process.env.BOT_NUMBER,
        adminNumber: process.env.ADMIN_NUMBER
    });
}

module.exports = { startInstance };
