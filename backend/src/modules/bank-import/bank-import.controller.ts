import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { BankImportService } from './bank-import.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BankImportOptionsDto } from './dto/bank-import.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@ApiTags('Bank Import')
@ApiBearerAuth()
@Controller('bank-import')
export class BankImportController {
  constructor(private bankImportService: BankImportService) {}

  @Post()
  @ApiOperation({ summary: 'Import bank statement (PDF, CSV, XLSX)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        preview: { type: 'boolean', default: false },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  importStatement(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query() options: BankImportOptionsDto,
  ) {
    if (!file) throw new BadRequestException('File is required');

    return this.bankImportService.importStatement(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype,
      options.preview ?? false,
    );
  }
}
