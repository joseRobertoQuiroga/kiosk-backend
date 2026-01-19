// src/modules/clients/clients.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { BranchesService } from './branches.service';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

/**
 * Controlador de Clientes
 * Todos los endpoints requieren autenticación de super admin
 */
@Controller('clients')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly branchesService: BranchesService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // 🏢 ENDPOINTS DE CLIENTES
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/clients
   * Crear un nuevo cliente
   */
  @Post()
  async createClient(@Body() createClientDto: CreateClientDto) {
    const client = await this.clientsService.create(createClientDto);
    return {
      success: true,
      message: 'Cliente creado exitosamente',
      data: client.toJSON(),
    };
  }

  /**
   * GET /api/clients
   * Obtener todos los clientes
   */
  @Get()
  async findAllClients(@Query('include_inactive') includeInactive?: string) {
    const clients = await this.clientsService.findAll(
      includeInactive === 'true',
    );
    return {
      success: true,
      count: clients.length,
      data: clients.map((c) => c.toJSON()),
    };
  }

  /**
   * GET /api/clients/search?q=query
   * Buscar clientes por nombre o tax_id
   */
  @Get('search')
  async searchClients(@Query('q') query: string) {
    const clients = await this.clientsService.search(query);
    return {
      success: true,
      count: clients.length,
      data: clients.map((c) => c.toJSON()),
    };
  }

  /**
   * GET /api/clients/:id
   * Obtener un cliente por ID
   */
  @Get(':id')
  async findOneClient(@Param('id') id: string) {
    const client = await this.clientsService.findOne(id);
    return {
      success: true,
      data: client.toJSON(),
    };
  }

  /**
   * GET /api/clients/:id/stats
   * Obtener estadísticas de un cliente
   */
  @Get(':id/stats')
  async getClientStats(@Param('id') id: string) {
    const stats = await this.clientsService.getStats(id);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * PUT /api/clients/:id
   * Actualizar un cliente
   */
  @Put(':id')
  async updateClient(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    const client = await this.clientsService.update(id, updateClientDto);
    return {
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: client.toJSON(),
    };
  }

  /**
   * DELETE /api/clients/:id
   * Eliminar (desactivar) un cliente
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeClient(@Param('id') id: string) {
    await this.clientsService.remove(id);
    return {
      success: true,
      message: 'Cliente desactivado exitosamente',
    };
  }

  /**
   * POST /api/clients/:id/toggle-active
   * Activar/Desactivar un cliente
   */
  @Post(':id/toggle-active')
  async toggleClientActive(@Param('id') id: string) {
    const client = await this.clientsService.toggleActive(id);
    return {
      success: true,
      message: `Cliente ${client.is_active ? 'activado' : 'desactivado'} exitosamente`,
      data: client.toJSON(),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🏪 ENDPOINTS DE SUCURSALES
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/clients/:clientId/branches
   * Crear una nueva sucursal para un cliente
   */
  @Post(':clientId/branches')
  async createBranch(
    @Param('clientId') clientId: string,
    @Body() createBranchDto: CreateBranchDto,
  ) {
    // Forzar el client_id del parámetro de la URL
    createBranchDto.client_id = clientId;
    
    const branch = await this.branchesService.create(createBranchDto);
    return {
      success: true,
      message: 'Sucursal creada exitosamente',
      data: branch.toJSON(),
    };
  }

  /**
   * GET /api/clients/:clientId/branches
   * Obtener todas las sucursales de un cliente
   */
  @Get(':clientId/branches')
  async findClientBranches(
    @Param('clientId') clientId: string,
    @Query('include_inactive') includeInactive?: string,
  ) {
    const branches = await this.branchesService.findByClient(
      clientId,
      includeInactive === 'true',
    );
    return {
      success: true,
      count: branches.length,
      data: branches.map((b) => b.toJSON()),
    };
  }
}

/**
 * Controlador de Sucursales
 * Endpoints adicionales para gestión de sucursales
 */
@Controller('branches')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  /**
   * GET /api/branches
   * Obtener todas las sucursales
   * 
   */
  
  @Get()
  async findAllBranches(@Query('include_inactive') includeInactive?: string) {
    const branches = await this.branchesService.findAll(
      includeInactive === 'true',
    );
    return {
      success: true,
      count: branches.length,
      data: branches.map((b) => b.toJSON()),
    };
  }

  /**
   * GET /api/branches/search?q=query
   * Buscar sucursales por nombre o código
   */
  @Get('search')
  async searchBranches(@Query('q') query: string) {
    const branches = await this.branchesService.search(query);
    return {
      success: true,
      count: branches.length,
      data: branches.map((b) => b.toJSON()),
    };
  }

  /**
   * GET /api/branches/:id
   * Obtener una sucursal por ID
   */
  @Get(':id')
  async findOneBranch(@Param('id') id: string) {
    const branch = await this.branchesService.findOne(id);
    return {
      success: true,
      data: branch.toJSON(),
    };
  }

  /**
   * GET /api/branches/:id/stats
   * Obtener estadísticas de una sucursal
   */
  @Get(':id/stats')
  async getBranchStats(@Param('id') id: string) {
    const stats = await this.branchesService.getStats(id);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * PUT /api/branches/:id
   * Actualizar una sucursal
   */
  @Put(':id')
  async updateBranch(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    const branch = await this.branchesService.update(id, updateBranchDto);
    return {
      success: true,
      message: 'Sucursal actualizada exitosamente',
      data: branch.toJSON(),
    };
  }

  /**
   * DELETE /api/branches/:id
   * Eliminar (desactivar) una sucursal
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeBranch(@Param('id') id: string) {
    await this.branchesService.remove(id);
    return {
      success: true,
      message: 'Sucursal desactivada exitosamente',
    };
  }

  /**
   * POST /api/branches/:id/toggle-active
   * Activar/Desactivar una sucursal
   */
  @Post(':id/toggle-active')
  async toggleBranchActive(@Param('id') id: string) {
    const branch = await this.branchesService.toggleActive(id);
    return {
      success: true,
      message: `Sucursal ${branch.is_active ? 'activada' : 'desactivada'} exitosamente`,
      data: branch.toJSON(),
    };
  }
}