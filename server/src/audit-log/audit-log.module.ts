import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogMiddleware } from './audit-log.middleware';

@Module({
  imports: [PrismaModule],
  providers: [AuditLogService],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditLogMiddleware)
      .exclude(
        { path: 'auth/(.*)', method: RequestMethod.ALL },
        { path: 'auth', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
