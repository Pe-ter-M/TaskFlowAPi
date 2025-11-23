import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface SuccessResponse<T> {
    success: boolean;
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    data: T;
}

@Injectable()
export class SuccessResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse();

        // Get the current status code (default to 200 if not set yet)
        const statusCode = response.statusCode || 200;

        return next.handle().pipe(
            map((data) => {
                // If data is already formatted by a service, use it
                if (data && typeof data === 'object' && 'success' in data) {
                    return {
                        ...data,
                        timestamp: new Date().toISOString(),
                        path: request.url,
                    };
                }

                // Determine message based on HTTP method and status code
                const message = this.getSuccessMessage(request.method, statusCode);

                // Format the response consistently
                return {
                    success: true,
                    message,
                    statusCode,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    data: data || null,
                };
            }),
        );
    }

    private getSuccessMessage(method: string, statusCode: number): string {
        switch (method) {
            case 'GET':
                return statusCode === 200 ? 'Data retrieved successfully' : 'Operation completed successfully';
            case 'POST':
                return statusCode === 201 ? 'Resource created successfully' : 'Operation completed successfully';
            case 'PUT':
            case 'PATCH':
                return 'Resource updated successfully';
            case 'DELETE':
                return 'Resource deleted successfully';
            default:
                return 'Operation completed successfully';
        }
    }
}