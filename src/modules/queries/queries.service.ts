// src/modules/queries/queries.service.ts - ✅ COMPLETO Y CORREGIDO

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Consulta } from './entities/consulta.entity';
import { CreateQueryDto } from './dto/create-query.dto';
import { KioscosService } from '../kioscos/kioscos.service';

@Injectable()
export class QueriesService {
  constructor(
    @InjectRepository(Consulta)
    private readonly consultaRepository: Repository<Consulta>,
    private readonly kioscosService: KioscosService,
  ) { }

  // ═══════════════════════════════════════════════════════════════
  // ➕ CREAR CONSULTA - ✅ LÓGICA CORREGIDA
  // ═══════════════════════════════════════════════════════════════

  async create(createQueryDto: CreateQueryDto): Promise<Consulta> {
    const timestamp = new Date().toISOString();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🟢 [CREATE CONSULTA] Registrando en PostgreSQL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Timestamp:', timestamp);
    console.log('📋 Código Barra:', createQueryDto.codigo_barra);
    console.log('🏪 Kiosco ID:', createQueryDto.id_kiosco);
    console.log('📈 Resultado recibido:', createQueryDto.resultado);

    // 🔥 NORMALIZAR RESULTADO
    let resultadoNormalizado: string;

    if (createQueryDto.resultado) {
      const resultadoLower = createQueryDto.resultado.toLowerCase();

      if (resultadoLower === 'ok' ||
        resultadoLower === 'encontrado' ||
        resultadoLower === 'exito' ||
        resultadoLower === 'success' ||
        resultadoLower.includes('cache')) {
        resultadoNormalizado = 'encontrado';
      } else {
        resultadoNormalizado = 'no_encontrado';
      }
    } else {
      resultadoNormalizado = 'encontrado';
    }

    console.log('✅ Resultado normalizado:', resultadoNormalizado);

    const nuevaConsulta = this.consultaRepository.create({
      codigo_barra: createQueryDto.codigo_barra,
      id_kiosco: createQueryDto.id_kiosco,
      resultado: resultadoNormalizado,
    });

    const saved = await this.consultaRepository.save(nuevaConsulta);

    console.log('✅ Consulta guardada con ID:', saved.id);
    console.log('📅 Fecha/Hora BD:', saved.fecha_hora);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return saved;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 BÚSQUEDAS BÁSICAS
  // ═══════════════════════════════════════════════════════════════

  async findAll(): Promise<Consulta[]> {
    return await this.consultaRepository.find({
      order: { fecha_hora: 'DESC' }
    });
  }

  async findByKiosko(id_kiosco: string): Promise<Consulta[]> {
    return await this.consultaRepository.find({
      where: { id_kiosco },
      order: { fecha_hora: 'DESC' }
    });
  }

  async findByCodigo(codigo_barra: string): Promise<Consulta[]> {
    return await this.consultaRepository.find({
      where: { codigo_barra },
      order: { fecha_hora: 'DESC' }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 📅 BÚSQUEDAS POR FECHA
  // ═══════════════════════════════════════════════════════════════

  async findByDateRange(fechaInicio: string, fechaFin: string): Promise<Consulta[]> {
    return await this.consultaRepository.find({
      where: {
        fecha_hora: Between(new Date(fechaInicio), new Date(fechaFin))
      },
      order: { fecha_hora: 'ASC' }
    });
  }

  async findByKioscoAndDateRange(
    id_kiosco: string,
    fechaInicio: string,
    fechaFin: string,
  ): Promise<Consulta[]> {
    return await this.consultaRepository.find({
      where: {
        id_kiosco,
        fecha_hora: Between(new Date(fechaInicio), new Date(fechaFin))
      },
      order: { fecha_hora: 'ASC' }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 ESTADÍSTICAS GENERALES - ✅ LÓGICA CORREGIDA
  // ═══════════════════════════════════════════════════════════════

  async getEstadisticas() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 [ESTADÍSTICAS] Calculando métricas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const [total, exitosas] = await Promise.all([
      this.consultaRepository.count(),
      this.consultaRepository.count({ where: { resultado: 'encontrado' } })
    ]);

    const fallidas = total - exitosas;

    console.log('Total consultas:', total);
    console.log('Exitosas:', exitosas);
    console.log('Fallidas:', fallidas);

    const topProductos = await this.consultaRepository
      .createQueryBuilder('consulta')
      .select('consulta.codigo_barra', 'codigo')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('consulta.codigo_barra')
      .orderBy('cantidad', 'DESC')
      .limit(10)
      .getRawMany();

    console.log('Top productos encontrados:', topProductos.length);

    const kioscos = await this.kioscosService.findAll();

    const consultasPorKiosco = await Promise.all(
      kioscos.map(async (kiosco) => {
        const [totalConsultas, exitosasKiosco] = await Promise.all([
          this.consultaRepository.count({ where: { id_kiosco: kiosco.id } }),
          this.consultaRepository.count({
            where: { id_kiosco: kiosco.id, resultado: 'encontrado' }
          })
        ]);

        console.log(`Kiosco ${kiosco.nombre}: ${totalConsultas} total, ${exitosasKiosco} exitosas`);

        return {
          id: kiosco.id,
          nombre: kiosco.nombre,
          ubicacion: kiosco.ubicacion,
          total_consultas: totalConsultas,
          exitosas: exitosasKiosco,
          fallidas: totalConsultas - exitosasKiosco,
        };
      })
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      total,
      exitosas,
      fallidas,
      tasa_exito: total > 0 ? ((exitosas / total) * 100).toFixed(2) + '%' : '0%',
      topProductos,
      consultasPorKiosco,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 ESTADÍSTICAS POR KIOSCO - ✅ CORREGIDO
  // ═══════════════════════════════════════════════════════════════

  async getEstadisticasByKiosco(id_kiosco: string) {
    const [total, exitosas] = await Promise.all([
      this.consultaRepository.count({ where: { id_kiosco } }),
      this.consultaRepository.count({
        where: { id_kiosco, resultado: 'encontrado' }
      })
    ]);

    const topProductos = await this.consultaRepository
      .createQueryBuilder('consulta')
      .select('consulta.codigo_barra', 'codigo')
      .addSelect('COUNT(*)', 'cantidad')
      .where('consulta.id_kiosco = :id_kiosco', { id_kiosco })
      .groupBy('consulta.codigo_barra')
      .orderBy('cantidad', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      id_kiosco,
      total,
      exitosas,
      fallidas: total - exitosas,
      topProductos,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 CONSULTAS POR DÍA
  // ═══════════════════════════════════════════════════════════════

  async getConsultasPorDia(fechaInicio: string, fechaFin: string) {
    const consultas = await this.consultaRepository
      .createQueryBuilder('consulta')
      .select("DATE(consulta.fecha_hora)", 'fecha')
      .addSelect('COUNT(*)', 'cantidad')
      .where('consulta.fecha_hora BETWEEN :inicio AND :fin', {
        inicio: new Date(fechaInicio),
        fin: new Date(fechaFin)
      })
      .groupBy('DATE(consulta.fecha_hora)')
      .orderBy('fecha', 'ASC')
      .getRawMany();

    return consultas;
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 TABLA COMPLETA KIOSCOS - ✅ CORREGIDO
  // ═══════════════════════════════════════════════════════════════

  async getTablaCompleteKioscos() {
    const kioscos = await this.kioscosService.findAll();

    const tablaKioscos = await Promise.all(
      kioscos.map(async (kiosco) => {
        const [total, exitosas] = await Promise.all([
          this.consultaRepository.count({ where: { id_kiosco: kiosco.id } }),
          this.consultaRepository.count({
            where: { id_kiosco: kiosco.id, resultado: 'encontrado' }
          })
        ]);

        return {
          id: kiosco.id,
          nombre: kiosco.nombre,
          ubicacion: kiosco.ubicacion,
          activo: kiosco.activo,
          total_consultas: total,
          consultas_exitosas: exitosas,
          consultas_fallidas: total - exitosas,
          tasa_exito: total > 0
            ? ((exitosas / total) * 100).toFixed(2) + '%'
            : '0%',
        };
      })
    );

    tablaKioscos.sort((a, b) => b.total_consultas - a.total_consultas);

    const totalConsultas = await this.consultaRepository.count();

    return {
      total_kioscos: kioscos.length,
      kioscos_activos: kioscos.filter(k => k.activo).length,
      tabla: tablaKioscos,
      resumen: {
        total_consultas_sistema: totalConsultas,
        promedio_consultas_por_kiosco: kioscos.length > 0
          ? (totalConsultas / kioscos.length).toFixed(2)
          : '0',
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 TABLA DETALLADA KIOSCOS - ✅ AGREGADO
  // ═══════════════════════════════════════════════════════════════

  async getTablaDetalladaKioscos() {
    const kioscos = await this.kioscosService.findAll();

    const tablaDetallada = await Promise.all(
      kioscos.map(async (kiosco) => {
        const [consultasTotal, exitosas, topProductos, ultimaConsulta] = await Promise.all([
          this.consultaRepository.count({ where: { id_kiosco: kiosco.id } }),
          this.consultaRepository.count({
            where: { id_kiosco: kiosco.id, resultado: 'encontrado' }
          }),
          this.consultaRepository
            .createQueryBuilder('consulta')
            .select('consulta.codigo_barra', 'codigo')
            .addSelect('COUNT(*)', 'cantidad')
            .where('consulta.id_kiosco = :id', { id: kiosco.id })
            .groupBy('consulta.codigo_barra')
            .orderBy('cantidad', 'DESC')
            .limit(5)
            .getRawMany()
            .then(results => results.map(r => ({
              codigo: r.codigo,
              cantidad: parseInt(r.cantidad),
              porcentaje: consultasTotal > 0
                ? ((parseInt(r.cantidad) / consultasTotal) * 100).toFixed(1) + '%'
                : '0%'
            }))),
          this.consultaRepository.findOne({
            where: { id_kiosco: kiosco.id },
            order: { fecha_hora: 'DESC' }
          })
        ]);

        return {
          id: kiosco.id,
          nombre: kiosco.nombre,
          ubicacion: kiosco.ubicacion,
          activo: kiosco.activo,
          fecha_registro: kiosco.fecha_registro,
          estadisticas: {
            total_consultas: consultasTotal,
            exitosas: exitosas,
            fallidas: consultasTotal - exitosas,
            tasa_exito: consultasTotal > 0
              ? ((exitosas / consultasTotal) * 100).toFixed(2) + '%'
              : '0%',
          },
          top_productos: topProductos,
          ultima_consulta: ultimaConsulta?.fecha_hora || null,
        };
      })
    );

    return {
      timestamp: new Date().toISOString(),
      total_kioscos: kioscos.length,
      tabla: tablaDetallada,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 COMPARATIVA KIOSCOS - ✅ AGREGADO
  // ═══════════════════════════════════════════════════════════════

  async getComparativaKioscos(fechaInicio?: string, fechaFin?: string) {
    const kioscos = await this.kioscosService.findAll();

    const comparativa = await Promise.all(
      kioscos.map(async (kiosco) => {
        let whereCondition: any = { id_kiosco: kiosco.id };

        if (fechaInicio && fechaFin) {
          whereCondition.fecha_hora = Between(
            new Date(fechaInicio),
            new Date(fechaFin)
          );
        }

        const [total, exitosas] = await Promise.all([
          this.consultaRepository.count({ where: whereCondition }),
          this.consultaRepository.count({
            where: { ...whereCondition, resultado: 'encontrado' }
          })
        ]);

        return {
          id: kiosco.id,
          nombre: kiosco.nombre,
          ubicacion: kiosco.ubicacion,
          total_consultas: total,
          consultas_exitosas: exitosas,
          tasa_exito: total > 0
            ? parseFloat(((exitosas / total) * 100).toFixed(2))
            : 0,
        };
      })
    );

    comparativa.sort((a, b) => b.tasa_exito - a.tasa_exito);

    const ranking = comparativa.map((k, index) => ({
      ranking: index + 1,
      ...k,
    }));

    let totalConsultasPeriodo = 0;
    if (fechaInicio && fechaFin) {
      totalConsultasPeriodo = await this.consultaRepository.count({
        where: {
          fecha_hora: Between(new Date(fechaInicio), new Date(fechaFin))
        }
      });
    } else {
      totalConsultasPeriodo = await this.consultaRepository.count();
    }

    return {
      periodo: fechaInicio && fechaFin
        ? { inicio: fechaInicio, fin: fechaFin }
        : 'Todo el periodo',
      total_consultas_periodo: totalConsultasPeriodo,
      mejor_kiosco: ranking[0]?.nombre || 'N/A',
      peor_kiosco: ranking[ranking.length - 1]?.nombre || 'N/A',
      ranking,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 RENDIMIENTO KIOSCOS - ✅ CORREGIDO
  // ═══════════════════════════════════════════════════════════════

  async getRendimientoKioscos() {
    const kioscos = await this.kioscosService.findAll();
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const hace7d = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

    const rendimiento = await Promise.all(
      kioscos.map(async (kiosco) => {
        const [totalHistorico, ultimas24h, ultimos7d, exitosas24h] = await Promise.all([
          this.consultaRepository.count({ where: { id_kiosco: kiosco.id } }),
          this.consultaRepository.count({
            where: {
              id_kiosco: kiosco.id,
              fecha_hora: Between(hace24h, ahora)
            }
          }),
          this.consultaRepository.count({
            where: {
              id_kiosco: kiosco.id,
              fecha_hora: Between(hace7d, ahora)
            }
          }),
          this.consultaRepository.count({
            where: {
              id_kiosco: kiosco.id,
              resultado: 'encontrado',
              fecha_hora: Between(hace24h, ahora)
            }
          })
        ]);

        return {
          id: kiosco.id,
          nombre: kiosco.nombre,
          ubicacion: kiosco.ubicacion,
          activo: kiosco.activo,
          metricas: {
            total_historico: totalHistorico,
            ultimas_24h: ultimas24h,
            ultimos_7_dias: ultimos7d,
            promedio_diario_7d: ultimos7d > 0
              ? (ultimos7d / 7).toFixed(2)
              : '0',
            tasa_exito_24h: ultimas24h > 0
              ? ((exitosas24h / ultimas24h) * 100).toFixed(2) + '%'
              : '0%',
          },
          estado: this.determinarEstadoKiosco(ultimas24h, kiosco.activo),
        };
      })
    );

    return {
      timestamp: new Date().toISOString(),
      kioscos: rendimiento,
      alertas: rendimiento
        .filter(k => k.estado === 'inactivo' || k.estado === 'bajo_rendimiento')
        .map(k => ({
          kiosco: k.nombre,
          estado: k.estado,
          mensaje: this.getMensajeAlerta(k.estado),
        })),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 DIAGNÓSTICO COMPLETO - ✅ AGREGADO
  // ═══════════════════════════════════════════════════════════════

  async getDiagnosticoCompleto() {
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    const todosKioscos = await this.kioscosService.findAll();

    const diagnosticoKioscos = await Promise.all(
      todosKioscos.map(async (kiosco) => {
        const [totalHistorico, recientes, exitosasRecientes, ultimaConsulta] = await Promise.all([
          this.consultaRepository.count({ where: { id_kiosco: kiosco.id } }),
          this.consultaRepository.count({
            where: {
              id_kiosco: kiosco.id,
              fecha_hora: Between(hace24h, ahora)
            }
          }),
          this.consultaRepository.count({
            where: {
              id_kiosco: kiosco.id,
              resultado: 'encontrado',
              fecha_hora: Between(hace24h, ahora)
            }
          }),
          this.consultaRepository.findOne({
            where: { id_kiosco: kiosco.id },
            order: { fecha_hora: 'DESC' }
          })
        ]);

        const tasaExitoReciente = recientes > 0
          ? (exitosasRecientes / recientes) * 100
          : 0;

        const problemas: string[] = [];
        if (!kiosco.activo) problemas.push('Kiosco desactivado');
        if (recientes === 0 && kiosco.activo) problemas.push('Sin consultas en 24h');
        if (tasaExitoReciente < 50 && recientes > 0) problemas.push('Tasa de éxito baja (<50%)');

        return {
          id: kiosco.id,
          nombre: kiosco.nombre,
          ubicacion: kiosco.ubicacion,
          activo: kiosco.activo,
          estado: problemas.length === 0 ? '✅ OK' : '⚠️ CON PROBLEMAS',
          consultas: {
            total_historico: totalHistorico,
            ultimas_24h: recientes,
            exitosas_24h: exitosasRecientes,
            tasa_exito_24h: `${tasaExitoReciente.toFixed(1)}%`,
          },
          problemas: problemas.length > 0 ? problemas : ['Ninguno'],
          ultima_consulta: ultimaConsulta?.fecha_hora || 'Nunca',
        };
      })
    );

    const [totalConsultas, consultasRecientes] = await Promise.all([
      this.consultaRepository.count(),
      this.consultaRepository.count({
        where: { fecha_hora: Between(hace24h, ahora) }
      })
    ]);

    return {
      timestamp: ahora.toISOString(),
      resumen: {
        total_kioscos: todosKioscos.length,
        kioscos_activos: todosKioscos.filter(k => k.activo).length,
        kioscos_con_problemas: diagnosticoKioscos.filter(d =>
          d.estado === '⚠️ CON PROBLEMAS'
        ).length,
        total_consultas_sistema: totalConsultas,
        consultas_ultimas_24h: consultasRecientes,
        promedio_consultas_por_kiosco: todosKioscos.length > 0
          ? (totalConsultas / todosKioscos.length).toFixed(2)
          : '0',
      },
      kioscos: diagnosticoKioscos,
      alertas_criticas: diagnosticoKioscos
        .filter(d => d.problemas[0] !== 'Ninguno')
        .map(d => ({
          kiosco: d.nombre,
          problemas: d.problemas,
        })),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🛠️ MÉTODOS AUXILIARES
  // ═══════════════════════════════════════════════════════════════

  private determinarEstadoKiosco(consultas24h: number, activo: boolean): string {
    if (!activo) return 'desactivado';
    if (consultas24h === 0) return 'inactivo';
    if (consultas24h < 5) return 'bajo_rendimiento';
    if (consultas24h < 20) return 'normal';
    return 'alto_rendimiento';
  }

  private getMensajeAlerta(estado: string): string {
    const mensajes: Record<string, string> = {
      inactivo: 'No hay consultas en las últimas 24 horas',
      bajo_rendimiento: 'Menos de 5 consultas en las últimas 24 horas',
      desactivado: 'El kiosco está marcado como inactivo',
    };
    return mensajes[estado] || '';
  }
}