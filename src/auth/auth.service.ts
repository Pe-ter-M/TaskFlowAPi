import { Inject, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoggerService } from 'src/logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { Password } from './entities/password.entity';
import { v4 as uuid4 } from 'uuid';
import { AuthToken, TokenType } from './entities/auth-token.entity';
import { LoginDto } from './dto/login.dto';
import { ConflictException, ForbiddenException, UnauthorizedException } from 'src/util/exceptions.index';
import { JwtService } from '@nestjs/jwt';
import { ClientInfoService } from 'src/util/client-info';
import type { Request } from 'express';
import { AuthSecurity } from './entities/auth.entity';
@Injectable()
export class AuthService {
  constructor(
    @Inject('LoggerService_AuthModule')
    private readonly logger: LoggerService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Password)
    private readonly passwordRepository: Repository<Password>,

    @InjectRepository(AuthSecurity)
    private readonly authSecurityRepository: Repository<AuthSecurity>,

    @InjectRepository(AuthToken)
    private authTokenRepository: Repository<AuthToken>,

    private readonly dataSource: DataSource,
    private readonly clientInfoService: ClientInfoService,

    private readonly jwtService: JwtService,

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
      const new_password = queryRunner.manager.create(Password, {
        password: createAuthDto.password,
        user_id: saved_user.id,
      });
      await queryRunner.manager.save(new_password);
      this.logger.debug(`Password set for user: ${saved_user.email}`);

      // Step 3: Create initial AuthSession
      const authSession = queryRunner.manager.create(AuthSecurity, {
        user: saved_user,
        lastLogin: null,
        failedLoginAttempts: 0,
        isOnline: false,
      });

      await queryRunner.manager.save(authSession);
      this.logger.debug(`Auth session created for user: ${saved_user.email}`, 'AuthService.create');

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

  async login(loginDto: LoginDto, req: Request) {
    const clientInfo = this.clientInfoService.extractFromRequest(req);
    this.logger.info(`Login from: ${clientInfo.ip}, Browser: ${clientInfo.browser.name}, OS: ${clientInfo.os.name}`);

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

    let authSecurity = await this.authSecurityRepository.findOne({
      where: { user: { id: user.id } },
    })

    if (!authSecurity) {
      authSecurity = this.authSecurityRepository.create({ user });
      await this.authSecurityRepository.save(authSecurity);
    }

    // check if account is locked
    if (authSecurity.isLocked()) {
      const remainingTime = authSecurity.getRemainingLockTime();
      throw new ForbiddenException(
        `Account is locked. Please try again in ${remainingTime} minutes.`
      );
    }

    if (!passwordRecord) {
      this.logger.warn(`Login failed: No password record found for email ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!await passwordRecord.validatePassword(loginDto.password)) {
      // for wrong password
      this.logger.warn(`Login failed: Invalid password for email ${loginDto.email}`);
      authSecurity.recordFailedAttempt(clientInfo.ip,clientInfo.userAgent)
      const remainingAttempts = authSecurity.getRemainingAttempts();
      const remainingTime = authSecurity.getRemainingLockTime()
      await this.authSecurityRepository.save(authSecurity);
      if (remainingAttempts <= 0) {
        throw new ForbiddenException(
          `Account locked due to too many failed attempts. Please try again in ${remainingTime} minutes.`
        );
      }
      throw new UnauthorizedException(`Invalid credentials. ${remainingAttempts} attempt(s) remaining.`);
    }
    const payload = {
      role: user.role,
      sub: user.id,
      email: user.email
    };
    const token = this.jwtService.sign(payload);
    authSecurity.recordSuccessfulLogin(clientInfo.ip, clientInfo.userAgent, { browser: clientInfo.browser.full, os: clientInfo.os.full, deviceType: clientInfo.device.full })
    this.logger.info(`Login successful for email: ${loginDto.email}`);
    await this.authSecurityRepository.save(authSecurity)
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      token
    };
  }

  get(req: Request) {
    const clientInfo = this.clientInfoService.extractFromRequest(req)
    this.logger.info(`Login from: ${clientInfo.ip}, Device: ${clientInfo.device.full}, Browser: ${clientInfo.browser.full}, OS: ${clientInfo.os.full}`);
    return 'done'
  }
}
