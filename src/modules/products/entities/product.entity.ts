// src/modules/products/entities/product.entity.ts - ✅ CORREGIDO

import { 
  Entity, 
  Column, 
  PrimaryColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index 
} from 'typeorm';

@Entity('productos')
@Index(['categoria'])
@Index(['precio'])
export class Product {
  @PrimaryColumn({ type: 'varchar', length: 18 })
  codigo!: string;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  nombre!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio!: number;

  @Column({ type: 'text' })
  detalles!: string;

  @Column({ type: 'varchar', length: 255, default: 'default-product.jpg' })
  imagen!: string;

  @Column({ type: 'varchar', length: 100 })
  categoria!: string;

  @Column({ type: 'varchar', length: 200, nullable: true, default: '' })
  promocion!: string;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_creacion!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  fecha_actualizacion!: Date;

  // ═══════════════════════════════════════════════════════════════
  // 🔧 MÉTODO HELPER PARA GENERAR URL DE IMAGEN - ✅ CORREGIDO
  // ═══════════════════════════════════════════════════════════════
  getImagenUrl(baseUrl: string): string {
    // ✅ SOLUCIÓN: Solo construir la ruta, sin duplicar protocolo
    // baseUrl viene como: "http://172.20.20.70:3000"
    // Resultado: "http://172.20.20.70:3000/public/imagenes/nombre.jpg"
    
    // Limpiar baseUrl de posibles barras finales
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    
    return `${cleanBaseUrl}/public/imagenes/${this.imagen}`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔧 MÉTODO toJSON - ✅ CORREGIDO
  // ═══════════════════════════════════════════════════════════════
  toJSON(baseUrl?: string) {
    return {
      codigo: this.codigo,
      nombre: this.nombre,
      precio: parseFloat(this.precio.toString()),
      detalles: this.detalles,
      imagen: this.imagen,
      // ✅ CORRECTO: Generar URL completa solo si baseUrl existe
      imagen_url: baseUrl ? this.getImagenUrl(baseUrl) : undefined,
      categoria: this.categoria,
      promocion: this.promocion || '',
      fecha_creacion: this.fecha_creacion,
      fecha_actualizacion: this.fecha_actualizacion,
    };
  }
}