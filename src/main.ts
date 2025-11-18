import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS
  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 Server is running on port ${port}`);
  logger.log(`🔑 API Key configured: ${process.env.HEALTHIE_API_KEY ? 'Yes' : 'No'}`);
}

bootstrap();

