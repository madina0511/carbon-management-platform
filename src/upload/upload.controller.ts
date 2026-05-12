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
import { PrismaService } from '../prisma/prisma.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly prisma: PrismaService) {}
  @Post('excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: any) {
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
      const recordsToSave = calculatedData.map((item) => ({
        date: item.date ? new Date(item.date) : new Date(),
        activityType: item.activityType,
        description: item.description,
        amount: item.amount,
        unit: item.unit,
        emissionFactor: item.factor,
        emission: item.emission,
        scope:
          item.activityType === '전기'
            ? 'Scope 2'
            : item.activityType === '운송'
              ? 'Scope 3'
              : 'Scope 1',
      }));
      await this.prisma.emissionRecord.deleteMany();
      await this.prisma.emissionRecord.createMany({
        data: recordsToSave,
      });

      return {
        message: 'Excel uploaded successfully',
        count: calculatedData.length,
        data: calculatedData,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process Excel file');
    }
  }
}
