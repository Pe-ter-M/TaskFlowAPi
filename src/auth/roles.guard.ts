// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from './ roles.decorator';
import { ForbiddenException } from 'src/util/exceptions.index';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) { }

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new ForbiddenException('No token provided');
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    try {
      // Verify and decode the JWT
      const payload = this.jwtService.verify(token);
      request.user = payload; // Attach user to request for later use

      // Check if user has any of the required roles
      const hasRole = requiredRoles.some(role => payload.roles?.includes(role));

      if (!hasRole) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    } catch (error) {
      throw new ForbiddenException('Invalid token or insufficient permissions');
    }
  }
}