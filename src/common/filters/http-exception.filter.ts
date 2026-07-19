import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as arTranslations from '../i18n/ar.json';
import * as enTranslations from '../i18n/en.json';

interface NestErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

/**
 * Global exception filter that handles ALL exceptions (not just HttpException).
 * - Translates error messages to Arabic/English based on Accept-Language header
 * - Returns a consistent error response shape
 * - Logs unexpected errors with stack traces
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine language
    const acceptLang = request.headers['accept-language'] || '';
    const lang = acceptLang.toString().toLowerCase().includes('en')
      ? 'en'
      : 'ar';

    // Log unexpected (non-HTTP) exceptions with full stack trace
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Build response message
    let responseMessage: string | string[] | undefined;
    let errorType: string | undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as
        string | NestErrorResponse;

      if (typeof exceptionResponse === 'string') {
        responseMessage = this.translateMessage(exceptionResponse, lang);
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        errorType = exceptionResponse.error;
        if (Array.isArray(exceptionResponse.message)) {
          responseMessage = exceptionResponse.message.map((m: string) =>
            this.translateMessage(m, lang),
          );
        } else if (typeof exceptionResponse.message === 'string') {
          responseMessage = this.translateMessage(
            exceptionResponse.message,
            lang,
          );
        } else {
          responseMessage = exceptionResponse.message;
        }
      }
    } else {
      // For non-HTTP exceptions, never expose internals to the client
      responseMessage =
        lang === 'en' ? 'An unexpected error occurred' : 'حدث خطأ غير متوقع';
      errorType = 'Internal Server Error';
    }

    response.status(status).json({
      statusCode: status,
      message: responseMessage,
      error: errorType,
      timestamp: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────
  // Translation Helper
  // ──────────────────────────────────────────────

  private translateMessage(msg: string, lang: string): string {
    const parts = msg.split('|');
    const key = parts[0];
    const args = parts.slice(1);

    const dictionary: Record<string, string> =
      lang === 'en' ? enTranslations : arTranslations;

    let translation = dictionary[key];

    if (translation) {
      args.forEach((arg, index) => {
        translation = translation.replace(`{${index}}`, arg);
      });
      return translation;
    }

    // Check if message itself exists in dictionary directly
    if (dictionary[msg]) {
      return dictionary[msg];
    }

    return msg; // Fallback to original if no translation matches
  }
}
