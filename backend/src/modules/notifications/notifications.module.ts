import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationScheduler } from './notification.scheduler';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
