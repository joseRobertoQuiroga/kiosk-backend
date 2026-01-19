// cli/src/commands/export-report.ts
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { ApiClient } from '../api';
import { isAuthenticated, getConfig } from '../config';
import { logger } from '../utils/logger';

export async function exportReportCommand(outputPath?: string) {
  if (!isAuthenticated()) {
    logger.error('Debes hacer login primero');
    process.exit(1);
  }

  logger.header('📊 EXPORTAR REPORTE DE LICENCIAS');

  const api = new ApiClient();
  const spinner = ora('Generando reporte...').start();

  try {
    // 1. Obtener datos
    const [licensesRes, statsRes, clientsRes, devicesRes] = await Promise.all([
      api.getLicenses(),
      api.getStats(),
      api.getClients(),
      api.getDevices(),
    ]);

    spinner.text = 'Procesando datos...';

    const licenses = licensesRes.data || [];
    const stats = statsRes.data || {};
    const clients = clientsRes.data || [];
    const devices = devicesRes.data || [];

    // 2. Generar contenido del reporte
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const config = getConfig();

    let report = '';
    report += '═'.repeat(80) + '\n';
    report += '  REPORTE DE LICENCIAS - KIOSCO SCANNER\n';
    report += '═'.repeat(80) + '\n';
    report += `\nGenerado: ${new Date().toLocaleString()}\n`;
    report += `Servidor: ${config.apiUrl}\n`;
    report += `Usuario: ${config.email}\n`;
    report += '\n';

    // ESTADÍSTICAS GENERALES
    report += '─'.repeat(80) + '\n';
    report += 'ESTADÍSTICAS GENERALES\n';
    report += '─'.repeat(80) + '\n';
    report += `Total Licencias: ${stats.total || 0}\n`;
    report += `  • Activas: ${stats.by_status?.active || 0}\n`;
    report += `  • Expiradas: ${stats.by_status?.expired || 0}\n`;
    report += `  • Revocadas: ${stats.by_status?.revoked || 0}\n`;
    report += `  • Pendientes: ${stats.by_status?.pending || 0}\n`;
    report += `\n`;
    report += `Por Tipo:\n`;
    report += `  • Trial: ${stats.by_type?.trial || 0}\n`;
    report += `  • Annual: ${stats.by_type?.annual || 0}\n`;
    report += `  • Perpetual: ${stats.by_type?.perpetual || 0}\n`;
    report += `\n`;
    report += `Total Clientes: ${clients.length}\n`;
    report += `Total Dispositivos: ${devices.length}\n`;
    report += '\n';

    // LISTADO DE LICENCIAS
    report += '─'.repeat(80) + '\n';
    report += 'DETALLE DE LICENCIAS\n';
    report += '─'.repeat(80) + '\n\n';

    if (licenses.length === 0) {
      report += 'No hay licencias registradas.\n\n';
    } else {
      licenses.forEach((license: any, index: number) => {
        report += `[${index + 1}] ${license.license_key}\n`;
        report += `    Cliente: ${license.client?.name || 'N/A'}\n`;
        report += `    Sucursal: ${license.branch?.name || 'N/A'}\n`;
        report += `    Tipo: ${license.type}\n`;
        report += `    Estado: ${license.status}\n`;
        report += `    Emitida: ${new Date(license.issued_date).toLocaleDateString()}\n`;
        report += `    Expira: ${
          license.expiry_date
            ? new Date(license.expiry_date).toLocaleDateString()
            : 'Nunca'
        }\n`;
        if (license.days_remaining !== undefined && license.days_remaining !== null) {
          report += `    Días restantes: ${license.days_remaining}\n`;
        }
        if (license.notes) {
          report += `    Notas: ${license.notes}\n`;
        }
        report += '\n';
      });
    }

    // CLIENTES
    report += '─'.repeat(80) + '\n';
    report += 'CLIENTES REGISTRADOS\n';
    report += '─'.repeat(80) + '\n\n';

    if (clients.length === 0) {
      report += 'No hay clientes registrados.\n\n';
    } else {
      clients.forEach((client: any, index: number) => {
        report += `[${index + 1}] ${client.name}\n`;
        if (client.tax_id) report += `    RUC/NIT: ${client.tax_id}\n`;
        if (client.contact_email) report += `    Email: ${client.contact_email}\n`;
        if (client.city) report += `    Ciudad: ${client.city}\n`;
        report += `    Estado: ${client.is_active ? 'Activo' : 'Inactivo'}\n`;
        report += '\n';
      });
    }

    // DISPOSITIVOS
    report += '─'.repeat(80) + '\n';
    report += 'DISPOSITIVOS REGISTRADOS\n';
    report += '─'.repeat(80) + '\n\n';

    if (devices.length === 0) {
      report += 'No hay dispositivos registrados.\n\n';
    } else {
      devices.forEach((device: any, index: number) => {
        report += `[${index + 1}] ${device.device_name || 'Sin nombre'}\n`;
        report += `    Fingerprint: ${device.device_fingerprint.substring(0, 16)}...\n`;
        if (device.build_brand && device.build_model) {
          report += `    Modelo: ${device.build_brand} ${device.build_model}\n`;
        }
        report += `    Primera conexión: ${new Date(device.first_seen_at).toLocaleDateString()}\n`;
        if (device.last_seen_at) {
          report += `    Última conexión: ${new Date(device.last_seen_at).toLocaleDateString()}\n`;
        }
        report += `    Rooteado: ${device.is_rooted ? 'SÍ ⚠️' : 'NO'}\n`;
        report += `    Bloqueado: ${device.is_blacklisted ? 'SÍ ⛔' : 'NO'}\n`;
        report += '\n';
      });
    }

    report += '═'.repeat(80) + '\n';
    report += 'FIN DEL REPORTE\n';
    report += '═'.repeat(80) + '\n';

    // 3. Guardar archivo
    const filename = outputPath || `reporte_licencias_${timestamp}.txt`;
    const filepath = path.resolve(filename);

    fs.writeFileSync(filepath, report, 'utf-8');

    spinner.succeed('Reporte generado exitosamente');
    console.log('');
    logger.success(`Archivo guardado en: ${filepath}`);
    logger.info(`Total de licencias: ${licenses.length}`);
    logger.info(`Total de clientes: ${clients.length}`);
    logger.info(`Total de dispositivos: ${devices.length}`);
    console.log('');
  } catch (error: any) {
    spinner.fail('Error al generar reporte');
    logger.error(error.message);
    process.exit(1);
  }
}