import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions =
    process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH
      ? {
          cert: fs.readFileSync(process.env.SSL_CERT_PATH),
          key: fs.readFileSync(process.env.SSL_KEY_PATH),
        }
      : undefined;

  const app = await NestFactory.create(AppModule, { httpsOptions });

  // CSP off: Swagger UI's inline scripts/styles conflict with helmet's
  // default policy — every other header (HSTS, X-Frame-Options, etc.) stays on.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'https://localhost:5173')
      .split(',')
      .map((origin) => origin.trim()),
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Checkout Flow API')
    .setDescription(
      'Stock, transactions, customers, and deliveries for the checkout flow app. ' +
        'Rate limited to 100 requests/minute per IP by default (429 Too Many Requests once exceeded); ' +
        'individual endpoints may set a tighter limit — see their own description.',
    )
    .setVersion('0.1')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
