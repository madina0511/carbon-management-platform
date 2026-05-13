import { Controller, Get, Query } from '@nestjs/common';
import { EmissionsService } from './emissions.service';

@Controller('emissions')
export class EmissionsController {
  constructor(private readonly emissionsService: EmissionsService) {}

  @Get()
  getAllEmissions(@Query('uploadId') uploadId?: string) {
    return this.emissionsService.getAllEmissions(uploadId);
  }
  @Get('summary')
  getSummary(@Query('uploadId') uploadId?: string) {
    return this.emissionsService.getSummary(
      uploadId ? parseInt(uploadId) : undefined,
    );
  }
}
