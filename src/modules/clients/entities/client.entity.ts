// src/modules/clients/entities/client.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Branch } from './branch.entity';
import { License } from '../../licenses/entities/license.entity';

/**
 * Entidad Client - Empresas/Clientes del Sistema
 * 
 * Ejemplo: "Hyper", "SuperMax", "MegaStore"
 * Un cliente puede tener múltiples sucursales
 */
@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  @Index()
  name!: string; // Ejemplo: "Hyper"

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  @Index()
  tax_id!: string | null; // RUC, NIT, Tax ID

  @Column({ type: 'varchar', length: 100, nullable: true })
  contact_email!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null; // Notas internas del admin

  // ═══════════════════════════════════════════════════════════
  // Relaciones
  // ═══════════════════════════════════════════════════════════
  
  @OneToMany(() => Branch, (branch) => branch.client)
  branches!: Branch[];

  @OneToMany(() => License, (license) => license.client)
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
      tax_id: this.tax_id,
      contact_email: this.contact_email,
      contact_phone: this.contact_phone,
      address: this.address,
      country: this.country,
      city: this.city,
      is_active: this.is_active,
      notes: this.notes,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}