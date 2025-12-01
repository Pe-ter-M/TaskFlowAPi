import { Controller, Post, Body, HttpCode, HttpStatus, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // Registration endpoint
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with email and password'
  })
  @ApiBody({
    type: CreateAuthDto,
    description: 'User registration data',
  })
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  // Login endpoint
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates a user and returns a JWT token',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
  })
  login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto,req);
  }

  @Get()
  get_Requwest(@Req() req: Request){
    return this.authService.get(req)
  }
}
