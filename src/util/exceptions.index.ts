import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(message: string = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class ValidationException extends HttpException {
  constructor(message: string = 'Validation failed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Access forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = 'Resource conflict') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad request') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}