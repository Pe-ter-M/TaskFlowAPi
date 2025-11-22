import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule.forFeature({
      moduleName: 'AuthModule',
      enabled: true,
      logLevel: 'debug',
      enableFileLogging: true,
      logFilePath: './logs/auth/auth.module.log',
      timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
      useColors: true,
      maxFileSize: '10m',
      maxFiles: 5,
      logFormat: 'text',
    })
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
