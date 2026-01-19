// src/modules/kioscos/entities/kiosco.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index 
} from 'typeorm';
import { Consulta } from '../../queries/entities/consulta.entity';

@Entity('kioscos')
@Index(['activo']) // Índice para filtrar kioscos activos
export class Kiosco {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // ✅ El "!" indica que TypeORM lo inicializará

  @Column({ type: 'varchar', length: 100 })
  @Index() // Índice para búsquedas por nombre
  nombre!: string;

  @Column({ type: 'varchar', length: 200 })
  ubicacion!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_registro!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  fecha_actualizacion!: Date;

  // ═══════════════════════════════════════════════════════════════
  // 🔗 RELACIONES
  // ═══════════════════════════════════════════════════════════════
  @OneToMany(() => Consulta, (consulta) => consulta.kiosco)
  consultas!: Consulta[];

  // ═══════════════════════════════════════════════════════════════
  // 🔧 MÉTODO HELPER PARA FORMATO DE RESPUESTA
  // ═══════════════════════════════════════════════════════════════
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      ubicacion: this.ubicacion,
      activo: this.activo,
      fecha_registro: this.fecha_registro,
      fecha_actualizacion: this.fecha_actualizacion,
    };
  }
}