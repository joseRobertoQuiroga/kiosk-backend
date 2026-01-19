// kioscos/kioscos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KioscosController } from './kioscos.controller';
import { KioscosService } from './kioscos.service';
import { Kiosco } from './entities/kiosco.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Kiosco]), // 🔥 CLAVE ABSOLUTA
  ],
  controllers: [KioscosController],
  providers: [KioscosService],
  exports: [KioscosService],
})
export class KioscosModule {}
