import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { User } from './entities/user.entity';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [AuthModule, DatabaseModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule { }
