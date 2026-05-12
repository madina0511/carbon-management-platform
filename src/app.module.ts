import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmissionsModule } from './emissions/emissions.module';
import { UploadModule } from './upload/upload.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [EmissionsModule, UploadModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
