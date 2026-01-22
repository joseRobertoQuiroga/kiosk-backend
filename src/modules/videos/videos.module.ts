// src/modules/videos/videos.module.ts - ACTUALIZADO CON POSTGRESQL
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Video } from './entities/video.entity';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [
    // 🔥 REGISTRAR ENTIDAD DE VIDEOS
    TypeOrmModule.forFeature([Video]),
    
    // 🔥 CONFIGURAR MULTER PARA VIDEOS
    MulterModule.register({
      dest: '/app/uploads/videos',
    }),
  ],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}