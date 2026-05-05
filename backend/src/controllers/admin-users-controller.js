const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../auth");

const prisma = require("../db");

exports.getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Erro ao buscar usuários." });
    }
};

exports.createUser = async (req, res) => {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            return res.status(400).json({ error: "E-mail já está em uso." });
        }

        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                role: role === "ADMIN" ? "ADMIN" : "CLIENT"
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Erro interno ao criar usuário." });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, password, role } = req.body;

    try {
        const dataToUpdate = {};
        if (name) dataToUpdate.name = name;
        if (role) dataToUpdate.role = role === "ADMIN" ? "ADMIN" : "CLIENT";

        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
            }
            dataToUpdate.password = await hashPassword(password);
        }

        const user = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });

        res.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Erro ao atualizar usuário." });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    if (req.user.id === id) {
        return res.status(400).json({ error: "Você não pode deletar a sua própria conta." });
    }

    try {
        // First delete any instances/licenses associated to prevent constraint errors
        await prisma.instance.deleteMany({ where: { userId: id } });

        // Disassociate licenses (or delete them if you prefer, but setting user to null might make them available, 
        // or just delete the user, let's delete them to be safe if Prisma allows cascade, but let's manual process if boundUserId)
        await prisma.license.deleteMany({ where: { boundUserId: id } });

        await prisma.user.delete({ where: { id } });
        res.json({ message: "Usuário deletado com sucesso." });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Erro ao deletar usuário." });
    }
};
