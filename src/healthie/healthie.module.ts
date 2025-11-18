import { Module } from '@nestjs/common';
import { HealthieController } from './healthie.controller';
import { HealthieService } from './healthie.service';

@Module({
  controllers: [HealthieController],
  providers: [HealthieService],
})
export class HealthieModule {}

