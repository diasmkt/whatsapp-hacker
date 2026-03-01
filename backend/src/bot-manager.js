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
            // Em Vercel, apenas marcamos no banco que o bot DEVE ser iniciado.
            // O processo persistente no VPS ou Local irá ler este status e iniciar.
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

        try {
            const instance = await this.prisma.instance.findUnique({
                where: { id: instanceId }
            });

            if (!instance) throw new Error("Instância inexistente.");

            // Lazy Load do motor Baileys
            if (!startInstance) {
                const legacy = require("./bot-manager-v10");
                startInstance = legacy.startInstance;
            }

            // Configuração para o Runtime V10
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

            this.activeNodes.set(instanceId, { sock, status: 'CONNECTED' });

            // Eventos persistentes
            sock.ev.on("connection.update", async (update) => {
                const { connection, qr, pairingCode } = update;

                if (qr) {
                    this.emit("qr", { instanceId, qr });
                    await this.prisma.instance.update({ where: { id: instanceId }, data: { lastQR: qr, pairingCode: null } }).catch(() => { });
                }

                if (pairingCode) {
                    this.emit("status", { instanceId, status: "PAIRING", pairingCode });
                    await this.prisma.instance.update({ where: { id: instanceId }, data: { pairingCode, lastQR: null } }).catch(() => { });
                }

                if (connection === "open") {
                    this.emit("status", { instanceId, status: "CONNECTED" });
                    await this.prisma.instance.update({
                        where: { id: instanceId },
                        data: { connection: "CONNECTED", status: "active", lastQR: null, pairingCode: null }
                    }).catch(() => { });
                }

                if (connection === "close") {
                    this.activeNodes.delete(instanceId);
                    this.emit("status", { instanceId, status: "DISCONNECTED" });
                    await this.prisma.instance.update({
                        where: { id: instanceId },
                        data: { connection: "DISCONNECTED", status: "inactive" }
                    }).catch(() => { });
                }
            });

            sock.ev.on("status", (data) => this.emit("status", { instanceId, ...data }));

        } catch (e) {
            console.error(`[MANAGER_ERR] [${instanceId}]`, e.stack);
        } finally {
            this.bootLocks.delete(instanceId);
        }
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
