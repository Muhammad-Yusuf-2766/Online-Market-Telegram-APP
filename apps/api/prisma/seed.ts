import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL ?? "asadullosadirdinov@gmail.com";
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin";

async function main() {
  const passwordHash = await bcrypt.hash(seedAdminPassword, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: seedAdminEmail },
    create: {
      email: seedAdminEmail,
      passwordHash,
      fullName: "Ansor Market Super Admin",
      isActive: true,
      isSuperAdmin: true,
    },
    update: {
      passwordHash,
      isActive: true,
      isSuperAdmin: true,
    },
  });
  console.log(`Seeded Super Admin user ${admin.email}.`);

  const units = [
    { slug: "dona", name: "Dona", symbol: "dona", sortOrder: 10, allowDecimal: false },
    { slug: "kg", name: "Kilogram", symbol: "kg", sortOrder: 20, allowDecimal: true },
    { slug: "g", name: "Gram", symbol: "g", sortOrder: 30, allowDecimal: true },
    { slug: "litr", name: "Litr", symbol: "l", sortOrder: 40, allowDecimal: true },
    { slug: "pack", name: "Qadoq", symbol: "pack", sortOrder: 50, allowDecimal: false },
  ];
  for (const unit of units) {
    await prisma.measurementUnit.upsert({
      where: { slug: unit.slug },
      create: unit,
      update: {
        name: unit.name,
        symbol: unit.symbol,
        sortOrder: unit.sortOrder,
        allowDecimal: unit.allowDecimal,
      },
    });
  }
  console.log(`Seeded ${units.length} measurement units.`);

  const categories = [
    { slug: "halal-food", name: "Halol oziq-ovqat", sortOrder: 10 },
    { slug: "meat-products", name: "Go'sht mahsulotlari", sortOrder: 20 },
    { slug: "sweets", name: "Shirinliklar", sortOrder: 30 },
    { slug: "household", name: "Uy-ro'zg'or", sortOrder: 40 },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
      },
    });
  }
  console.log(`Seeded ${categories.length} categories.`);

  const dona = await prisma.measurementUnit.findUniqueOrThrow({ where: { slug: "dona" } });
  const kg = await prisma.measurementUnit.findUniqueOrThrow({ where: { slug: "kg" } });
  const halalFood = await prisma.category.findUniqueOrThrow({ where: { slug: "halal-food" } });
  const meatProducts = await prisma.category.findUniqueOrThrow({ where: { slug: "meat-products" } });
  const sweets = await prisma.category.findUniqueOrThrow({ where: { slug: "sweets" } });

  const products = [
    {
      title: "Halol ramen",
      description: "Koreyadan halol sertifikatli tez tayyor bo'ladigan ramen.",
      priceKrw: 2500,
      oldPriceKrw: 3000,
      discountPercent: 17,
      isOnSale: true,
      isBestSeller: true,
      stockQuantity: 120,
      lowStockThreshold: 20,
      categoryId: halalFood.id,
      measurementUnitId: dona.id,
    },
    {
      title: "Mol go'shti kolbasasi",
      description: "Halol mol go'shtidan tayyorlangan muzlatilgan mahsulot.",
      priceKrw: 8900,
      isOnSale: false,
      isBestSeller: true,
      stockQuantity: 45,
      lowStockThreshold: 10,
      categoryId: meatProducts.id,
      measurementUnitId: kg.id,
    },
    {
      title: "Xurmo qutisi",
      description: "Oilaviy dasturxon uchun sifatli xurmo.",
      priceKrw: 6500,
      oldPriceKrw: 7800,
      discountPercent: 17,
      isOnSale: true,
      isBestSeller: false,
      stockQuantity: 80,
      lowStockThreshold: 12,
      categoryId: sweets.id,
      measurementUnitId: dona.id,
    },
  ];
  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { title: product.title } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: product,
      });
    } else {
      await prisma.product.create({ data: product });
    }
  }
  console.log(`Seeded ${products.length} starter products.`);
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
