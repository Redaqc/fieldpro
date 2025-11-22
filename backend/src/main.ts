import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Global prefix for all routes
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transformation interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API documentation
  if (configService.get('SWAGGER_ENABLED', 'true') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('FieldPro API')
      .setDescription('FieldPro Field Service Management REST API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT access token',
          in: 'header',
        },
        'access-token',
      )
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT refresh token',
          in: 'header',
        },
        'refresh-token',
      )
      .addTag('Authentication', 'User authentication and authorization endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Customers', 'Customer management endpoints')
      .addTag('Jobs', 'Job and service call management')
      .addTag('Technicians', 'Technician management and scheduling')
      .addTag('Invoices', 'Invoice and payment management')
      .addTag('Assets', 'Asset and maintenance tracking')
      .addTag('GPS', 'GPS tracking and geofencing')
      .addTag('Forms', 'Form templates and submissions')
      .addTag('Notifications', 'Push notifications and alerts')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerPath = configService.get('SWAGGER_PATH', 'api/docs');
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    console.log(`📚 Swagger documentation available at: http://localhost:${configService.get('PORT', 3001)}/${swaggerPath}`);
  }

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 FieldPro Backend API is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap();
