// src/modules/videos/entities/video.entity.ts - CORREGIDO
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  UpdateDateColumn,
  Index 
} from 'typeorm';

@Entity('videos')
@Index(['activo'])
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  titulo!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string | null;

  @Column({ type: 'varchar', length: 255 })
  archivo!: string; // Nombre del archivo: video-123.mp4

  @Column({ type: 'varchar', length: 100, nullable: true })
  tipo_mime?: string | null;

  @Column({ type: 'bigint', nullable: true })
  tamanio?: number | null;

  @Column({ type: 'int', nullable: true })
  duracion?: number | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({ type: 'int', default: 0 })
  orden!: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_creacion!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  fecha_actualizacion!: Date;

  // ═══════════════════════════════════════════════════════════════
  // 🔥 FIX: GENERAR URL CORRECTA
  // ═══════════════════════════════════════════════════════════════
  getVideoUrl(baseUrl: string): string {
    // ✅ CORREGIDO: Construir URL completa y válida
    // baseUrl ya viene con protocolo: http://172.20.20.70:3000
    return `${baseUrl}/uploads/videos/${this.archivo}`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔥 FIX: RESPUESTA JSON CORRECTA
  // ═══════════════════════════════════════════════════════════════
  toJSON(baseUrl?: string) {
    // 🔥 Si no se pasa baseUrl, usar variable de entorno o localhost
    const finalBaseUrl = baseUrl || process.env.BASE_URL || 'http://localhost:3000';
    
    // 🔥 CONSTRUIR URL COMPLETA: http://172.20.20.70:3000/uploads/videos/archivo.mp4
    const videoUrl = `${finalBaseUrl}/uploads/videos/${this.archivo}`;
    
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      nombre_archivo: this.archivo, // 🔥 IMPORTANTE: Nombre original del archivo
      
      // ✅ URL COMPLETA para streaming/descarga
      url: videoUrl,
      
      // 📊 Metadatos
      tipo_mime: this.tipo_mime,
      tamanio: this.tamanio,
      duracion: this.duracion,
      activo: this.activo,
      orden: this.orden,
      
      // 📅 Timestamps
      fecha_subida: this.fecha_creacion,
      fecha_actualizacion: this.fecha_actualizacion,
    };
  }
}