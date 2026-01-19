// src/modules/config/config.service.ts - CORREGIDO
import { Injectable } from '@nestjs/common';
import { KioscosService } from '../kioscos/kioscos.service';

@Injectable()
export class ConfigService {
  constructor(private readonly kioscosService: KioscosService) {}

  // ═══════════════════════════════════════════════════════════════
  // 🔧 CONFIGURACIÓN DEL SISTEMA
  // ═══════════════════════════════════════════════════════════════

  async getSystemConfig() {
    const kioscos = await this.kioscosService.findAll(); // 🔥 AGREGAR await

    return {
      sistema: {
        nombre: 'Sistema de Kioscos',
        version: '2.0.0',
        ambiente: process.env.NODE_ENV || 'development',
      },
      base_urls: {
        api: process.env.BASE_URL || 'http://localhost:3000',
        imagenes: `${process.env.BASE_URL || 'http://localhost:3000'}/imagenes`,
        videos: `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/videos`,
      },
      kioscos: kioscos.map(k => ({
        id: k.id,
        nombre: k.nombre,
        ubicacion: k.ubicacion,
        activo: k.activo,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 CONFIGURACIÓN POR KIOSCO
  // ═══════════════════════════════════════════════════════════════

  async getKioskConfig(kioskId: string) {
    const kiosco = await this.kioscosService.findOne(kioskId); // 🔥 AGREGAR await

    return {
      kiosco: {
        id: kiosco.id,
        nombre: kiosco.nombre,
        ubicacion: kiosco.ubicacion,
        activo: kiosco.activo,
        fecha_registro: kiosco.fecha_registro
      },
      configuracion: {
        tiempo_inactividad: 60000, // 60 segundos
        mostrar_promociones: true,
        idioma: 'es',
        tema: 'light',
      },
      endpoints: {
        productos: `${process.env.BASE_URL || 'http://localhost:3000'}/api/productos`,
        videos: `${process.env.BASE_URL || 'http://localhost:3000'}/api/videos`,
        consultas: `${process.env.BASE_URL || 'http://localhost:3000'}/api/consultas`,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🎨 CONFIGURACIÓN DE INTERFAZ
  // ═══════════════════════════════════════════════════════════════

  async getUIConfig() {
    return {
      colores: {
        primario: '#1976d2',
        secundario: '#dc004e',
        fondo: '#f5f5f5',
        texto: '#333333',
      },
      fuentes: {
        principal: 'Roboto, sans-serif',
        secundaria: 'Arial, sans-serif',
      },
      layout: {
        productos_por_pagina: 12,
        columnas_grid: 3,
        mostrar_imagenes: true,
        mostrar_precios: true,
      },
      animaciones: {
        habilitadas: true,
        duracion_transicion: 300,
        tipo_transicion: 'ease-in-out',
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 CONFIGURACIÓN DE REPORTES
  // ═══════════════════════════════════════════════════════════════

  async getReportConfig() {
    return {
      frecuencia_actualizacion: 300000, // 5 minutos
      metricas_principales: [
        'consultas_totales',
        'productos_mas_consultados',
        'tasa_exito',
        'kioscos_activos',
      ],
      exportar: {
        formatos_disponibles: ['json', 'csv', 'xlsx'],
        incluir_graficos: true,
      },
      alertas: {
        habilitadas: true,
        umbral_consultas_bajas: 5,
        umbral_tasa_exito: 50,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ VALIDAR CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════════

  async validateKioskId(kioskId: string): Promise<boolean> {
    return await this.kioscosService.exists(kioskId); // 🔥 AGREGAR await
  }

  // ═══════════════════════════════════════════════════════════════
  // 📈 ESTADÍSTICAS DEL SISTEMA
  // ═══════════════════════════════════════════════════════════════

  async getSystemStats() {
    const kioscos = await this.kioscosService.findAll(); // 🔥 AGREGAR await
    const kioscosActivos = await this.kioscosService.countActive(); // 🔥 AGREGAR await

    return {
      total_kioscos: kioscos.length,
      kioscos_activos: kioscosActivos,
      kioscos_inactivos: kioscos.length - kioscosActivos, // 🔥 CORREGIDO
      uptime: process.uptime(),
      memoria: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        usado: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔄 ACTUALIZAR CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════════

  async updateKioskConfig(kioskId: string, config: any) {
    // Validar que el kiosco existe
    const exists = await this.kioscosService.exists(kioskId);
    
    if (!exists) {
      throw new Error(`Kiosco con ID ${kioskId} no encontrado`);
    }

    // Aquí podrías guardar la configuración personalizada
    // Por ahora solo retornamos confirmación
    return {
      success: true,
      kioskId,
      config,
      timestamp: new Date().toISOString(),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔧 CONFIGURACIÓN DE MANTENIMIENTO
  // ═══════════════════════════════════════════════════════════════

  async getMaintenanceConfig() {
    return {
      modo_mantenimiento: false,
      mensaje_mantenimiento: 'Sistema en mantenimiento. Vuelva pronto.',
      backup: {
        automatico: true,
        frecuencia: 'diaria',
        hora: '02:00',
        retener_dias: 7,
      },
      logs: {
        nivel: 'info',
        guardar_archivo: true,
        rotar_logs: true,
        max_tamanio_mb: 10,
      },
    };
  }
}