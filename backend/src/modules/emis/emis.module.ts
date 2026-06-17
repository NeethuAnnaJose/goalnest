import { Module } from '@nestjs/common';
import { EmisService } from './emis.service';
import { EmisController } from './emis.controller';

@Module({
  controllers: [EmisController],
  providers: [EmisService],
  exports: [EmisService],
})
export class EmisModule {}
