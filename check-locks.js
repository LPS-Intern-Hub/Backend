const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.users.findMany({
        select: {
            email: true,
            failed_login_count: true,
            locked_until: true
        }
    });
    console.table(users);
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
