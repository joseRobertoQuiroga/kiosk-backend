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

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const config = getConfig();

    let report = '';
    report += '═'.repeat(80) + '\n';
    report += '  REPORTE DE LICENCIAS - KIOSCO SCANNER\n';
    report += '═'.repeat(80) + '\n';
    report += `\nGenerado: ${new Date().toLocaleString()}\n`;
    report += `Servidor: ${config.apiUrl}\n`;
    report += `Usuario: ${config.email}\n\n`;

    // ESTADÍSTICAS
    report += '─'.repeat(80) + '\n';
    report += 'ESTADÍSTICAS GENERALES\n';
    report += '─'.repeat(80) + '\n';
    report += `Total Licencias: ${stats.total || licenses.length}\n`;
    report += `  • Activas: ${stats.by_status?.active || 0}\n`;
    report += `  • Expiradas: ${stats.by_status?.expired || 0}\n`;
    report += `  • Revocadas: ${stats.by_status?.revoked || 0}\n\n`;
    report += `Total Clientes: ${clients.length}\n`;
    report += `Total Dispositivos: ${devices.length}\n\n`;

    // LICENCIAS
    report += '─'.repeat(80) + '\n';
    report += 'DETALLE DE LICENCIAS\n';
    report += '─'.repeat(80) + '\n\n';

    licenses.forEach((license: any, index: number) => {
      report += `[${index + 1}] ${license.license_key}\n`;
      report += `    Cliente: ${license.client?.company_name || 'N/A'}\n`;
      report += `    Sucursal: ${license.branch?.branch_name || 'N/A'}\n`;
      report += `    Tipo: ${license.license_type}\n`;
      report += `    Estado: ${license.status}\n`;
      report += `    Emitida: ${new Date(license.issued_at).toLocaleDateString()}\n`;
      report += `    Expira: ${
        license.expires_at
          ? new Date(license.expires_at).toLocaleDateString()
          : 'Nunca'
      }\n`;

      if (license.notes) {
        report += `    Notas: ${license.notes}\n`;
      }
      report += '\n';
    });

    // GUARDAR
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
