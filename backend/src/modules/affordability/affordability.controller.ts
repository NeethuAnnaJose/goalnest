import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AffordabilityService } from './affordability.service';
import { AffordabilityDto } from './dto/affordability.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Can I Afford This')
@ApiBearerAuth()
@Controller('affordability')
export class AffordabilityController {
  constructor(private affordabilityService: AffordabilityService) {}

  @Post()
  @ApiOperation({ summary: 'Analyze if a purchase is affordable' })
  analyze(@CurrentUser('id') userId: string, @Body() dto: AffordabilityDto) {
    return this.affordabilityService.analyze(userId, dto);
  }
}
