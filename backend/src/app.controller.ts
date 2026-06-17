import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { getPublicBillingConfig } from './config/billing.config';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('config/billing')
  @ApiOperation({ summary: 'Public billing / free-trial config' })
  getBillingConfig() {
    return getPublicBillingConfig();
  }
}
