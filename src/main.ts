import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Serve uploaded files at /api/uploads/* (works through the Vite dev proxy)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/api/uploads', express.static(uploadsDir));

  // `FRONTEND_URL` may hold a comma-separated list (e.g. both the apex and `www` domains).
  // `credentials: true` (needed for the httpOnly refresh_token cookie) means the response can
  // never send `Access-Control-Allow-Origin: *` — browsers reject that combination outright —
  // so every allowed origin must be listed explicitly instead.
  const configuredOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  const allowedOrigins = [
    ...configuredOrigins,
    'https://recaplink.tn',
    'https://www.recaplink.tn',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: [...new Set(allowedOrigins)],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // ── Swagger ──────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('RecapLink API')
    .setDescription('RecapLink platform API — plastic circular economy marketplace')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Dashboard', 'Super-admin dashboard statistics and analytics')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Offers', 'Plastic offer management')
    .addTag('Settings', 'Global platform settings (localization, security, notifications, chatbot, badge engine)')
    .addTag('Sessions', "A user's connected devices / login history")
    .addTag('Support Tickets', 'Internal support center for Admins/Super Admins')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Helmet blocks Swagger UI inline scripts — disable CSP only for /api/docs
  app.use('/api/docs', (_req: any, _res: any, next: any) => next());
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`RecapLink API   → http://localhost:${port}/api`);
  console.log(`Swagger UI      → http://localhost:${port}/api/docs`);
}

bootstrap();
