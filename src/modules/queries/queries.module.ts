// src/modules/queries/queries.module.ts - ACTUALIZADO
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueriesController } from './queries.controller';
import { QueriesService } from './queries.service';
import { Consulta } from './entities/consulta.entity';
import { KioscosModule } from '../kioscos/kioscos.module'; // IMPORTANTE

@Module({
  imports: [
    // 🔥 REGISTRAR ENTIDAD DE CONSULTAS
    TypeOrmModule.forFeature([Consulta]),
    
    // 🔥 IMPORTAR KioscosModule para poder usar KioscosService
    KioscosModule,
  ],
  controllers: [QueriesController],
  providers: [QueriesService],
})
export class QueriesModule {}