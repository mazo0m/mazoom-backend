import { Global, Module } from '@nestjs/common';
import { AbuseService } from './abuse.service';
import { AuditLogService } from './audit-log.service';

@Global()
@Module({
  providers: [AbuseService, AuditLogService],
  exports: [AbuseService, AuditLogService],
})
export class AbuseModule {}

