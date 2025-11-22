import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [AuthModule, LoggerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
