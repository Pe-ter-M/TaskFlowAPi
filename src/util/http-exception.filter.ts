import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string | object;
        let error: string;
        let validationErrors: any[] | undefined;

        // Handle different types of exceptions
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                error = exception.message;
            } else if (typeof exceptionResponse === 'object') {
                // Handle NestJS built-in exceptions
                const responseObj = exceptionResponse as any;

                // Check if this is a validation error from our custom pipe
                if (responseObj.message === 'Validation failed' && responseObj.errors) {
                    message = 'Validation failed';
                    error = 'Bad Request';
                    validationErrors = responseObj.errors; // Preserve validation details
                } else {
                    message = responseObj.message || 'An error occurred';
                    error = responseObj.error || exception.name;
                }
            } else {
                message = 'An error occurred';
                error = exception.name;
            }
        } else if (exception instanceof Error) {
            // Handle generic JavaScript errors
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = this.getUserFriendlyMessage(exception);
            error = exception.name;

            // Log technical details for developers
            this.logger.error(`Unhandled Error: ${exception.message}`, exception.stack);
        } else {
            // Handle unknown errors
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'An unexpected error occurred';
            error = 'Internal Server Error';
        }

        // Build response object
        const responseBody: any = {
            success: false,
            message,
            error,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        // Add validation errors if they exist
        if (validationErrors) {
            responseBody.errors = validationErrors;
        }

        // Send formatted response
        response.status(status).json(responseBody);
    }
    private getUserFriendlyMessage(exception: Error): string {
        // Handle common database errors
        if (exception.name.includes('QueryFailedError')) {
            return this.handleDatabaseError(exception);
        }

        // Handle validation errors
        if (exception.name.includes('ValidationError')) {
            return 'The provided data is invalid. Please check your input.';
        }

        // Handle common errors with user-friendly messages
        const errorMessage = exception.message.toLowerCase();

        if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
            return 'This record already exists. Please use a different value.';
        }

        if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
            return 'The referenced record does not exist.';
        }

        if (errorMessage.includes('not null constraint') || errorMessage.includes('null value')) {
            return 'Required information is missing. Please fill all required fields.';
        }

        // Default user-friendly message for unhandled errors
        return 'Something went wrong. Please try again later.';
    }

    private handleDatabaseError(exception: any): string {
        const message = exception.message.toLowerCase();
        const detail = exception.detail?.toLowerCase() || '';

        // PostgreSQL specific errors
        if (detail.includes('already exists')) {
            return 'This record already exists in the system.';
        }

        if (detail.includes('is not present in table')) {
            return 'The referenced record was not found.';
        }

        if (message.includes('null value') || detail.includes('null value')) {
            return 'Required information is missing. Please provide all necessary details.';
        }

        return 'A database error occurred. Please check your input.';
    }
}