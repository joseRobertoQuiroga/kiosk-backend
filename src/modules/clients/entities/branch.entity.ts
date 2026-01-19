// src/modules/clients/entities/branch.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Client } from './client.entity';
import { License } from '../../licenses/entities/license.entity';

/**
 * Entidad Branch - Sucursales de un Cliente
 * 
 * Ejemplo: "Norte", "Sur", "Centro", "Aeropuerto"
 * Cada sucursal pertenece a un cliente
 */
@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  @Index()
  name!: string; // Ejemplo: "Sucursal Norte"

  @Column({ type: 'varchar', length: 50, nullable: true })
  code!: string | null; // Código interno: "SUC-001"

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manager_name!: string | null; // Encargado de la sucursal

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // ═══════════════════════════════════════════════════════════
  // Relaciones
  // ═══════════════════════════════════════════════════════════
  
  @Column({ type: 'uuid' })
  @Index()
  client_id!: string;

  @ManyToOne(() => Client, (client) => client.branches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @OneToMany(() => License, (license) => license.branch)
  licenses!: License[];

  // ═══════════════════════════════════════════════════════════
  // Timestamps
  // ═══════════════════════════════════════════════════════════
  
  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // ═══════════════════════════════════════════════════════════
  // Métodos helper
  // ═══════════════════════════════════════════════════════════
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      address: this.address,
      city: this.city,
      contact_phone: this.contact_phone,
      manager_name: this.manager_name,
      is_active: this.is_active,
      client_id: this.client_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}