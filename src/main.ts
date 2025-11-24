import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './util/http-exception.filter';
import { ValidationPipe } from './util/validation.pipe';
import { SuccessResponseInterceptor } from './util/success-response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe())


  const config = new DocumentBuilder()
    .setTitle('Your API Title')
    .setDescription('Your API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const customOptions: any = {
    swaggerOptions: {
      docExpansion: 'none', // This collapses all endpoints by default
      filter: true, // Optional: adds a search filter
      showRequestDuration: true, // Optional: shows request duration
      persistAuthorization: true, // Optional: keeps auth token between refreshes
    },
    customSiteTitle: 'Your API Documentation',
  };

  SwaggerModule.setup('api', app, document, customOptions);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
