// cli/src/commands/revoke-license.ts
import inquirer from 'inquirer';
import ora from 'ora';
import { ApiClient } from '../api';
import { isAuthenticated } from '../config';
import { logger } from '../utils/logger';

export async function revokeLicenseCommand() {
  try {
    logger.header('🚫 REVOCAR LICENCIA');

    // Verificar autenticación
    if (!isAuthenticated()) {
      logger.error('No has iniciado sesión. Ejecuta: kiosko-cli login');
      process.exit(1);
    }

    const api = new ApiClient();

    // Obtener licencias activas
    logger.info('Cargando licencias activas...');
    const response = await api.getLicenses({ status: 'active' });
    const licenses = response.data;

    if (licenses.length === 0) {
      logger.warning('No hay licencias activas para revocar.');
      process.exit(0);
    }

    // Seleccionar licencia
    const licenseChoices = licenses.map((license: any) => ({
      name: `${license.license_key} - ${license.client?.name || 'N/A'} (${license.branch?.name || 'N/A'})`,
      value: license.id,
    }));

    const { licenseId, reason } = await inquirer.prompt([
      {
        type: 'list',
        name: 'licenseId',
        message: 'Selecciona la licencia a revocar:',
        choices: licenseChoices,
      },
      {
        type: 'input',
        name: 'reason',
        message: 'Razón de la revocación:',
        validate: (input) => input.length > 0 || 'La razón es requerida',
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: '⚠️  ¿Estás seguro? Esta acción no se puede deshacer.',
        default: false,
      },
    ]);

    if (!reason) {
      logger.warning('Operación cancelada.');
      process.exit(0);
    }

    // Revocar licencia
    const spinner = ora('Revocando licencia...').start();

    const revokeResponse = await api.revokeLicense(licenseId, reason);

    spinner.succeed('Licencia revocada exitosamente');

    // Obtener info de la licencia revocada
    const license = licenses.find((l: any) => l.id === licenseId);

    logger.table('📋 LICENCIA REVOCADA', {
      'License Key': license.license_key,
      'Cliente': license.client?.name || 'N/A',
      'Sucursal': license.branch?.name || 'N/A',
      'Tipo': license.type,
      'Razón': reason,
      'Revocada el': new Date().toLocaleString(),
    });

    logger.warning('Los dispositivos con esta licencia serán bloqueados en el próximo heartbeat.');
    console.log('');

  } catch (error: any) {
    logger.error('Error al revocar licencia: ' + (error.response?.data?.message || error.message));
    process.exit(1);
  }
}