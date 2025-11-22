import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
// import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [AuthModule ],
  controllers: [],
  providers: [],
})
export class AppModule {}
