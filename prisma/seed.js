const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...");

    // Create admin user
    const adminEmail = "admin@irisbot.com";
    const adminPassword = "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: hashedPassword,
            name: "Administrator",
            role: "ADMIN"
        }
    });

    console.log("✅ Admin user created:", admin.email);

    // Create test client user
    const clientEmail = "cliente@teste.com";
    const clientPassword = "cliente123";
    const hashedClientPassword = await bcrypt.hash(clientPassword, 10);

    const client = await prisma.user.upsert({
        where: { email: clientEmail },
        update: {},
        create: {
            email: clientEmail,
            password: hashedClientPassword,
            name: "Cliente Teste",
            role: "CLIENT"
        }
    });

    console.log("✅ Client user created:", client.email);

    // Create default license
    const license = await prisma.license.upsert({
        where: { key: "IRIS-DEMO-001" },
        update: {},
        create: {
            key: "IRIS-DEMO-001",
            durationDays: 365,
            status: "ACTIVE",
            boundUserId: admin.id,
            activatedAt: new Date()
        }
    });

    console.log("✅ Demo license created:", license.key);

    console.log("\n📋 Login credentials:");
    console.log("─".repeat(40));
    console.log("ADMIN:");
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log("─".repeat(40));
    console.log("CLIENT:");
    console.log(`  Email: ${clientEmail}`);
    console.log(`  Password: ${clientPassword}`);
    console.log("─".repeat(40));
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
