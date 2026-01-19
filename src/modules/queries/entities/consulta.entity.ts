// src/modules/queries/entities/consulta.entity.ts - ✅ ACTUALIZADO

import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index 
} from 'typeorm';
import { Kiosco } from '../../kioscos/entities/kiosco.entity';

@Entity('consultas')
@Index(['fecha_hora']) // Índice para consultas por fecha
@Index(['codigo_barra']) // Índice para búsquedas por producto
@Index(['id_kiosco']) // Índice para búsquedas por kiosco
@Index(['resultado']) // Índice para filtrar por resultado
export class Consulta {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 18 })
  codigo_barra!: string;

  @Column({ type: 'uuid' })
  id_kiosco!: string;

  // ✅ ACTUALIZADO: Valor por defecto 'encontrado'
  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'encontrado',
    comment: 'Valores: encontrado (exitosa) | no_encontrado (fallida)'
  })
  resultado!: string;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_hora!: Date;

  // ═══════════════════════════════════════════════════════════════
  // 🔗 RELACIONES
  // ═══════════════════════════════════════════════════════════════
  @ManyToOne(() => Kiosco, (kiosco) => kiosco.consultas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_kiosco' })
  kiosco!: Kiosco;

  // ═══════════════════════════════════════════════════════════════
  // 🔧 MÉTODO HELPER
  // ═══════════════════════════════════════════════════════════════
  toJSON() {
    return {
      id: this.id,
      codigo_barra: this.codigo_barra,
      id_kiosco: this.id_kiosco,
      resultado: this.resultado,
      es_exitosa: this.resultado === 'encontrado', // ✅ Helper
      fecha_hora: this.fecha_hora,
    };
  }
}