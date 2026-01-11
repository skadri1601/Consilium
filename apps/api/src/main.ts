import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { LoggingInterceptor } from "./shared/interceptors/logging.interceptor";
import * as Sentry from "@sentry/node";

async function bootstrap() {
  // Initialize Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 1.0,
    });
  }

  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("Consilium API")
    .setDescription("AI Council Platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 4000;
  try {
    await app.listen(port, "0.0.0.0");
    logger.log(`Application is running on: ${await app.getUrl()}`);
    logger.log(`Swagger docs: ${await app.getUrl()}/api/docs`);
  } catch (error) {
    logger.error(`Failed to start application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error(error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap");
  logger.error(`Fatal error during bootstrap: ${error instanceof Error ? error.message : 'Unknown error'}`);
  logger.error(error);
  process.exit(1);
});
