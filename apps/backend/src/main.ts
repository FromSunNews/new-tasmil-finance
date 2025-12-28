// Load .env file - Force load in all environments
import { config } from 'dotenv';
config({ path: '.env' });

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  // Debug environment variables
  console.log('🔧 Environment Debug:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  PORT:', process.env.PORT);
  console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('  POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
  console.log('  REDIS_URL:', process.env.REDIS_URL);
  
  const app = await NestFactory.create(AppModule);
  
  // Security: Helmet for security headers
  app.use(helmet());
  
  // Cookie parser
  app.use(cookieParser());
  
  // CORS configuration
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = frontendUrl.split(',').map(url => url.trim());
  
  console.log('🌐 CORS Configuration:');
  console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('  Allowed Origins:', allowedOrigins);
  
  app.enableCors({
    origin: (origin, callback) => {
      console.log('🔍 CORS Check - Origin:', origin);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('✅ No origin - allowing');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        console.log('✅ Origin allowed:', origin);
        callback(null, true);
      } else {
        console.log('❌ Origin blocked:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );
  
  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tasmil API')
    .setDescription('Tasmil Backend API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('chat', 'Chat endpoints')
    .addTag('agents', 'Agents endpoints')
    .addTag('document', 'Document endpoints')
    .addTag('files', 'File upload endpoints')
    .addTag('history', 'Chat history endpoints')
    .addTag('suggestions', 'Suggestions endpoints')
    .addTag('vote', 'Vote endpoints')
    .addTag('links', 'Links endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    customSiteTitle: 'Tasmil API Docs',
  });
  
  // Get port from environment variable or default to 3000
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
  
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Backend server is running on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`📡 CORS enabled for: ${allowedOrigins.join(', ')}`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

void bootstrap();
