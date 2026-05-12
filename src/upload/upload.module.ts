import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [MulterModule.register({}), PrismaModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
