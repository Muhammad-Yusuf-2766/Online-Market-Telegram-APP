import { INestApplication, Injectable, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import { mock } from "jest-mock-extended";
import { AppModule } from "../../src/app.module";
import { AuthService } from "../../src/auth/auth.service";
import { PrismaService } from "../../src/prisma/prisma.service";
import { TelegramNotifyService } from "../../src/telegram/telegram-notify.service";
import { createTestPrisma, prepareTestDb, truncateAll } from "./db";

export type TestingApp = {
  app: INestApplication;
  prisma: PrismaClient;
  moduleRef: TestingModule;
};

const noopTelegramNotify = mock<TelegramNotifyService>();

@Injectable()
export class TestAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async authenticateTelegram(initDataRaw: string) {
    const telegramId = initDataRaw.trim() || "test-telegram-id";
    const user = await this.prisma.user.upsert({
      where: { telegramId },
      create: { telegramId, locale: "uz" },
      update: {},
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, typ: "user" });
    return { accessToken, expiresIn: 604800, user };
  }
}

export async function createTestingApp(): Promise<TestingApp> {
  prepareTestDb();
  const prisma = createTestPrisma();
  await prisma.$connect();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(TelegramNotifyService)
    .useValue(noopTelegramNotify)
    .overrideProvider(AuthService)
    .useClass(TestAuthService)
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  return { app, prisma, moduleRef };
}

export async function resetTestingDb(prisma: PrismaClient): Promise<void> {
  await truncateAll(prisma);
}

export async function closeTestingApp(testingApp: TestingApp | undefined): Promise<void> {
  if (!testingApp) return;
  await testingApp.app.close();
  await testingApp.prisma.$disconnect();
}

