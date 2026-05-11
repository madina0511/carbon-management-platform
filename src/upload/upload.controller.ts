import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';

@Controller('upload')
export class UploadController {
  @Post('excel')
  @UseInterceptors(FileInterceptor('file'))
  uploadExcel(@UploadedFile() file: any) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(data);

    return {
      message: 'Excel uploaded successfully',
      data,
    };
  }
}
