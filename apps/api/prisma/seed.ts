import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { seedRbac } from "./seed-rbac";

const prisma = new PrismaClient();

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL ?? "asadullosadirdinov@gmail.com";
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin";

async function main() {
  const passwordHash = await bcrypt.hash(seedAdminPassword, 10);
  await prisma.adminUser.upsert({
    where: { email: seedAdminEmail },
    create: {
      email: seedAdminEmail,
      passwordHash,
      isActive: true,
    },
    update: {
      passwordHash,
      isActive: true,
    },
  });
  console.log(`Seeded admin user ${seedAdminEmail}.`);

  await seedRbac(prisma, seedAdminEmail);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
