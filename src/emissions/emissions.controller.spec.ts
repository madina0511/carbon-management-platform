import { Test, TestingModule } from '@nestjs/testing';
import { EmissionsController } from './emissions.controller';

describe('EmissionsController', () => {
  let controller: EmissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmissionsController],
    }).compile();

    controller = module.get<EmissionsController>(EmissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
