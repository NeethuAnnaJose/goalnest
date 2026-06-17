import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  NotificationFilterDto,
  UpdateNotificationPrefsDto,
} from './dto/notification.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  findAll(@CurrentUser('id') userId: string, @Query() filters: NotificationFilterDto) {
    return this.notificationsService.findAll(userId, filters);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  unreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  updatePrefs(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.notificationsService.updatePreferences(userId, dto);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markRead(userId, id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.delete(userId, id);
  }

  @Post('emi-reminders')
  @ApiOperation({ summary: 'Trigger EMI reminder notifications' })
  emiReminders(@CurrentUser('id') userId: string) {
    return this.notificationsService.sendEmiReminders(userId);
  }

  @Post('budget-alerts')
  @ApiOperation({ summary: 'Trigger budget overspending notifications' })
  budgetAlerts(@CurrentUser('id') userId: string) {
    return this.notificationsService.sendOverspendingAlerts(userId);
  }

  @Post('goal-alerts')
  @ApiOperation({ summary: 'Trigger goal progress milestone notifications' })
  goalAlerts(@CurrentUser('id') userId: string) {
    return this.notificationsService.sendGoalProgressAlerts(userId);
  }

  @Post('process-alerts')
  @ApiOperation({ summary: 'Run all notification alerts (EMI, budget, goals)' })
  processAlerts(@CurrentUser('id') userId: string) {
    return this.notificationsService.processUserAlerts(userId);
  }
}
