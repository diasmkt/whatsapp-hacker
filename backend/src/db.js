const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

// Initialize Prisma Client with connection pooling considerations for serverless
const prisma = globalForPrisma.prisma || new PrismaClient({
    log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

// Ensure the connection is established properly
prisma.$connect()
    .then(() => console.log("[DATABASE] Prisma successfully connected to the database."))
    .catch((err) => {
        console.error("[DATABASE_ERROR] Failed to establish Prisma connection:", err.message);
    });

module.exports = prisma;
