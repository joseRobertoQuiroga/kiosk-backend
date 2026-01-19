// src/modules/clients/branches.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { Client } from './entities/client.entity';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  /**
   * Crear una nueva sucursal
   */
  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    // Verificar que el cliente existe
    const client = await this.clientRepository.findOne({
      where: { id: createBranchDto.client_id },
    });

    if (!client) {
      throw new NotFoundException(
        `Cliente con ID ${createBranchDto.client_id} no encontrado`,
      );
    }

    if (!client.is_active) {
      throw new BadRequestException(
        'No se puede crear una sucursal para un cliente inactivo',
      );
    }

    const branch = this.branchRepository.create(createBranchDto);
    const savedBranch = await this.branchRepository.save(branch);

    console.log(
      `✅ Sucursal creada: ${savedBranch.name} para cliente ${client.name} (${savedBranch.id})`,
    );

    return savedBranch;
  }

  /**
   * Obtener todas las sucursales
   */
  async findAll(includeInactive: boolean = false): Promise<Branch[]> {
    const query = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.client', 'client')
      .orderBy('client.name', 'ASC')
      .addOrderBy('branch.name', 'ASC');

    if (!includeInactive) {
      query.andWhere('branch.is_active = :isActive', { isActive: true });
    }

    return await query.getMany();
  }

  /**
   * Obtener todas las sucursales de un cliente
   */
  async findByClient(
    clientId: string,
    includeInactive: boolean = false,
  ): Promise<Branch[]> {
    const query = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.client', 'client')
      .where('branch.client_id = :clientId', { clientId })
      .orderBy('branch.name', 'ASC');

    if (!includeInactive) {
      query.andWhere('branch.is_active = :isActive', { isActive: true });
    }

    return await query.getMany();
  }

  /**
   * Obtener una sucursal por ID
   */
  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['client', 'licenses'],
    });

    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }

    return branch;
  }

  /**
   * Buscar sucursales por nombre o código
   */
  async search(query: string): Promise<Branch[]> {
    return await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.client', 'client')
      .where('LOWER(branch.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('branch.code LIKE :query', { query: `%${query}%` })
      .andWhere('branch.is_active = :isActive', { isActive: true })
      .orderBy('client.name', 'ASC')
      .addOrderBy('branch.name', 'ASC')
      .getMany();
  }

  /**
   * Actualizar una sucursal
   */
  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);

    Object.assign(branch, updateBranchDto);
    const updatedBranch = await this.branchRepository.save(branch);

    console.log(`✏️ Sucursal actualizada: ${updatedBranch.name} (${updatedBranch.id})`);
    return updatedBranch;
  }

  /**
   * Eliminar una sucursal (soft delete)
   */
  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);

    // Verificar si tiene licencias activas
    if (branch.licenses && branch.licenses.length > 0) {
      const activeLicenses = branch.licenses.filter((l) => l.status === 'active');
      if (activeLicenses.length > 0) {
        throw new BadRequestException(
          `No se puede eliminar la sucursal porque tiene ${activeLicenses.length} licencia(s) activa(s). ` +
          `Revoca primero todas las licencias.`,
        );
      }
    }

    // Soft delete: marcar como inactivo
    branch.is_active = false;
    await this.branchRepository.save(branch);

    console.log(`🗑️ Sucursal desactivada: ${branch.name} (${branch.id})`);
  }

  /**
   * Eliminar permanentemente una sucursal
   */
  async permanentDelete(id: string): Promise<void> {
    const branch = await this.findOne(id);

    // Verificar que no tenga licencias
    if (branch.licenses && branch.licenses.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar permanentemente la sucursal porque tiene licencias asociadas`,
      );
    }

    await this.branchRepository.remove(branch);
    console.log(`🗑️ Sucursal eliminada permanentemente: ${branch.name}`);
  }

  /**
   * Activar/Desactivar sucursal
   */
  async toggleActive(id: string): Promise<Branch> {
    const branch = await this.findOne(id);
    branch.is_active = !branch.is_active;
    
    const updatedBranch = await this.branchRepository.save(branch);
    
    console.log(
      `🔄 Sucursal ${branch.is_active ? 'activada' : 'desactivada'}: ${updatedBranch.name}`,
    );
    
    return updatedBranch;
  }

  /**
   * Obtener estadísticas de una sucursal
   */
  async getStats(id: string): Promise<any> {
    const branch = await this.findOne(id);

    const totalLicenses = branch.licenses.length;
    const activeLicenses = branch.licenses.filter((l) => l.status === 'active').length;
    const expiredLicenses = branch.licenses.filter((l) => l.status === 'expired').length;

    return {
      branch_id: branch.id,
      branch_name: branch.name,
      client: {
        id: branch.client.id,
        name: branch.client.name,
      },
      licenses: {
        total: totalLicenses,
        active: activeLicenses,
        expired: expiredLicenses,
        revoked: branch.licenses.filter((l) => l.status === 'revoked').length,
        pending: branch.licenses.filter((l) => l.status === 'pending').length,
      },
    };
  }

  /**
   * Verificar si existe una sucursal
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.branchRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Contar sucursales de un cliente
   */
  async countByClient(clientId: string, onlyActive: boolean = true): Promise<number> {
    const where: any = { client_id: clientId };
    if (onlyActive) {
      where.is_active = true;
    }
    return await this.branchRepository.count({ where });
  }
}