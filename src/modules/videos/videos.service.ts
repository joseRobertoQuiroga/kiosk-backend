// src/modules/videos/videos.service.ts - MIGRADO A POSTGRESQL
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VideosService implements OnModuleInit {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async onModuleInit() {
    const count = await this.videoRepository.count();
    console.log(`✅ VideosService inicializado con ${count} videos en PostgreSQL`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🎬 CREAR VIDEO
  // ═══════════════════════════════════════════════════════════════

  async create(createVideoDto: CreateVideoDto, file: Express.Multer.File): Promise<Video> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 [CREATE] Creando nuevo video');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const nuevoVideo = this.videoRepository.create({
      titulo: createVideoDto.titulo || file.originalname,
      descripcion: createVideoDto.descripcion || null,
      archivo: file.filename,
      tipo_mime: file.mimetype,
      tamanio: file.size,
      duracion: null, // Se puede calcular con ffprobe si lo necesitas
      activo: createVideoDto.activo ?? true,
      orden: createVideoDto.orden ?? 0,
    });

    const saved = await this.videoRepository.save(nuevoVideo);

    console.log('✅ Video guardado:', {
      id: saved.id,
      titulo: saved.titulo,
      archivo: saved.archivo,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return saved;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 BUSCAR VIDEOS
  // ═══════════════════════════════════════════════════════════════

  async findAll(): Promise<Video[]> {
    return await this.videoRepository.find({
      where: { activo: true },
      order: { orden: 'ASC', fecha_creacion: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.videoRepository.findOne({
      where: { id }
    });

    if (!video) {
      throw new NotFoundException(`Video con ID ${id} no encontrado`);
    }

    console.log('✅ Video encontrado:', video.titulo);
    return video;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔄 ACTUALIZAR ORDEN
  // ═══════════════════════════════════════════════════════════════

  async updateOrder(videoIds: string[]): Promise<void> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 [UPDATE ORDER] Actualizando orden de videos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (let i = 0; i < videoIds.length; i++) {
      const video = await this.videoRepository.findOne({
        where: { id: videoIds[i] }
      });

      if (video) {
        video.orden = i;
        await this.videoRepository.save(video);
        console.log(`📹 ${video.titulo} -> Orden: ${i}`);
      }
    }

    console.log('✅ Orden actualizado correctamente');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // ═══════════════════════════════════════════════════════════════
  // ✏️ ACTUALIZAR VIDEO
  // ═══════════════════════════════════════════════════════════════

  async update(id: string, updateData: Partial<CreateVideoDto>): Promise<Video> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✏️ [UPDATE] Actualizando video: ${id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const video = await this.findOne(id);

    // Actualizar campos permitidos
    if (updateData.titulo !== undefined) video.titulo = updateData.titulo;
    if (updateData.descripcion !== undefined) video.descripcion = updateData.descripcion;
    if (updateData.activo !== undefined) video.activo = updateData.activo;
    if (updateData.orden !== undefined) video.orden = updateData.orden;

    const updated = await this.videoRepository.save(video);

    console.log('✅ Video actualizado:', updated.titulo);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🗑️ ELIMINAR VIDEO
  // ═══════════════════════════════════════════════════════════════

  async delete(id: string): Promise<void> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🗑️ [DELETE] Eliminando video: ${id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const video = await this.findOne(id);

    // Construir ruta del archivo
    const videoPath = path.join(process.cwd(), 'uploads', 'videos', video.archivo);

    // Eliminar archivo físico
    if (fs.existsSync(videoPath)) {
      try {
        fs.unlinkSync(videoPath);
        console.log('🗑️ Archivo eliminado:', videoPath);
      } catch (error) {
        console.error('⚠️ Error eliminando archivo físico:', error);
      }
    }

    // Eliminar registro de BD
    await this.videoRepository.remove(video);

    console.log(`✅ Video eliminado: ${video.titulo}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════

  async getStats() {
    const [total, activos] = await Promise.all([
      this.videoRepository.count(),
      this.videoRepository.count({ where: { activo: true } })
    ]);

    const videos = await this.videoRepository.find();
    
    // Calcular tamaño total (manejo de nulls)
    const totalSize = videos.reduce((sum, v) => {
      return sum + (v.tamanio ?? 0);
    }, 0);

    return {
      total,
      activos,
      inactivos: total - activos,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  }
}