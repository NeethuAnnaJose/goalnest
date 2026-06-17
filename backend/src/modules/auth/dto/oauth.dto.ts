import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppleLoginDto {
  @ApiProperty({ description: 'Apple identity token (JWT)' })
  @IsString()
  identityToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class GoogleMobileLoginDto {
  @ApiProperty({ description: 'Google ID token from mobile SDK' })
  @IsString()
  idToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceType?: string;
}
