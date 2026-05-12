import { Controller, Get } from '@nestjs/common';
import { EmissionsService } from './emissions.service';

@Controller('emissions')
export class EmissionsController {
  constructor(private readonly emissionsService: EmissionsService) {}

  @Get()
  async getAllEmissions() {
    return this.emissionsService.getAllEmissions();
  }

  @Get('summary')
  async getSummary() {
    return this.emissionsService.getSummary();
  }
}
