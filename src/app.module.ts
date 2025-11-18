import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthieModule } from './healthie/healthie.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HealthieModule,
  ],
})
export class AppModule {}

