// queries/queries.controller.ts - ACTUALIZADO
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { CreateQueryDto } from './dto/create-query.dto';
import { Public } from '../../common/decorators/public.decorator';
@Public()
@Controller('consultas')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}
  @Public()
  @Post()
  create(@Body() createQueryDto: CreateQueryDto) {
    return this.queriesService.create(createQueryDto);
  }
  @Public()
  @Get()
  findAll() {
    return this.queriesService.findAll();
  }
  @Public()
  @Get('kiosco/:id')
  findByKiosko(@Param('id') id: string) {
    return this.queriesService.findByKiosko(id);
  }
  @Public()
  @Get('producto/:codigo')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.queriesService.findByCodigo(codigo);
  }

  // NUEVOS ENDPOINTS PARA REPORTES
  @Public()
  @Get('estadisticas/general')
  getEstadisticas() {
    return this.queriesService.getEstadisticas();
  }
  @Public()
  @Get('estadisticas/kiosco/:id')
  getEstadisticasByKiosco(@Param('id') id: string) {
    return this.queriesService.getEstadisticasByKiosco(id);
  }
  @Public()
  @Get('reportes/rango-fechas')
  getByDateRange(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.queriesService.findByDateRange(fechaInicio, fechaFin);
  }
  @Public()
  @Get('reportes/kiosco/:id/rango-fechas')
  getByKioscoAndDateRange(
    @Param('id') id: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.queriesService.findByKioscoAndDateRange(id, fechaInicio, fechaFin);
  }
  @Public()
  @Get('reportes/por-dia')
  getConsultasPorDia(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.queriesService.getConsultasPorDia(fechaInicio, fechaFin);
  }
  @Public()
  @Get('reportes/tabla-kioscos')
  getTablaKioscos() {
    return this.queriesService.getTablaCompleteKioscos();
  }
  @Public()
  @Get('reportes/tabla-kioscos/detallada')
  getTablaKioscosDetallada() {
    return this.queriesService.getTablaDetalladaKioscos();
  }
  @Public()
  @Get('reportes/comparativa-kioscos')
  getComparativaKioscos(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.queriesService.getComparativaKioscos(fechaInicio, fechaFin);
  }
  @Public()
  @Get('reportes/rendimiento-kioscos')
  getRendimientoKioscos() {
    return this.queriesService.getRendimientoKioscos();
  }
  @Public()
  @Get('diagnostico/sistema')
  getDiagnostico() {
    return this.queriesService.getDiagnosticoCompleto();
  }
}
