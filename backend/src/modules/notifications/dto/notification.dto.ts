import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: Record<string, unknown>;
}

export class NotificationFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

export class UpdateNotificationPrefsDto {
  @ApiPropertyOptional()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  smsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  emiReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  goalProgress?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  overspendingAlerts?: boolean;
}
