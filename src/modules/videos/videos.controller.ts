// src/modules/videos/videos.controller.ts - ✅ CORREGIDO COMPLETO
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response, Request } from 'express';
import { createReadStream, existsSync, statSync } from 'fs';
import * as path from 'path';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UpdateVideoOrderDto } from './dto/update-video-order.dto';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) { }

  // ═══════════════════════════════════════════════════════════════
  // 📤 SUBIR VIDEO
  // ═══════════════════════════════════════════════════════════════
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: '/app/uploads/videos', // 🔥 CORREGIDO: Ruta absoluta
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `video-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('video/')) {
          return callback(new Error('Solo se permiten archivos de video'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() createVideoDto: CreateVideoDto,
  ) {
    return this.videosService.create(createVideoDto, file);
  }

  // ═══════════════════════════════════════════════════════════════
  // 📖 OBTENER TODOS LOS VIDEOS
  // ═══════════════════════════════════════════════════════════════
  @Get()
  async findAll(@Req() req: Request) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 [GET /videos] Obteniendo videos activos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const videos = await this.videosService.findAll();
    const baseUrl = this.videosService.baseUrl;

    console.log('🌐 Base URL configurada:', baseUrl);
    console.log(`✅ Total videos: ${videos.length}`);

    videos.forEach((v, i) => {
      const videoUrl = v.toJSON(baseUrl).url;
      console.log(`   ${i + 1}. ${v.titulo}`);
      console.log(`      URL: ${videoUrl}`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return videos.map((video) => video.toJSON(baseUrl));
  }

  // ═══════════════════════════════════════════════════════════════
  // 🎬 STREAMING DE VIDEO (DESCARGA DIRECTA)
  // ═══════════════════════════════════════════════════════════════
  @Get(':id/stream')
  async streamVideo(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎬 [STREAM] Video ID: ${id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const video = await this.videosService.findOne(id);

    // 🔥 IMPORTANTE: Usar ruta absoluta del bind mount
    const videoPath = path.join('/app/uploads/videos', video.archivo);

    if (!existsSync(videoPath)) {
      console.error('❌ Archivo no encontrado:', videoPath);
      throw new NotFoundException('Archivo de video no encontrado');
    }

    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    console.log('📊 Info:');
    console.log('  - Archivo:', video.archivo);
    console.log('  - Ruta completa:', videoPath);
    console.log('  - Tamaño:', (fileSize / (1024 * 1024)).toFixed(2), 'MB');
    console.log('  - Range:', range || 'N/A');

    if (range) {
      // Streaming parcial (HTTP 206)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = createReadStream(videoPath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.tipo_mime || 'video/mp4',
        'Cache-Control': 'public, max-age=31536000',
      };

      res.writeHead(206, head);
      file.pipe(res);

      console.log(`✅ Streaming parcial: ${start}-${end}/${fileSize}`);
    } else {
      // Descarga completa (HTTP 200)
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.tipo_mime || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      };

      res.writeHead(200, head);
      createReadStream(videoPath).pipe(res);

      console.log('✅ Descarga completa iniciada');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔄 ACTUALIZAR ORDEN
  // ═══════════════════════════════════════════════════════════════
  @Put('order')
  async updateOrder(@Body() updateOrderDto: UpdateVideoOrderDto) {
    console.log('🔄 Actualizando orden de videos');
    return this.videosService.updateOrder(updateOrderDto.videoIds);
  }

  // ═══════════════════════════════════════════════════════════════
  // ✏️ ACTUALIZAR VIDEO
  // ═══════════════════════════════════════════════════════════════
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto) {
    return this.videosService.update(id, updateVideoDto);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🗑️ ELIMINAR VIDEO
  // ═══════════════════════════════════════════════════════════════
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.videosService.delete(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════
  @Get('stats/summary')
  async getStats() {
    return this.videosService.getStats();
  }
}