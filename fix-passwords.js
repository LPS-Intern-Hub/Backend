const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.users.findMany();
    let updatedCount = 0;

    for (const user of users) {
        // bcrypt hashes usually start with $2a$, $2b$, or $2y$ followed by the cost factor
        if (user.password && !user.password.startsWith('$2')) {
            console.log(`User ${user.email} has unhashed password. Hashing...`);
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await prisma.users.update({
                where: { id_users: user.id_users },
                data: {
                    password: hashedPassword,
                    failed_login_count: 0,
                    locked_until: null
                }
            });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} users with unhashed passwords.`);
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
