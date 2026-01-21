import ora from 'ora';
import Table from 'cli-table3';
import chalk from 'chalk';
import { ApiClient } from '../api';
import { isAuthenticated } from '../config';
import { logger } from '../utils/logger';

export async function listLicensesCommand(options: {
  status?: string;
  type?: string;
  format?: 'table' | 'json';
}) {
  if (!isAuthenticated()) {
    logger.error('Debes hacer login primero');
    process.exit(1);
  }

  logger.header('📋 LISTADO DE LICENCIAS');

  const api = new ApiClient();
  const spinner = ora('Cargando licencias...').start();

  try {
    const response = await api.getLicenses({
      status: options.status,
      type: options.type,
    });

    spinner.stop();

    if (!response.data || response.data.length === 0) {
      logger.warning('No hay licencias registradas');
      console.log('');
      logger.info('Crea una licencia con: kiosko-cli create-license');
      process.exit(0);
    }

    const licenses = response.data;

    // JSON
    if (options.format === 'json') {
      console.log(JSON.stringify(licenses, null, 2));
      process.exit(0);
    }

    const table = new Table({
      head: [
        chalk.cyan.bold('License Key'),
        chalk.cyan.bold('Cliente'),
        chalk.cyan.bold('Sucursal'),
        chalk.cyan.bold('Tipo'),
        chalk.cyan.bold('Estado'),
        chalk.cyan.bold('Expira'),
        chalk.cyan.bold('Días Rest.'),
      ],
      colWidths: [25, 20, 22, 10, 12, 12, 10],
      wordWrap: true,
    });

    licenses.forEach((license: any) => {
      const statusColor =
        license.status === 'active'
          ? chalk.green
          : license.status === 'expired'
          ? chalk.red
          : chalk.yellow;

      const daysRemaining = license.expires_at
        ? Math.ceil(
            (new Date(license.expires_at).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      table.push([
        license.license_key,
        license.client?.company_name || 'N/A',
        license.branch?.branch_name || 'N/A',
        license.license_type,
        statusColor(license.status),
        license.expires_at
          ? new Date(license.expires_at).toLocaleDateString()
          : chalk.gray('Nunca'),
        daysRemaining !== null
          ? daysRemaining > 0
            ? chalk.green(daysRemaining)
            : chalk.red('Expirada')
          : chalk.gray('N/A'),
      ]);
    });

    console.log('');
    console.log(table.toString());
    console.log('');
    logger.info(`Total: ${licenses.length} licencias`);

    const stats = {
      active: licenses.filter((l: any) => l.status === 'active').length,
      expired: licenses.filter((l: any) => l.status === 'expired').length,
      revoked: licenses.filter((l: any) => l.status === 'revoked').length,
    };

    console.log('');
    console.log(
      `${chalk.green('Activas:')} ${stats.active}  | ` +
        `${chalk.red('Expiradas:')} ${stats.expired}  | ` +
        `${chalk.yellow('Revocadas:')} ${stats.revoked}`
    );
    console.log('');
  } catch (error: any) {
    spinner.fail('Error al cargar licencias');
    logger.error(error.message);
    process.exit(1);
  }
}
