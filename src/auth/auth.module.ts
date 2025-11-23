import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoggerModule } from '../logger/logger.module';
import { DatabaseModule } from 'src/database/database.module';
import { Password } from './entities/password.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthSession } from './entities/auth.entity';
import { AuthToken } from './entities/auth-token.entity';

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
    }),
    DatabaseModule.forFeature([User, Password, AuthSession, AuthToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
