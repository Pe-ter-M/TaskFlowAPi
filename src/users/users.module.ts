import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { User } from './entities/user.entity';
import { DatabaseModule } from 'src/database/database.module';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [AuthModule,
    LoggerModule.forFeature({
      moduleName: 'UserModule',
      enabled: true,
      logLevel: 'verbose',
      enableFileLogging: true,
      logFilePath: './logs/users/auth.module.log',
      timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
      useColors: true,
      maxFileSize: '10m',
      maxFiles: 5,
      logFormat: 'text',
    }),
    DatabaseModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule { }
