import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  AdminAnalyticsQueryDto,
  AdminBroadcastNotificationDto,
  AdminTicketFilterDto,
  AdminTicketReplyDto,
  AdminUpdateTicketDto,
  AdminUpdateUserDto,
  AdminUserFilterDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Admin dashboard overview stats' })
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  listUsers(@Query() filters: AdminUserFilterDto) {
    return this.adminService.listUsers(filters);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user role, plan, or suspend' })
  updateUser(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto, adminId);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List user subscriptions' })
  listSubscriptions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listSubscriptions(page, limit);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List subscription plans' })
  listPlans() {
    return this.adminService.listPlans();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Platform analytics' })
  getAnalytics(@Query() query: AdminAnalyticsQueryDto) {
    return this.adminService.getAnalytics(query);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List all generated reports' })
  listReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listReports(page, limit);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue and payment analytics' })
  getRevenue(@Query('period') period?: 'month' | 'year' | 'all') {
    return this.adminService.getRevenue(period);
  }

  @Get('tickets')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'List support tickets' })
  listTickets(@Query() filters: AdminTicketFilterDto) {
    return this.adminService.listTickets(filters);
  }

  @Patch('tickets/:id')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Update support ticket' })
  updateTicket(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AdminUpdateTicketDto,
  ) {
    return this.adminService.updateTicket(id, dto, adminId);
  }

  @Post('tickets/:id/reply')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Reply to support ticket' })
  replyToTicket(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AdminTicketReplyDto,
  ) {
    return this.adminService.replyToTicket(id, adminId, dto);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List all notifications' })
  listNotifications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.adminService.listNotifications(page, limit, type);
  }

  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Broadcast notification to users' })
  broadcast(
    @CurrentUser('id') adminId: string,
    @Body() dto: AdminBroadcastNotificationDto,
  ) {
    return this.adminService.broadcastNotification(dto, adminId);
  }
}
