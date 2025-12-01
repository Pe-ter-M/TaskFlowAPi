// src/auth/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Define the full JWT payload type
interface FullJwtPayload {
  sub: string;
  role: string;
  email: string;
  iat: number;
  exp: number;
}

export const UserDec = createParamDecorator(
  (
    fields: (keyof FullJwtPayload)[] | keyof FullJwtPayload | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as FullJwtPayload;
    
    if (!user) {
      return null;
    }
    
    // If no fields specified, return entire user
    if (!fields) {
      return user;
    }
    
    // If single field requested
    if (typeof fields === 'string') {
      return user[fields];
    }
    
    // If array of fields requested
    if (Array.isArray(fields)) {
      // Type assertion to fix the error
      const result: Partial<FullJwtPayload> = {};
      fields.forEach(field => {
        // Type assertion here
        result[field] = user[field] as any;
      });
      return result;
    }
    
    return user;
  },
);