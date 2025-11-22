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
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string;

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

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Matches(/^[a-zA-Z\s]+$/, { message: 'First name can only contain letters and spaces' })
    first_name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Matches(/^[a-zA-Z\s]+$/, { message: 'Last name can only contain letters and spaces' })
    last_name: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}
