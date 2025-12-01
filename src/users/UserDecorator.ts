// src/auth/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export interface JwtPayload {
  sub: string;    // User ID
  email: string;
  role: string;
  iat?: number;   // Issued at (optional)
  exp?: number;   // Expiration (optional)
}
// Option 1: Get specific field or entire user object
export const UserDec = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    
    // If specific field is requested, return that field
    if (data) {
      return user?.[data];
    }
    
    // Otherwise return the entire user object
    return user;
  },
);

// Option 2: Strict version with validation
export const UserStrict = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    
    if (!user) {
      throw new Error('User not found in request. Make sure JwtAuthGuard is applied.');
    }
    
    if (data) {
      if (!user[data]) {
        throw new Error(`Field "${data}" not found in user payload`);
      }
      return user[data];
    }
    
    return user;
  },
);