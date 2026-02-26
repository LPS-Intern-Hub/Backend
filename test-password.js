const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.users.findUnique({ where: { email: "admin@simagang.com" } });
    console.log("Password hash:", user.password);
    const valid = await bcrypt.compare("Password123", user.password);
    console.log("Match Password123?", valid);
    const validLower = await bcrypt.compare("password123", user.password);
    console.log("Match password123?", validLower);
}
main().finally(() => prisma.$disconnect());
