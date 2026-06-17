import { Controller, Get, Put, Body, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/devices')
  @ApiOperation({ summary: 'List registered devices' })
  getDevices(@CurrentUser('id') userId: string) {
    return this.usersService.getDevices(userId);
  }

  @Delete('me/devices/:id')
  @ApiOperation({ summary: 'Revoke device access' })
  revokeDevice(@CurrentUser('id') userId: string, @Param('id') deviceId: string) {
    return this.usersService.revokeDevice(userId, deviceId);
  }
}
