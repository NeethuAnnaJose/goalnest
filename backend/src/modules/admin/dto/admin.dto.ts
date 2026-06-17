import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import {
  NotificationChannel,
  NotificationType,
  PlanTier,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@prisma/client';
import { Type } from 'class-transformer';

export class AdminUserFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: PlanTier })
  @IsOptional()
  @IsEnum(PlanTier)
  planTier?: PlanTier;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: PlanTier })
  @IsOptional()
  @IsEnum(PlanTier)
  planTier?: PlanTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  suspended?: boolean;
}

export class AdminTicketFilterDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminUpdateTicketDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class AdminTicketReplyDto {
  @ApiPropertyOptional()
  @IsString()
  message: string;
}

export class AdminBroadcastNotificationDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Target user IDs; omit to broadcast to all users' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}

export class AdminAnalyticsQueryDto {
  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(365)
  days?: number = 30;
}
