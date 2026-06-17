import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(private notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async runDailyAlerts() {
    this.logger.log('Running daily notification alerts');
    const result = await this.notificationsService.processAllUserAlerts();
    this.logger.log(
      `Processed ${result.usersProcessed} users, sent ${result.notificationsSent} notifications`,
    );
  }
}
