const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");
const prisma = require("./db");

// CARREGAMENTO LAZY: O runtime Baileys só será carregado se não estivermos na Vercel
let startInstance = null;

/**
 * PRODUCTION BOT MANAGER - ARCHITECTURE V11 (SERVERLESS COMPATIBLE)
 * Gerencia o ciclo de vida de múltiplas instâncias com separação total da camada persistente.
 */
class BotManager extends EventEmitter {
    constructor() {
        super();
        this.activeNodes = new Map(); // instanceId -> { sock, status }
        this.bootLocks = new Set();
        this.prisma = prisma;
        this.isServerless = process.env.VERCEL === '1';

        // Em Vercel, o diretório de instâncias é apenas o /tmp
        this.instancesRootDir = this.isServerless
            ? path.join("/tmp", "instances")
            : path.resolve(__dirname, "..", "instances");

        if (!this.isServerless && !fs.existsSync(this.instancesRootDir)) {
            fs.mkdirSync(this.instancesRootDir, { recursive: true });
        }
    }

    async init() {
        if (this.isServerless) {
            console.log("[MANAGER] [Vercel] Skipping auto-restore (Serverless Mode).");
            return;
        }

        console.log("\n[SYSTEM] [BOOT] Restaurando instâncias configuradas...");
        const instances = await this.prisma.instance.findMany({
            where: { status: "active" },
            include: { user: { include: { licenses: true } } }
        });

        for (const inst of instances) {
            const license = inst.user.licenses.find(l => l.status === "ACTIVE" && (!l.expiresAt || l.expiresAt > new Date()));
            if (license) {
                this.startBot(inst.id).catch(e => console.error(`[RESTORE_ERR] [${inst.id}]`, e.message));
            } else {
                await this.prisma.instance.update({ where: { id: inst.id }, data: { status: "inactive" } });
            }
        }
    }

    async startBot(instanceId) {
        if (this.isServerless) {
            console.log(`[MANAGER] [${instanceId}] [Vercel] Sinalizando início para VPS externo.`);
            await this.prisma.instance.update({
                where: { id: instanceId },
                data: { connection: "INITIALIZING", status: "active" }
            }).catch(() => { });
            return;
        }

        if (this.bootLocks.has(instanceId)) return;
        const existingNode = this.activeNodes.get(instanceId);
        if (existingNode && existingNode.status === 'CONNECTED') return;

        this.bootLocks.add(instanceId);

        return new Promise(async (resolve, reject) => {
            try {
                const instance = await this.prisma.instance.findUnique({
                    where: { id: instanceId }
                });

                if (!instance) throw new Error("Instância inexistente.");

                if (!startInstance) {
                    const legacy = require("../../index");
                    startInstance = legacy.startInstance;
                }

                const config = {
                    uuid: instanceId,
                    botName: instance.name || "IRIS",
                    adminNumber: instance.adminNumber,
                    botNumber: instance.botNumber,
                    usePairingCode: instance.pairingType === "CODE",
                    prefix: "."
                };

                console.log(`[MANAGER] [${instanceId}] Disparando Runtime V10 (Persistente)...`);
                const sock = await startInstance(config);

                this.activeNodes.set(instanceId, { sock, status: 'CONNECTING' });

                let isResolved = false;

                sock.ev.on("connection.update", async (update) => {
                    const { connection, lastDisconnect, qr, pairingCode } = update;

                    console.log(`[STATE_CHANGE] [${instanceId}] => connection: ${connection || 'N/A'}, qr: ${!!qr}, pairingCode: ${!!pairingCode}`);

                    if (qr) {
                        this.emit("qr", { instanceId, qr });
                        await this.prisma.instance.update({ where: { id: instanceId }, data: { connection: "AWAITING_QR", lastQR: qr, pairingCode: null } }).catch(() => { });
                        if (!isResolved) { isResolved = true; resolve({ status: 'awaiting_qr' }); }
                    }

                    if (pairingCode) {
                        this.emit("status", { instanceId, status: "PAIRING", pairingCode });
                        await this.prisma.instance.update({ where: { id: instanceId }, data: { connection: "AWAITING_PAIRING", pairingCode, lastQR: null } }).catch(() => { });
                        if (!isResolved) { isResolved = true; resolve({ status: 'awaiting_pairing', pairingCode }); }
                    }

                    if (connection === "open") {
                        console.log(`🟢 [CONNECTED] [${instanceId}] Successfully connected and routing active`);
                        this.emit("status", { instanceId, status: "CONNECTED" });
                        this.activeNodes.set(instanceId, { sock, status: 'CONNECTED' });
                        await this.prisma.instance.update({
                            where: { id: instanceId },
                            data: { connection: "CONNECTED", status: "active", lastQR: null, pairingCode: null, connectedAt: new Date() }
                        }).catch(() => { });

                        // Send connect notification
                        try {
                            const ownerPhone = instance.adminNumber || instance.botNumber;
                            const ph = ownerPhone.includes('@s.whatsapp.net') ? ownerPhone : `${ownerPhone.replace(/\D/g, '')}@s.whatsapp.net`;
                            const msg = `✅ *IRIS Bot conectado com sucesso!*\n📱 Instância: ${instance.name || instanceId}\n🕐 ${new Date().toLocaleString()}\n\nSeu bot está ativo e pronto para receber mensagens.`;
                            await sock.sendMessage(ph, { text: msg });
                        } catch (err) {
                            console.log(`[NOTIFY_ERR] [${instanceId}] Could not send connected notification.`);
                        }

                        if (!isResolved) { isResolved = true; resolve({ status: 'connected' }); }
                    }

                    if (connection === "close") {
                        console.log(`🔴 [DISCONNECTED] [${instanceId}] Instance lost connection or graceful close`);
                        this.activeNodes.delete(instanceId);
                        this.emit("status", { instanceId, status: "DISCONNECTED" });
                        await this.prisma.instance.update({
                            where: { id: instanceId },
                            data: { connection: "DISCONNECTED", status: "inactive" }
                        }).catch(() => { });

                        // Try to send disconnect notification (might fail if truly disconnected, but we try)
                        try {
                            const ownerPhone = instance.adminNumber || instance.botNumber;
                            const ph = ownerPhone.includes('@s.whatsapp.net') ? ownerPhone : `${ownerPhone.replace(/\D/g, '')}@s.whatsapp.net`;
                            const msg = `⚠️ *IRIS Bot desconectado!*\n📱 Instância: ${instance.name || instanceId}\n🕐 ${new Date().toLocaleString()}\n\nAcesse o painel para reconectar.`;
                            await sock.sendMessage(ph, { text: msg });
                        } catch (err) {
                            console.log(`[NOTIFY_ERR] [${instanceId}] Could not send disconnect notification.`);
                        }

                        if (!isResolved) { isResolved = true; resolve({ status: 'disconnected' }); }
                    }
                });

                sock.ev.on("status", (data) => this.emit("status", { instanceId, ...data }));

            } catch (e) {
                console.error(`[MANAGER_ERR] [${instanceId}]`, e.stack);
                reject(e);
            } finally {
                this.bootLocks.delete(instanceId);
            }
        });
    }

    async requestPairingCode(instanceId, rawPhoneNumber) {
        let node = this.activeNodes.get(instanceId);

        // Limpar número (B)
        const phoneNumber = rawPhoneNumber.replace(/\D/g, '').replace(/^0+/, '');
        console.log('[PAIRING] Número formatado:', phoneNumber);

        // Limpar sessão antiga (D)
        const sessionPath = path.resolve(this.instancesRootDir, instanceId, "auth");
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('[PAIRING] Sessão antiga removida:', sessionPath);
        }

        // Restart the socket mechanism implicitly to get a fresh connection for pairing
        await this.stopBot(instanceId);

        // Wait a slight moment before creating a new socket to avoid conflict
        await new Promise(r => setTimeout(r, 1000));

        // Generate config manually or fetch from DB
        const instance = await this.prisma.instance.findUnique({ where: { id: instanceId } });
        if (!instance) throw new Error("Instância não encontrada para gerar código.");

        if (!startInstance) {
            const legacy = require("../../index");
            startInstance = legacy.startInstance;
        }

        const config = {
            uuid: instanceId,
            botName: instance.name || "IRIS",
            adminNumber: instance.adminNumber,
            botNumber: phoneNumber, // Update to the requested phone number
            usePairingCode: true,
            disableAutoPairing: true, // Geraremos o código AQUI com retentativas ultracontroladas
            isManaged: true, // Avisa à Engine base para não orquestrar loops recursivos inuteis
            prefix: "."
        };

        let sock = await startInstance(config);
        this.activeNodes.set(instanceId, { sock, status: 'CONNECTING' });

        // Loop manual, recriando o socket caso o WhatsApp derrube o WS antes de emparelhar
        const code = await new Promise((resolve, reject) => {
            let attempt = 0;

            const timeoutFallback = setTimeout(() => {
                reject(new Error("A conexão com o WhatsApp não estabilizou a tempo (Timeout). Verifique se seu número não foi banido."));
            }, 60000); // Rota aberta por no max 60s

            const tryGenerate = async () => {
                attempt++;
                try {
                    await new Promise(r => setTimeout(r, 2000));

                    if (sock.waitForSocketOpen && attempt % 2 !== 0) {
                        try { await sock.waitForSocketOpen(); } catch (e) { }
                    }

                    console.log(`[PAIRING] [${instanceId}] Tentando extrair código da API do Baileys... (Tentativa ${attempt})`);
                    const generatedCode = await sock.requestPairingCode(phoneNumber);
                    console.log(`[PAIRING] [${instanceId}] SUCESSO! Código: ${generatedCode}`);

                    if (this.activeNodes.has(instanceId)) {
                        this.activeNodes.get(instanceId).status = 'AWAITING_PAIRING';
                    }

                    clearTimeout(timeoutFallback);
                    resolve(generatedCode);
                } catch (err) {
                    console.error(`[PAIRING] [${instanceId}] Falha (tentativa ${attempt}):`, err.message);

                    if (attempt < 12) {
                        if (err.message.includes("Connection Closed") || err.message.includes("closed") || err.output?.statusCode === 428) {
                            console.log(`[PAIRING] [${instanceId}] WebSocket morreu precoceunte. Instanciando NOVO SOCKET para escapar da trava...`);

                            // 1. Limpa o socket antigo SEM interferir na persistência do BD
                            if (sock) {
                                try { sock.ev.removeAllListeners(); sock.ws.close(); } catch (e) { }
                            }

                            // 2. Espera e recria banco novo startInstance()
                            await new Promise(r => setTimeout(r, 2000));
                            sock = await startInstance(config);
                            this.activeNodes.set(instanceId, { sock, status: 'CONNECTING' });

                            // Reassina o handler de "connection.update" para o novo sock, para que a base o reconheça:
                            sock.ev.on("connection.update", async (update) => {
                                const { connection, qr, pairingCode, reconnect } = update;
                                if (connection === "open") {
                                    this.activeNodes.set(instanceId, { sock, status: 'CONNECTED' });
                                    await this.prisma.instance.update({ where: { id: instanceId }, data: { connection: "CONNECTED", status: "active", lastQR: null, pairingCode: null, connectedAt: new Date() } }).catch(() => { });
                                }
                                if (reconnect) {
                                    const curr = this.activeNodes.get(instanceId);
                                    if (!curr || curr.status !== 'AWAITING_PAIRING') this.startBot(instanceId, true);
                                }
                            });
                        }

                        setTimeout(tryGenerate, 4000); // Tentar denovo
                    } else {
                        clearTimeout(timeoutFallback);
                        reject(err); // Estoura na API se der +12 erros
                    }
                }
            };

            tryGenerate();
        });

        // We ensure we handle the listeners correctly as well
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr, pairingCode, reconnect } = update;
            console.log(`[STATE_CHANGE] [PAIRING] [${instanceId}] => connection: ${connection || 'N/A'}`);
            if (connection === "open") {
                this.activeNodes.set(instanceId, { sock, status: 'CONNECTED' });
                await this.prisma.instance.update({
                    where: { id: instanceId },
                    data: { connection: "CONNECTED", status: "active", lastQR: null, pairingCode: null, connectedAt: new Date() }
                }).catch(() => { });
                try {
                    const ownerPhone = instance.adminNumber || phoneNumber;
                    const ph = ownerPhone.includes('@s.whatsapp.net') ? ownerPhone : `${ownerPhone.replace(/\D/g, '')}@s.whatsapp.net`;
                    const msg = `✅ *IRIS Bot conectado com sucesso!*\n📱 Instância: ${instance.name || instanceId}\n🕐 ${new Date().toLocaleString()}\n\nSeu bot está ativo e pronto para receber mensagens.`;
                    await sock.sendMessage(ph, { text: msg });
                } catch (e) { }
            }
            if (connection === "close") {
                let isLoggedOut = false;
                if (lastDisconnect && lastDisconnect.error) {
                    isLoggedOut = lastDisconnect.error?.output?.statusCode === 401;
                }

                // Impede que sockets abortem o processo de pairing se for uma queda de rede/websocket temporária
                if (this.activeNodes.has(instanceId) && this.activeNodes.get(instanceId).sock === sock) {
                    const currentNode = this.activeNodes.get(instanceId);

                    if (currentNode.status !== 'AWAITING_PAIRING' && isLoggedOut) {
                        this.activeNodes.delete(instanceId);
                        await this.prisma.instance.update({
                            where: { id: instanceId },
                            data: { connection: "DISCONNECTED", status: "inactive" }
                        }).catch(() => { });
                    } else if (currentNode.status === 'AWAITING_PAIRING') {
                        console.log(`[PAIRING] Queda do WS detectada (AWAITING_PAIRING). Forçando reconexão para manter listener ativo...`);
                        if (isLoggedOut) {
                            // If it was 401, the old code is DEFINITELY invalid. The user will be stuck unless they generate a new one.
                            // But instead of hiding it immediately, we stay in AWAITING_PAIRING so the frontend can show the UI.
                            // The user will click 'Gerar Novo Código' naturally if it expired.
                            if (currentNode.sock) {
                                try { currentNode.sock.ev.removeAllListeners(); currentNode.sock.ws.close(); } catch (e) { }
                            }
                            startInstance(config).then(newSock => {
                                this.activeNodes.set(instanceId, { sock: newSock, status: 'AWAITING_PAIRING' });
                                newSock.ev.on("connection.update", (upd) => sock.ev.emit("connection.update", upd));
                            });
                        }
                    }
                }
            }
            if (reconnect) {
                const currentNode = this.activeNodes.get(instanceId);
                if (currentNode && currentNode.status === 'AWAITING_PAIRING') {
                    console.log(`[MANAGER] Reconectando ${instanceId} remotamente via motor isManaged (reconnect_event)`);

                    if (currentNode.sock) {
                        try {
                            currentNode.sock.ev.removeAllListeners();
                            currentNode.sock.ws.close();
                        } catch (e) { }
                    }

                    startInstance(config).then(newSock => {
                        this.activeNodes.set(instanceId, { sock: newSock, status: 'AWAITING_PAIRING' });
                        newSock.ev.on("connection.update", (upd) => sock.ev.emit("connection.update", upd));
                    });
                } else {
                    console.log(`[MANAGER] Reconectando ${instanceId} via motor original isManaged`);
                    this.startBot(instanceId, true);
                }
            }
        });

        // Seta o status oficial no banco
        await this.prisma.instance.update({
            where: { id: instanceId },
            data: { connection: "AWAITING_PAIRING", pairingCode: code, botNumber: phoneNumber }
        });

        // Seta localmente no Manager Node
        if (this.activeNodes.has(instanceId)) {
            this.activeNodes.get(instanceId).status = 'AWAITING_PAIRING';
        }

        return code;
    }

    async stopBot(instanceId) {
        console.log(`[STOP] [${instanceId}]`);
        const node = this.activeNodes.get(instanceId);
        if (node?.sock) {
            try {
                node.sock.ev.removeAllListeners();
                node.sock.ws.close();
                await node.sock.end();
            } catch (e) { }
        }
        this.activeNodes.delete(instanceId);
        await this.prisma.instance.update({
            where: { id: instanceId },
            data: { connection: "DISCONNECTED", status: "inactive", lastQR: null, pairingCode: null }
        });
    }
}

module.exports = new BotManager();
