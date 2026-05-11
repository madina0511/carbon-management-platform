import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
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
    try {
      if (!file) {
        throw new BadRequestException('Excel file is required');
      }

      const workbook = XLSX.read(file.buffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new BadRequestException('Excel sheet not found');
      }

      const worksheet = workbook.Sheets[sheetName];

      const emissionFactors: Record<string, number> = {
        한국전력: 0.456,
        '플라스틱 1': 2.3,
        '플라스틱 2': 3.2,
        트럭: 3.5,
      };

      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
      console.log(rawData[0]);
      const calculatedData = rawData.map((row) => {
        const description = row['설명'];

        const amount = Number(row['량'] || 0);

        const factor = emissionFactors[description] || 0;

        const emission = Number((amount * factor).toFixed(2));

        return {
          date: row['일자(월분)'],
          activityType: row['활동 유형'],
          description,
          amount,
          unit: row['단위'],
          factor,
          emission,
        };
      });

      return {
        message: 'Excel uploaded successfully',
        count: calculatedData.length,
        data: calculatedData,
      };
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException('Failed to process Excel file');
    }
  }
}
