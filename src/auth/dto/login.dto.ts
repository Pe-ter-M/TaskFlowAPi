import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Valid email address associated with your account',
    example: 'mburu8526@gmail.com',
    maxLength: 255,
    required: true
  })
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Your account password',
    example: 'SecurePass123!',
    minLength: 6,
    maxLength: 100,
    required: true
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100)
  password: string;
}