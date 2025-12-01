import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from 'src/logger/logger.service';
import { NotFoundException, UnauthorizedException } from 'src/util/exceptions.index';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject('LoggerService_UserModule')
    private readonly logger: LoggerService,
  ) { }
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll() {
    const users = await this.userRepository.find({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        role: true,
        email: true,
      },
    })
    return { users };
  }

  async findOne(id: string, userInfo: { sub: string, role: string }) {
    this.logger.verbose(`Request for id ${id}`)
    if (userInfo.sub != id && userInfo.role != 'admin') {
      this.logger.warn(`Request for id: ${id} from id: ${userInfo.sub} and not admin`)
      throw new UnauthorizedException('You are not allowed to make this request')
    }
    const user = await this.userRepository.findOne({ where: { id: id } })
    if (!user) {
      this.logger.warn(`User with id not found ${id}`)
      throw new NotFoundException(`User with id ${id} not found`)
    }
    this.logger.verbose(`User ${user.email} found`)

    return { user: user }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
