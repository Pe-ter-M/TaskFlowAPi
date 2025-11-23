import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './util/http-exception.filter';
import { ValidationPipe } from './util/validation.pipe';
import { SuccessResponseInterceptor } from './util/success-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe())

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
