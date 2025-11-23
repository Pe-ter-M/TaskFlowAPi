import { Inject, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoggerService } from 'src/logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { Password } from './entities/password.entity';
import { AuthSession } from './entities/auth.entity';
import { v4 as uuid4 } from 'uuid';
import { AuthToken, TokenType } from './entities/auth-token.entity';
import { LoginDto } from './dto/login.dto';
import { ConflictException, UnauthorizedException } from 'src/util/exceptions.index';

@Injectable()
export class AuthService {
  constructor(
    @Inject('LoggerService_AuthModule')
    private readonly logger: LoggerService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Password)
    private readonly passwordRepository: Repository<Password>,

    @InjectRepository(AuthSession)
    private authSessionRepository: Repository<AuthSession>,

    @InjectRepository(AuthToken)
    private authTokenRepository: Repository<AuthToken>,

    private dataSource: DataSource,

  ) { }
  async create(createAuthDto: CreateAuthDto) {
    // register new user with transaction
    this.logger.info(`CreateAuthDto: ${JSON.stringify(createAuthDto)}`);
    const queryRunner = this.dataSource.createQueryRunner();

    // start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // check if user already exists
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: createAuthDto.email }
      })
      if (existingUser) {
        this.logger.warn(`User with email ${createAuthDto.email} already exists`);
        throw new ConflictException('User with this email already exists');

      }

      // Create User
      const new_user = queryRunner.manager.create(User, {
        first_name: createAuthDto.first_name,
        last_name: createAuthDto.last_name,
        email: createAuthDto.email,
        role: createAuthDto?.role || 'user',
      })

      const saved_user = await queryRunner.manager.save(new_user);
      this.logger.debug(`New user created with ID: ${saved_user.id}`);

      // Create Password
      this.logger.debug('Creating Password entity...');
      const new_password = queryRunner.manager.create(Password, {
        password: createAuthDto.password,
        user_id: saved_user.id,
      });
      await queryRunner.manager.save(new_password);
      this.logger.debug(`Password set for user ID: ${saved_user.id}`);

      // Step 3: Create initial AuthSession
      const authSession = queryRunner.manager.create(AuthSession, {
        user: saved_user,
        lastLogin: null,
        failedLoginAttempts: 0,
        isOnline: false,
      });

      await queryRunner.manager.save(authSession);
      this.logger.debug(`Auth session created for user: ${saved_user.id}`, 'AuthService.create');

      const authToken = queryRunner.manager.create(AuthToken, {
        userId: saved_user.id,
        type: TokenType.EMAIL_VERIFICATION,
        tokenHash: uuid4(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        revoked: false,
        revokedAt: null,
        ipAddress: null,
        userAgent: null,
        metadata: { purpose: 'Verify email address' },
      });

      await queryRunner.manager.save(authToken);
      this.logger.debug(`Email verification token created for user: ${saved_user.id}`, 'AuthService.create');

      // commit transaction
      await queryRunner.commitTransaction();
      this.logger.info(`User registration completed successfully: ${saved_user.email}`, 'AuthService.create');
      return {
        id: saved_user.id,
        first_name: saved_user.first_name,
        last_name: saved_user.last_name,
        email: saved_user.email,
        role: saved_user.role,
        created_at: saved_user.created_at,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transaction failed: ${error.message}`, 'AuthService.createUserTransaction');
      throw error;
    } finally {
      await queryRunner.release();
    }

  }

  async login(loginDto: LoginDto) {
    this.logger.info(`Login attempt for email: ${loginDto.email}`);

    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    })
    if (!user) {
      this.logger.warn(`Login failed: User with email ${loginDto.email} not found`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordRecord = await this.passwordRepository.findOne({
      where: { user_id: user.id },
    });

    if (!passwordRecord) {
      this.logger.warn(`Login failed: No password record found for email ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!await passwordRecord.validatePassword(loginDto.password)) {
      this.logger.warn(`Login failed: Invalid password for email ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.info(`Login successful for email: ${loginDto.email}`);
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      }
    };
  }

  findAll() {
    this.logger.debug('Fetching all auth records');
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
