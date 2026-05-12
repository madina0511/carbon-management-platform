import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllEmissions(uploadId?: string) {
    try {
      return await this.prisma.emissionRecord.findMany({
        where: uploadId ? { uploadId: parseInt(uploadId) } : undefined,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to fetch emission records',
      );
    }
  }

  async getSummary() {
    try {
      const emissions = await this.prisma.emissionRecord.findMany();

      const totalEmission = emissions.reduce(
        (sum, item) => sum + item.emission,
        0,
      );
      const scope1 = emissions
        .filter((e) => e.scope === 'Scope 1')
        .reduce((s, e) => s + e.emission, 0);
      const scope2 = emissions
        .filter((e) => e.scope === 'Scope 2')
        .reduce((s, e) => s + e.emission, 0);
      const scope3 = emissions
        .filter((e) => e.scope === 'Scope 3')
        .reduce((s, e) => s + e.emission, 0);

      const monthMap: Record<
        string,
        {
          electricity: number;
          material: number;
          transport: number;
          total: number;
        }
      > = {};
      const typeMap: Record<string, 'electricity' | 'material' | 'transport'> =
        {
          전기: 'electricity',
          원소재: 'material',
          운송: 'transport',
        };

      for (const e of emissions) {
        const month = new Date(e.date).toISOString().slice(0, 7);
        if (!monthMap[month])
          monthMap[month] = {
            electricity: 0,
            material: 0,
            transport: 0,
            total: 0,
          };
        const type = typeMap[e.activityType];
        if (type) monthMap[month][type] += e.emission;
        monthMap[month].total += e.emission;
      }

      const categoryMap: Record<
        string,
        { emission: number; scope: string; category: string }
      > = {};
      for (const e of emissions) {
        const key = e.activityType;
        if (!categoryMap[key]) {
          categoryMap[key] = {
            emission: 0,
            scope: e.scope,
            category: e.activityType,
          };
        }
        categoryMap[key].emission += e.emission;
      }

      const byMonth = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data }));

      const byCategory = Object.entries(categoryMap).map(
        ([activityType, data]) => ({ activityType, ...data }),
      );

      return {
        totalEmission: Number(totalEmission.toFixed(2)),
        scope1: Number(scope1.toFixed(2)),
        scope2: Number(scope2.toFixed(2)),
        scope3: Number(scope3.toFixed(2)),
        byMonth,
        byCategory,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to generate emission summary',
      );
    }
  }
}
