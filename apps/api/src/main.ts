import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  const corsOrigins = process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean);
  if (corsOrigins?.length) {
    app.enableCors({ origin: corsOrigins, credentials: true });
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[parfumbox-api] CORS_ORIGINS is not set in production. Reflecting request origin — set CORS_ORIGINS to the public web and admin URLs to lock this down.",
      );
    }
    app.enableCors({ origin: true, credentials: true });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Parfumbox API")
    .setDescription("Telegram mini app, admin panel, and catalog API")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "user-jwt")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "admin-jwt")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
