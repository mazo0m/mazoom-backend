import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    PrismaModule,
    AuthModule,
    TemplateModule,
    PurchaseRequestModule,
    PurchaseModule,
    InvitationModule,
    RsvpModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
