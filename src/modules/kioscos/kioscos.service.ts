// src/modules/kioscos/kioscos.service.ts - CORREGIDO
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kiosco } from './entities/kiosco.entity';
import { CreateKioscoDto } from './dto/create-kiosco.dto';

@Injectable()
export class KioscosService implements OnModuleInit {
  constructor(
    @InjectRepository(Kiosco)
    private readonly kioscoRepository: Repository<Kiosco>,
  ) {}

  async onModuleInit() {
    const count = await this.kioscoRepository.count();
    
    if (count === 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏪 Base de datos vacía, creando kioscos por defecto...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      await this.seedDefaultKioscos();
      
      console.log('✅ Kioscos por defecto creados');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log(`✅ KioscosService inicializado con ${count} kioscos en PostgreSQL`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🌱 SEED - KIOSCOS POR DEFECTO
  // ═══════════════════════════════════════════════════════════════
  private async seedDefaultKioscos() {
    const defaultKioscos = [
      {
        nombre: 'Kiosco 1',
        ubicacion: 'Entrada Principal',
        activo: true,
        // 🔥 NO incluir fecha_registro - TypeORM la crea automáticamente
      },
      {
        nombre: 'Kiosco 2',
        ubicacion: 'Planta Baja',
        activo: true,
        // 🔥 NO incluir fecha_registro - TypeORM la crea automáticamente
      },
    ];

    await this.kioscoRepository.save(defaultKioscos);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 MÉTODOS CRUD
  // ═══════════════════════════════════════════════════════════════

  async findAll(): Promise<Kiosco[]> {
    return await this.kioscoRepository.find({
      order: { fecha_registro: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Kiosco> {
    const kiosco = await this.kioscoRepository.findOne({
      where: { id }
    });
    
    if (!kiosco) {
      throw new NotFoundException(`Kiosco con ID ${id} no encontrado`);
    }
    
    return kiosco;
  }

  async create(createKioscoDto: CreateKioscoDto): Promise<Kiosco> {
    const nuevoKiosco = this.kioscoRepository.create({
      nombre: createKioscoDto.nombre,
      ubicacion: createKioscoDto.ubicacion,
      activo: createKioscoDto.activo ?? true,
      // 🔥 NO incluir fecha_registro - @CreateDateColumn lo maneja automáticamente
    });
    
    const saved = await this.kioscoRepository.save(nuevoKiosco);
    
    console.log(`✅ Kiosco creado: ${saved.nombre} (${saved.id})`);
    return saved;
  }

  async update(id: string, updateData: Partial<CreateKioscoDto>): Promise<Kiosco> {
    const kiosco = await this.findOne(id);
    
    // 🔥 USAR Object.assign en lugar de spread operator
    // Esto mantiene los métodos de la instancia (como toJSON)
    Object.assign(kiosco, updateData);
    
    const updated = await this.kioscoRepository.save(kiosco);
    
    console.log(`✏️ Kiosco actualizado: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const kiosco = await this.findOne(id);
    
    await this.kioscoRepository.remove(kiosco);
    
    console.log(`🗑️ Kiosco eliminado: ${kiosco.nombre} (${kiosco.id})`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🛠️ MÉTODOS ADICIONALES ÚTILES
  // ═══════════════════════════════════════════════════════════════

  async exists(id: string): Promise<boolean> {
    const count = await this.kioscoRepository.count({
      where: { id }
    });
    return count > 0;
  }

  async findAllActive(): Promise<Kiosco[]> {
    return await this.kioscoRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' }
    });
  }

  async count(): Promise<number> {
    return await this.kioscoRepository.count();
  }

  async countActive(): Promise<number> {
    return await this.kioscoRepository.count({
      where: { activo: true }
    });
  }

  async findWithConsultasCount(): Promise<any[]> {
    return await this.kioscoRepository
      .createQueryBuilder('kiosco')
      .leftJoinAndSelect('kiosco.consultas', 'consulta')
      .loadRelationCountAndMap('kiosco.totalConsultas', 'kiosco.consultas')
      .orderBy('kiosco.fecha_registro', 'DESC')
      .getMany();
  }
}