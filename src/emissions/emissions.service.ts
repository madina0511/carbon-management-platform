import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllEmissions() {
    try {
      return await this.prisma.emissionRecord.findMany({
        orderBy: {
          createdAt: 'desc',
        },
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
        .filter((item) => item.scope === 'Scope 1')
        .reduce((sum, item) => sum + item.emission, 0);

      const scope2 = emissions
        .filter((item) => item.scope === 'Scope 2')
        .reduce((sum, item) => sum + item.emission, 0);

      const scope3 = emissions
        .filter((item) => item.scope === 'Scope 3')
        .reduce((sum, item) => sum + item.emission, 0);

      return {
        totalEmission: Number(totalEmission.toFixed(2)),
        scope1: Number(scope1.toFixed(2)),
        scope2: Number(scope2.toFixed(2)),
        scope3: Number(scope3.toFixed(2)),
      };
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Failed to generate emission summary',
      );
    }
  }
}
