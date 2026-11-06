import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  const origin = process.env.FRONTEND_ORIGIN || '*';
  app.enableCors({
    origin: origin === '*' ? true : origin.split(',').map((o) => o.trim()),
    methods: 'GET,POST,OPTIONS',
  });
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on port ${port}`);
}
bootstrap();
