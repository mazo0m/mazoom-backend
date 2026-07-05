import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
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

    // Global Cache — uses Redis if REDIS_URL is configured, falls back to memory
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          const store = await redisStore({
            url: redisUrl,
            ttl: 60000, // 60 seconds
          });
          return { store };
        }
        return {
          ttl: 60000, // 60 seconds
        };
      },
    }),

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
