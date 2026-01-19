// cli/src/commands/create-branch.ts
import inquirer from 'inquirer';
import ora from 'ora';
import { ApiClient } from '../api';
import { isAuthenticated } from '../config';
import { logger } from '../utils/logger';

export async function createBranchCommand() {
  try {
    logger.header('🏪 CREAR NUEVA SUCURSAL');

    // Verificar autenticación
    if (!isAuthenticated()) {
      logger.error('No has iniciado sesión. Ejecuta: kiosko-cli login');
      process.exit(1);
    }

    const api = new ApiClient();

    // Obtener lista de clientes
    logger.info('Cargando clientes...');
    const clientsResponse = await api.getClients();
    const clients = clientsResponse.data;

    if (clients.length === 0) {
      logger.warning('No hay clientes registrados.');
      logger.info('Primero crea un cliente con: kiosko-cli create-client');
      process.exit(0);
    }

    // Seleccionar cliente
    const clientChoices = clients.map((client: any) => ({
      name: `${client.name} (${client.id})`,
      value: client.id,
    }));

    const { clientId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'clientId',
        message: 'Selecciona el cliente:',
        choices: clientChoices,
      },
    ]);

    // Solicitar información de la sucursal
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Nombre de la sucursal:',
        validate: (input) => input.length > 0 || 'El nombre es requerido',
      },
      {
        type: 'input',
        name: 'code',
        message: 'Código de la sucursal (opcional):',
      },
      {
        type: 'input',
        name: 'city',
        message: 'Ciudad (opcional):',
      },
      {
        type: 'input',
        name: 'address',
        message: 'Dirección (opcional):',
      },
    ]);

    // Crear sucursal
    const spinner = ora('Creando sucursal...').start();

    const response = await api.createBranch(clientId, {
      name: answers.name,
      code: answers.code || undefined,
      city: answers.city || undefined,
      address: answers.address || undefined,
    });

    spinner.succeed('Sucursal creada exitosamente');

    // Obtener nombre del cliente
    const client = clients.find((c: any) => c.id === clientId);

    // Mostrar información
    logger.table('📋 INFORMACIÓN DE LA SUCURSAL', {
      'ID': response.data.id,
      'Nombre': response.data.name,
      'Código': response.data.code || 'N/A',
      'Cliente': client?.name || 'N/A',
      'Ciudad': response.data.city || 'N/A',
      'Dirección': response.data.address || 'N/A',
      'Fecha de creación': new Date(response.data.created_at).toLocaleString(),
    });

    logger.info('Guarda el ID de la sucursal para generar licencias.');
    console.log('');

  } catch (error: any) {
    logger.error('Error al crear sucursal: ' + (error.response?.data?.message || error.message));
    process.exit(1);
  }
}