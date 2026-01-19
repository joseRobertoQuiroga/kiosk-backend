// cli/src/commands/logout.ts
import inquirer from 'inquirer';
import ora from 'ora';
import { ApiClient } from '../api';
import { isAuthenticated, clearConfig, getConfig } from '../config';
import { logger } from '../utils/logger';

export async function logoutCommand() {
  logger.header('👋 CERRAR SESIÓN');

  if (!isAuthenticated()) {
    logger.warning('No hay una sesión activa');
    process.exit(0);
  }

  const config = getConfig();

  console.log(`Usuario: ${config.email}`);
  console.log(`Servidor: ${config.apiUrl}`);
  console.log('');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '¿Cerrar sesión?',
      default: true,
    },
  ]);

  if (!confirm) {
    logger.info('Operación cancelada');
    process.exit(0);
  }

  const spinner = ora('Cerrando sesión...').start();

  try {
    // Intentar invalidar el token en el servidor
    const api = new ApiClient();
    await api.logout();
  } catch (error) {
    // Si falla, continuar de todos modos
    spinner.warn('No se pudo invalidar el token en el servidor');
  }

  // Limpiar configuración local
  clearConfig();

  spinner.succeed('Sesión cerrada');
  console.log('');
  logger.success('Token eliminado localmente');
  logger.info('Para volver a autenticarte, ejecuta: kiosko-cli login');
  console.log('');
}

// Agregar método logout al ApiClient
declare module '../api' {
  interface ApiClient {
    logout(): Promise<any>;
  }
}

// Implementación en api.ts (agregar esto)
ApiClient.prototype.logout = async function() {
  const response = await this.client.post('/api/auth/logout');
  return response.data;
};