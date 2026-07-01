import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as arTranslations from '../i18n/ar.json';
import * as enTranslations from '../i18n/en.json';

interface NestErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as
      string | NestErrorResponse;

    const acceptLang = request.headers['accept-language'] || '';
    const lang = acceptLang.toString().toLowerCase().includes('en')
      ? 'en'
      : 'ar';

    const translateMessage = (msg: string): string => {
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

      // Dynamic regex matching (IDs, slugs, request status states as fallback)
      let match: RegExpMatchArray | null;
      if ((match = msg.match(/^Purchase with ID "([^"]+)" not found$/))) {
        return lang === 'en'
          ? msg
          : `عملية الشراء بالمعرف "${match[1]}" غير موجودة`;
      }
      if ((match = msg.match(/^Invitation with ID "([^"]+)" not found$/))) {
        return lang === 'en' ? msg : `الدعوة بالمعرف "${match[1]}" غير موجودة`;
      }
      if ((match = msg.match(/^Template with ID "([^"]+)" not found$/))) {
        return lang === 'en' ? msg : `القالب بالمعرف "${match[1]}" غير موجود`;
      }
      if (
        (match = msg.match(/^Purchase request with ID "([^"]+)" not found$/))
      ) {
        return lang === 'en'
          ? msg
          : `طلب الشراء بالمعرف "${match[1]}" غير موجود`;
      }
      if ((match = msg.match(/^Invitation with slug "([^"]+)" not found$/))) {
        return lang === 'en' ? msg : `الدعوة بالرابط "${match[1]}" غير موجودة`;
      }
      if (
        (match = msg.match(
          /^The slug "([^"]+)" is already taken\. Please choose a different one\.$/,
        ))
      ) {
        return lang === 'en'
          ? msg
          : `الرابط "${match[1]}" محجوز بالفعل. يرجى اختيار رابط آخر.`;
      }
      if (
        (match = msg.match(
          /^Purchase request has already been ([^.]+)\. Only PENDING requests can be updated\.$/,
        ))
      ) {
        if (lang === 'en') return msg;
        const statusAr =
          match[1] === 'approved'
            ? 'مقبولاً'
            : match[1] === 'rejected'
              ? 'مرفوضاً'
              : match[1];
        return `طلب الشراء بالفعل أصبح ${statusAr}. يمكن فقط تعديل الطلبات المعلقة.`;
      }

      return msg; // Fallback to original English if no translation matches
    };

    let responseMessage: string | string[] | undefined;
    if (typeof exceptionResponse === 'string') {
      responseMessage = translateMessage(exceptionResponse);
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      if (Array.isArray(exceptionResponse.message)) {
        responseMessage = exceptionResponse.message.map((m: string) =>
          translateMessage(m),
        );
      } else if (typeof exceptionResponse.message === 'string') {
        responseMessage = translateMessage(exceptionResponse.message);
      } else {
        responseMessage = exceptionResponse.message;
      }
    }

    const modifiedResponse =
      typeof exceptionResponse === 'object'
        ? { ...exceptionResponse, message: responseMessage }
        : { statusCode: status, message: responseMessage };

    response.status(status).json(modifiedResponse);
  }
}
