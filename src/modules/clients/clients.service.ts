// src/modules/clients/clients.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  /**
   * Crear un nuevo cliente
   */
  async create(createClientDto: CreateClientDto): Promise<Client> {
    // Verificar si ya existe un cliente con ese tax_id
    if (createClientDto.tax_id) {
      const existingClient = await this.clientRepository.findOne({
        where: { tax_id: createClientDto.tax_id },
      });

      if (existingClient) {
        throw new ConflictException(
          `Ya existe un cliente con el RUC/NIT: ${createClientDto.tax_id}`,
        );
      }
    }

    const client = this.clientRepository.create(createClientDto);
    const savedClient = await this.clientRepository.save(client);

    console.log(`✅ Cliente creado: ${savedClient.name} (${savedClient.id})`);
    return savedClient;
  }

  /**
   * Obtener todos los clientes
   */
  async findAll(includeInactive: boolean = false): Promise<Client[]> {
    const query = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.branches', 'branch')
      .orderBy('client.created_at', 'DESC');

    if (!includeInactive) {
      query.andWhere('client.is_active = :isActive', { isActive: true });
    }

    return await query.getMany();
  }

  /**
   * Obtener un cliente por ID
   */
  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['branches', 'licenses'],
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return client;
  }

  /**
   * Buscar clientes por nombre o tax_id
   */
  async search(query: string): Promise<Client[]> {
    return await this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.branches', 'branch')
      .where('LOWER(client.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('client.tax_id LIKE :query', { query: `%${query}%` })
      .andWhere('client.is_active = :isActive', { isActive: true })
      .orderBy('client.name', 'ASC')
      .getMany();
  }

  /**
   * Actualizar un cliente
   */
  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);

    // Verificar conflicto de tax_id si se está actualizando
    if (updateClientDto.tax_id && updateClientDto.tax_id !== client.tax_id) {
      const existingClient = await this.clientRepository.findOne({
        where: { tax_id: updateClientDto.tax_id },
      });

      if (existingClient && existingClient.id !== id) {
        throw new ConflictException(
          `Ya existe otro cliente con el RUC/NIT: ${updateClientDto.tax_id}`,
        );
      }
    }

    Object.assign(client, updateClientDto);
    const updatedClient = await this.clientRepository.save(client);

    console.log(`✏️ Cliente actualizado: ${updatedClient.name} (${updatedClient.id})`);
    return updatedClient;
  }

  /**
   * Eliminar un cliente (soft delete)
   */
  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);

    // Verificar si tiene sucursales activas
    const activeBranches = client.branches.filter((b) => b.is_active);
    if (activeBranches.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar el cliente porque tiene ${activeBranches.length} sucursal(es) activa(s). ` +
        `Desactiva primero todas las sucursales.`,
      );
    }

    // Verificar si tiene licencias activas
    if (client.licenses && client.licenses.length > 0) {
      const activeLicenses = client.licenses.filter((l) => l.status === 'active');
      if (activeLicenses.length > 0) {
        throw new BadRequestException(
          `No se puede eliminar el cliente porque tiene ${activeLicenses.length} licencia(s) activa(s). ` +
          `Revoca primero todas las licencias.`,
        );
      }
    }

    // Soft delete: marcar como inactivo
    client.is_active = false;
    await this.clientRepository.save(client);

    console.log(`🗑️ Cliente desactivado: ${client.name} (${client.id})`);
  }

  /**
   * Eliminar permanentemente un cliente
   */
  async permanentDelete(id: string): Promise<void> {
    const client = await this.findOne(id);

    // Verificar que no tenga dependencias
    if (client.branches && client.branches.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar permanentemente el cliente porque tiene sucursales asociadas`,
      );
    }

    if (client.licenses && client.licenses.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar permanentemente el cliente porque tiene licencias asociadas`,
      );
    }

    await this.clientRepository.remove(client);
    console.log(`🗑️ Cliente eliminado permanentemente: ${client.name}`);
  }

  /**
   * Activar/Desactivar cliente
   */
  async toggleActive(id: string): Promise<Client> {
    const client = await this.findOne(id);
    client.is_active = !client.is_active;
    
    const updatedClient = await this.clientRepository.save(client);
    
    console.log(
      `🔄 Cliente ${client.is_active ? 'activado' : 'desactivado'}: ${updatedClient.name}`,
    );
    
    return updatedClient;
  }

  /**
   * Obtener estadísticas de un cliente
   */
  async getStats(id: string): Promise<any> {
    const client = await this.findOne(id);

    const totalBranches = client.branches.length;
    const activeBranches = client.branches.filter((b) => b.is_active).length;
    const totalLicenses = client.licenses.length;
    const activeLicenses = client.licenses.filter((l) => l.status === 'active').length;
    const expiredLicenses = client.licenses.filter((l) => l.status === 'expired').length;

    return {
      client_id: client.id,
      client_name: client.name,
      branches: {
        total: totalBranches,
        active: activeBranches,
        inactive: totalBranches - activeBranches,
      },
      licenses: {
        total: totalLicenses,
        active: activeLicenses,
        expired: expiredLicenses,
        revoked: client.licenses.filter((l) => l.status === 'revoked').length,
        pending: client.licenses.filter((l) => l.status === 'pending').length,
      },
    };
  }

  /**
   * Verificar si existe un cliente
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.clientRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Contar clientes
   */
  async count(onlyActive: boolean = true): Promise<number> {
    if (onlyActive) {
      return await this.clientRepository.count({ where: { is_active: true } });
    }
    return await this.clientRepository.count();
  }
}