import * as bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

export async function seedE2eAdmin(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash("test-admin-pass", 10);
  return prisma.adminUser.upsert({
    where: { email: "e2e-admin@test.local" },
    create: {
      email: "e2e-admin@test.local",
      passwordHash,
      fullName: "E2E Admin",
      isActive: true,
      isSuperAdmin: true,
    },
    update: { passwordHash, isActive: true, isSuperAdmin: true },
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
  const unit = await prisma.measurementUnit.upsert({
    where: { slug: "piece" },
    create: { slug: "piece", name: "Piece", symbol: "pc", sortOrder: 0 },
    update: {},
  });
  const category = await prisma.category.upsert({
    where: { slug: "pantry" },
    create: { slug: "pantry", name: "Pantry", sortOrder: 0 },
    update: {},
  });
  return prisma.product.create({
    data: {
      title: "E2E Test Halal Product",
      description: "Test product for e2e",
      priceKrw: 15000,
      images: [],
      stockQuantity: 100,
      categoryId: category.id,
      measurementUnitId: unit.id,
    },
  });
}
