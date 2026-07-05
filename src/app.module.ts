import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TemplateModule } from './template/template.module';
import { PurchaseRequestModule } from './purchase-request/purchase-request.module';
import { PurchaseModule } from './purchase/purchase.module';
import { InvitationModule } from './invitation/invitation.module';
import { RsvpModule } from './rsvp/rsvp.module';
import { UserModule } from './user/user.module';
import { UploadModule } from './upload/upload.module';
import { TestimonialModule } from './testimonial/testimonial.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Global rate limiting — 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),

    PrismaModule,
    AuthModule,
    TemplateModule,
    PurchaseRequestModule,
    PurchaseModule,
    InvitationModule,
    RsvpModule,
    UserModule,
    UploadModule,
    TestimonialModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
