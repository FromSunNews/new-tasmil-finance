// Load .env file
import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable cookie parser
  // @ts-ignore - cookie-parser is CommonJS module
  app.use(cookieParser());
  
  // Get port from environment variable or default to 3000
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  
  // Enable CORS for frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5555';
  
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  
  await app.listen(port);
  console.log(`🚀 Backend server is running on http://localhost:${port}`);
  console.log(`📡 CORS enabled for: ${frontendUrl}`);
  console.log(`🔧 PORT from .env: ${process.env.PORT || 'not set'}`);
}

void bootstrap();
