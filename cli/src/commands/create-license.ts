// cli/src/commands/create-license.ts
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { ApiClient } from '../api';
import { isAuthenticated } from '../config';
import { logger } from '../utils/logger';

export async function createLicenseCommand() {
  if (!isAuthenticated()) {
    logger.error('Debes hacer login primero');
    logger.info('Ejecuta: kiosko-cli login');
    process.exit(1);
  }

  logger.header('🎫 CREAR NUEVA LICENCIA');

  const api = new ApiClient();

  try {
    // 1. Obtener lista de clientes
    const spinner = ora('Cargando clientes...').start();
    const clientsResponse = await api.getClients();
    spinner.stop();

    if (!clientsResponse.data || clientsResponse.data.length === 0) {
      logger.warning('No hay clientes registrados');
      logger.info('Primero crea un cliente con: kiosko-cli create-client');
      process.exit(1);
    }

    const clients = clientsResponse.data;

    // 2. Seleccionar cliente
    const { clientId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'clientId',
        message: 'Selecciona el cliente:',
        choices: clients.map((c: any) => ({
          name: `${c.name} ${c.tax_id ? `(${c.tax_id})` : ''}`,
          value: c.id,
        })),
      },
    ]);

    // 3. Obtener sucursales del cliente
    spinner.start('Cargando sucursales...');
    const branchesResponse = await api.getBranches(clientId);
    spinner.stop();

    if (!branchesResponse.data || branchesResponse.data.length === 0) {
      logger.warning('Este cliente no tiene sucursales');
      logger.info('Primero crea una sucursal con: kiosko-cli create-branch');
      process.exit(1);
    }

    const branches = branchesResponse.data;

    // 4. Seleccionar sucursal
    const { branchId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'branchId',
        message: 'Selecciona la sucursal:',
        choices: branches.map((b: any) => ({
          name: `${b.name} ${b.code ? `(${b.code})` : ''} - ${b.city || 'N/A'}`,
          value: b.id,
        })),
      },
    ]);

    // 5. Seleccionar tipo de licencia
    const { type, notes } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Tipo de licencia:',
        choices: [
          { name: '🔄 Trial (10 días)', value: 'trial' },
          { name: '📅 Annual (365 días)', value: 'annual' },
          { name: '♾️  Perpetual (sin expiración)', value: 'perpetual' },
        ],
      },
      {
        type: 'input',
        name: 'notes',
        message: 'Notas (opcional):',
      },
    ]);

    // 6. Confirmar creación
    console.log('');
    logger.separator();
    console.log(chalk.bold('Resumen de la licencia:'));
    console.log(`  Cliente: ${clients.find((c: any) => c.id === clientId)?.name}`);
    console.log(`  Sucursal: ${branches.find((b: any) => b.id === branchId)?.name}`);
    console.log(`  Tipo: ${type}`);
    if (notes) console.log(`  Notas: ${notes}`);
    logger.separator();
    console.log('');

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '¿Crear esta licencia?',
        default: true,
      },
    ]);

    if (!confirm) {
      logger.warning('Operación cancelada');
      process.exit(0);
    }

    // 7. Crear licencia
    spinner.start('Generando licencia...');
    const response = await api.createLicense({
      type,
      client_id: clientId,
      branch_id: branchId,
      notes: notes || undefined,
    });
    spinner.succeed('Licencia creada exitosamente');

    const license = response.data;

    // 8. Mostrar resultado
    console.log('');
    logger.header('✅ LICENCIA GENERADA');
    logger.table('Información de la Licencia', {
      'License Key': chalk.green.bold(license.license_key),
      'ID': license.id,
      'Tipo': license.type,
      'Estado': license.status,
      'Cliente': clients.find((c: any) => c.id === clientId)?.name,
      'Sucursal': branches.find((b: any) => b.id === branchId)?.name,
      'Emitida': new Date(license.issued_date).toLocaleDateString(),
      'Expira': license.expiry_date 
        ? new Date(license.expiry_date).toLocaleDateString() 
        : 'Nunca',
    });

    logger.info('Proporciona este LICENSE KEY al cliente para activar el dispositivo');
    console.log('');
    console.log(chalk.cyan.bold('  LICENSE KEY: ') + chalk.green.bold(license.license_key));
    console.log('');
  } catch (error: any) {
    logger.error('Error al crear licencia');
    if (error.response?.data?.message) {
      logger.error(error.response.data.message);
    } else {
      logger.error(error.message);
    }
    process.exit(1);
  }
}