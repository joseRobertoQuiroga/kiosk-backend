// cli/src/commands/login.ts
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { ApiClient } from '../api';
import { setConfig, getConfigPath } from '../config';
import { logger } from '../utils/logger';

export async function loginCommand() {
  logger.header('🔐 LOGIN - SISTEMA DE LICENCIAS KIOSCO');

  try {
    // 1. Solicitar URL del servidor
    const { apiUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiUrl',
        message: 'URL del servidor (incluyendo /api):',
        default: 'http://localhost:3000/api',
        validate: (input) => {
          if (!input.startsWith('http://') && !input.startsWith('https://')) {
            return 'La URL debe comenzar con http:// o https://';
          }
          return true;
        },
      },
    ]);

    // Guardar URL (remover / final si existe)
    const cleanUrl = apiUrl.replace(/\/$/, '');
    setConfig({ apiUrl: cleanUrl });

    // 2. Solicitar credenciales
    const { email, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email del super admin:',
        default: 'joserobertoquirogasalvador@gmail.com',
        validate: (input) => {
          if (!input.includes('@')) {
            return 'Email inválido';
          }
          return true;
        },
      },
      {
        type: 'password',
        name: 'password',
        message: 'Contraseña:',
        mask: '*',
      },
    ]);

    // 3. Intentar login
    const spinner = ora('Autenticando...').start();

    const api = new ApiClient();
    const response = await api.login(email, password);

    if (!response.access_token) {
      throw new Error('No se recibió token de acceso');
    }

    // 4. Guardar credenciales
    setConfig({
      token: response.access_token,
      refreshToken: response.refresh_token,
      email: response.user.email,
    });

    spinner.succeed('Login exitoso');
    console.log('');
    
    // 5. Mostrar información del usuario
    console.log(chalk.green.bold('✅ SESIÓN INICIADA'));
    console.log('');
    logger.table('Información del Usuario', {
      'Nombre': response.user.name,
      'Email': response.user.email,
      'Rol': response.user.role,
      'Servidor': cleanUrl,
    });

    logger.info('Token guardado en: ' + chalk.gray(getConfigPath()));
    logger.info('Token válido por: ' + chalk.cyan('1 año'));
    console.log('');
    logger.success('Ahora puedes ejecutar comandos de gestión de licencias');
    console.log('');
    console.log(chalk.cyan('Comandos disponibles:'));
    console.log('  • kiosko-cli create-client    - Crear cliente');
    console.log('  • kiosko-cli create-branch    - Crear sucursal');
    console.log('  • kiosko-cli create-license   - Generar licencia');
    console.log('  • kiosko-cli list             - Listar licencias');
    console.log('  • kiosko-cli export           - Exportar reporte');
    console.log('');

  } catch (error: any) {
    const spinner = ora().fail('Error en login');
    console.log('');

    if (error.response) {
      // Error HTTP del servidor
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        logger.error('Credenciales incorrectas');
        logger.info('Verifica tu email y contraseña');
      } else if (status === 404) {
        logger.error('Endpoint no encontrado');
        logger.warning('Verifica que la URL del servidor sea correcta');
        logger.info('Ejemplo: http://localhost:3000/api');
      } else if (status === 500) {
        logger.error('Error interno del servidor');
        if (data?.message) {
          logger.error(data.message);
        }
      } else {
        logger.error(`Error del servidor (${status})`);
        if (data?.message) {
          console.log(chalk.gray('  ' + data.message));
        }
      }
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('No se pudo conectar al servidor');
      logger.warning('Verifica que el backend esté corriendo');
      logger.info('Ejecuta en el backend: npm run start:dev');
    } else if (error.code === 'ETIMEDOUT') {
      logger.error('Tiempo de espera agotado');
      logger.warning('El servidor tardó demasiado en responder');
    } else {
      logger.error('Error de conexión: ' + error.message);
    }

    console.log('');
    process.exit(1);
  }
}