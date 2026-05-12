import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';

type EmissionScope = 'Scope 1' | 'Scope 2' | 'Scope 3';

const EMISSION_FACTORS: Record<string, number> = {
  한국전력: 0.456,
  '플라스틱 1': 2.3,
  '플라스틱 2': 3.2,
  트럭: 3.5,
};

const ACTIVITY_SCOPE_MAP: Record<string, EmissionScope> = {
  전기: 'Scope 2',
  운송: 'Scope 3',
  원소재: 'Scope 3',
  연료: 'Scope 1',
};

function parseExcelDate(rawDate: unknown): Date {
  if (!rawDate) return new Date();
  if (typeof rawDate === 'number') {
    const utcMs = (rawDate - 25569) * 86400 * 1000;
    const d = new Date(utcMs);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  const parsed = new Date(rawDate as string);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getUploads() {
    try {
      return await this.prisma.upload.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          createdAt: true,
          _count: { select: { emissions: true } },
        },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch uploads');
    }
  }

  @Post('excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @UploadedFile()
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    // ── Duplicate check ──────────────────────────────────────────
    const existing = await this.prisma.upload.findFirst({
      where: { fileName: file.originalname },
    });
    if (existing) {
      throw new BadRequestException(
        `"${file.originalname}" has already been uploaded. Delete it first to re-upload.`,
      );
    }
    // ─────────────────────────────────────────────────────────────

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new BadRequestException('Excel sheet not found');
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawData: Record<string, unknown>[] =
        XLSX.utils.sheet_to_json(worksheet);

      if (rawData.length === 0) {
        throw new BadRequestException('Excel file is empty');
      }

      const calculatedData = rawData.map((row) => {
        const description = row['설명'] as string;
        const activityType = row['활동 유형'] as string;
        const amount = Number(row['량'] ?? 0);
        const factor = EMISSION_FACTORS[description] ?? 0;
        const emission = Number((amount * factor).toFixed(2));
        const date = parseExcelDate(row['일자(원본)']);
        const scope: EmissionScope =
          ACTIVITY_SCOPE_MAP[activityType] ?? 'Scope 3';

        return {
          date,
          activityType,
          description,
          amount,
          unit: row['단위'] as string,
          factor,
          emission,
          scope,
        };
      });

      const upload = await this.prisma.upload.create({
        data: {
          fileName: file.originalname,
          emissions: {
            createMany: {
              data: calculatedData.map((item) => ({
                date: item.date,
                activityType: item.activityType,
                description: item.description,
                amount: item.amount,
                unit: item.unit,
                emissionFactor: item.factor,
                emission: item.emission,
                scope: item.scope,
              })),
            },
          },
        },
      });

      return {
        message: 'Excel uploaded successfully',
        uploadId: upload.id,
        fileName: upload.fileName,
        count: calculatedData.length,
        data: calculatedData,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('[UploadController] Excel processing failed:', error);
      throw new InternalServerErrorException('Failed to process Excel file');
    }
  }
  @Delete(':id')
  async deleteUpload(@Param('id') id: string) {
    try {
      await this.prisma.emissionRecord.deleteMany({
        where: { uploadId: parseInt(id) },
      });
      await this.prisma.upload.delete({
        where: { id: parseInt(id) },
      });
      return { message: 'Deleted successfully' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to delete upload');
    }
  }
}
