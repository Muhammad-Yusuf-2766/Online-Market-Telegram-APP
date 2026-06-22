import * as bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

export async function seedE2eAdmin(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash("test-admin-pass", 10);
  const role = await prisma.role.upsert({
    where: { key: "super_admin" },
    create: { key: "super_admin", name: "Super Admin", isSuperAdmin: true },
    update: {},
  });
  return prisma.adminUser.upsert({
    where: { email: "e2e-admin@test.local" },
    create: {
      email: "e2e-admin@test.local",
      passwordHash,
      fullName: "E2E Admin",
      isActive: true,
      roleId: role.id,
    },
    update: { passwordHash, isActive: true, roleId: role.id },
  });
}

export async function seedE2eUser(prisma: PrismaClient, telegramId = "e2e-user-1") {
  return prisma.user.upsert({
    where: { telegramId },
    create: { telegramId, locale: "uz", firstName: "E2E", lastName: "User" },
    update: {},
  });
}

export async function seedE2eProduct(prisma: PrismaClient) {
  return prisma.product.create({
    data: {
      title: "E2E Test Perfume",
      description: "Test product for e2e",
      priceUzs: 150000,
      images: [],
      stock: 100,
      notesTop: [],
      notesHeart: [],
      notesBase: [],
    },
  });
}
