const botManager = require("../bot-manager");
const prisma = require("../db");

exports.createInstance = async (req, res) => {
    const { name, adminNumber, botNumber, pairingType = "QR" } = req.body;
    const userId = req.user.id;

    try {
        // 1. Check active license
        const activeLicense = await prisma.license.findFirst({
            where: {
                boundUserId: userId,
                status: "ACTIVE",
                expiresAt: { gt: new Date() }
            }
        });

        if (!activeLicense) {
            return res.status(403).json({ error: "Active license required. Please activate a key first." });
        }

        // 2. Check instance limit (<3)
        const instanceCount = await prisma.instance.count({ where: { userId } });
        if (instanceCount >= 3) {
            return res.status(400).json({ error: "Instance limit reached (Max 3)." });
        }

        // 3. Create instance
        const instance = await prisma.instance.create({
            data: {
                name,
                userId,
                adminNumber,
                botNumber,
                pairingType,
                status: "inactive",
                connection: "DISCONNECTED"
            }
        });

        res.status(201).json(instance);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getInstances = async (req, res) => {
    try {
        const instances = await prisma.instance.findMany({
            where: req.user.role === "ADMIN" ? {} : { userId: req.user.id },
            include: { user: true }
        });
        res.json(instances);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getInstanceStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const instance = await prisma.instance.findUnique({ where: { id } });
        if (!instance) return res.status(404).json({ error: "Instance not found" });

        // Enhance with in-memory status if available
        const memoryNode = botManager.activeNodes.get(id);
        const inMemoryStatus = memoryNode ? memoryNode.status : "DISCONNECTED";
        const isActuallyConnected = inMemoryStatus === "CONNECTED";

        res.json({
            id: instance.id,
            status: isActuallyConnected ? "connected" : inMemoryStatus.toLowerCase(),
            phone: isActuallyConnected ? instance.botNumber : null,
            connectedAt: isActuallyConnected ? instance.connectedAt : null,
            dbStatus: instance.connection,
            pairingCode: (inMemoryStatus === "AWAITING_PAIRING" || instance.connection === "AWAITING_PAIRING") ? instance.pairingCode : null,
            lastQR: (inMemoryStatus === "AWAITING_QR" || instance.connection === "AWAITING_QR") ? instance.lastQR : null
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.startInstance = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await botManager.startBot(id);
        res.json({ message: "Instance initialization processing.", result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.requestPairingCode = async (req, res) => {
    const { id } = req.params;
    const { phoneNumber } = req.body;
    try {
        console.log('[PAIRING] Iniciando geração de código...');
        console.log('[PAIRING] ID da instância:', id);
        console.log('[PAIRING] Phone recebido:', phoneNumber);

        const code = await botManager.requestPairingCode(id, phoneNumber);

        console.log('[PAIRING] Código gerado com sucesso:', code);
        res.json({ pairingCode: code });
    } catch (e) {
        console.error('[PAIRING] ERRO COMPLETO:', e);
        res.status(500).json({ error: e.message });
    }
};

exports.stopInstance = async (req, res) => {
    const { id } = req.params;
    try {
        await botManager.stopBot(id);
        res.json({ message: "Instance stopped." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateInstance = async (req, res) => {
    const { id } = req.params;
    const { name, adminNumber, botNumber, pairingType, config } = req.body;
    const userId = req.user.id;

    try {
        // Find instance and check ownership
        const existing = await prisma.instance.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: "Instância não encontrada." });
        if (req.user.role !== "ADMIN" && existing.userId !== userId) {
            return res.status(403).json({ error: "Não autorizado." });
        }

        const instance = await prisma.instance.update({
            where: { id },
            data: {
                name,
                adminNumber,
                botNumber,
                pairingType,
                config: config ? (typeof config === "string" ? config : JSON.stringify(config)) : undefined
            }
        });

        // If instance is connected, re-start to apply changes (admin number, etc)
        if (instance.status === "active") {
            console.log(`[INSTANCE] Aplicando configurações em tempo real para ${id}`);
            await botManager.stopBot(id);
            await botManager.startBot(id);
        }

        res.json(instance);
    } catch (e) {
        console.error(`[INSTANCE] Erro ao atualizar instância ${id}:`, e.message);
        res.status(500).json({ error: e.message });
    }
};

exports.deleteInstance = async (req, res) => {
    const { id } = req.params;
    try {
        await botManager.stopBot(id);
        await prisma.instance.delete({ where: { id } });
        res.json({ message: "Instance deleted." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
