import './common/bigint-json';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GoalNest API')
    .setDescription('Personal finance platform for tracking income, expenses, savings, goals, and loans')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and session management')
    .addTag('Users', 'User profile and device management')
    .addTag('Expenses', 'Expense tracking and analysis')
    .addTag('Savings', 'Savings accounts and growth')
    .addTag('Goals', 'Financial goal planning')
    .addTag('Loans', 'Loan management')
    .addTag('EMI Tracking', 'EMI payment tracking and alerts')
    .addTag('House Planner', 'House buying calculator')
    .addTag('Can I Afford This', 'Purchase affordability analysis')
    .addTag('Financial Health Score', 'Overall financial health scoring')
    .addTag('Insights', 'Personalized money notes and spending analysis')
    .addTag('Notifications', 'Push, email, and SMS notifications')
    .addTag('Reports', 'Financial report generation and export')
    .addTag('Bank Import', 'Bank statement import from PDF, CSV, XLSX')
    .addTag('Admin', 'Admin dashboard users, revenue, tickets, analytics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`GoalNest API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
