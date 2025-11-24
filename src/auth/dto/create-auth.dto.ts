import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    IsNotEmpty,
    IsOptional,
    Matches,
    IsEnum
} from 'class-validator';
import { UserRole } from 'src/users/entities/type';
export class CreateAuthDto {
  @ApiProperty({
    description: 'Valid email address for the user account',
    example: 'mburu8526@gmail.com',
    maxLength: 255,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Strong password meeting security requirements',
    example: 'SecurePass123!',
    minLength: 8,
    maxLength: 100,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  )
  password: string;

  @ApiProperty({
    description: 'User first name containing only letters and spaces',
    example: 'Phantom',
    minLength: 2,
    maxLength: 100,
    pattern: '^[a-zA-Z\\s]+$'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'First name can only contain letters and spaces' })
  first_name: string;

  @ApiProperty({
    description: 'User last name containing only letters and spaces',
    example: 'Mburu',
    minLength: 2,
    maxLength: 100,
    pattern: '^[a-zA-Z\\s]+$'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Last name can only contain letters and spaces' })
  last_name: string;

  @ApiPropertyOptional({
    description: 'User role in the system',
    enum: UserRole,
    enumName: 'UserRole',
    examples: {
      user: { value: UserRole.USER, description: 'Regular user account' },
      admin: { value: UserRole.ADMIN, description: 'Administrator account' },
      guest: { value: UserRole.GUEST, description: 'Guest account' }
    },
    default: UserRole.USER
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.USER;
}