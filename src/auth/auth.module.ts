import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoggerModule } from '../logger/logger.module';
import { DatabaseModule } from 'src/database/database.module';
import { Password } from './entities/password.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthSecurity } from './entities/auth.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ClientInfoService } from 'src/util/client-info';

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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule.forFeature([User, Password, AuthSecurity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard, ClientInfoService],
  exports: [JwtModule,JwtAuthGuard,RolesGuard, ClientInfoService],
})
export class AuthModule {}
