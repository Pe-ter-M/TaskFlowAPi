import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
// import { LoggerModule } from './logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    DatabaseModule.forRoot(),
    AuthModule,
    UsersModule,
   ],
  controllers: [],
  providers: [],
})
export class AppModule {}
