"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCommand = loginCommand;
// cli/src/commands/login.ts
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../api");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function loginCommand() {
    logger_1.logger.header('🔐 LOGIN - SISTEMA DE LICENCIAS KIOSCO');
    try {
        // 1. Solicitar URL del servidor
        const { apiUrl } = await inquirer_1.default.prompt([
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
        (0, config_1.setConfig)({ apiUrl: cleanUrl });
        // 2. Solicitar credenciales
        const { email, password } = await inquirer_1.default.prompt([
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
        const spinner = (0, ora_1.default)('Autenticando...').start();
        const api = new api_1.ApiClient();
        const response = await api.login(email, password);
        if (!response.access_token) {
            throw new Error('No se recibió token de acceso');
        }
        // 4. Guardar credenciales
        (0, config_1.setConfig)({
            token: response.access_token,
            refreshToken: response.refresh_token,
            email: response.user.email,
        });
        spinner.succeed('Login exitoso');
        console.log('');
        // 5. Mostrar información del usuario
        console.log(chalk_1.default.green.bold('✅ SESIÓN INICIADA'));
        console.log('');
        logger_1.logger.table('Información del Usuario', {
            'Nombre': response.user.name,
            'Email': response.user.email,
            'Rol': response.user.role,
            'Servidor': cleanUrl,
        });
        logger_1.logger.info('Token guardado en: ' + chalk_1.default.gray((0, config_1.getConfigPath)()));
        logger_1.logger.info('Token válido por: ' + chalk_1.default.cyan('1 año'));
        console.log('');
        logger_1.logger.success('Ahora puedes ejecutar comandos de gestión de licencias');
        console.log('');
        console.log(chalk_1.default.cyan('Comandos disponibles:'));
        console.log('  • kiosko-cli create-client    - Crear cliente');
        console.log('  • kiosko-cli create-branch    - Crear sucursal');
        console.log('  • kiosko-cli create-license   - Generar licencia');
        console.log('  • kiosko-cli list             - Listar licencias');
        console.log('  • kiosko-cli export           - Exportar reporte');
        console.log('');
    }
    catch (error) {
        const spinner = (0, ora_1.default)().fail('Error en login');
        console.log('');
        if (error.response) {
            // Error HTTP del servidor
            const status = error.response.status;
            const data = error.response.data;
            if (status === 401) {
                logger_1.logger.error('Credenciales incorrectas');
                logger_1.logger.info('Verifica tu email y contraseña');
            }
            else if (status === 404) {
                logger_1.logger.error('Endpoint no encontrado');
                logger_1.logger.warning('Verifica que la URL del servidor sea correcta');
                logger_1.logger.info('Ejemplo: http://localhost:3000/api');
            }
            else if (status === 500) {
                logger_1.logger.error('Error interno del servidor');
                if (data?.message) {
                    logger_1.logger.error(data.message);
                }
            }
            else {
                logger_1.logger.error(`Error del servidor (${status})`);
                if (data?.message) {
                    console.log(chalk_1.default.gray('  ' + data.message));
                }
            }
        }
        else if (error.code === 'ECONNREFUSED') {
            logger_1.logger.error('No se pudo conectar al servidor');
            logger_1.logger.warning('Verifica que el backend esté corriendo');
            logger_1.logger.info('Ejecuta en el backend: npm run start:dev');
        }
        else if (error.code === 'ETIMEDOUT') {
            logger_1.logger.error('Tiempo de espera agotado');
            logger_1.logger.warning('El servidor tardó demasiado en responder');
        }
        else {
            logger_1.logger.error('Error de conexión: ' + error.message);
        }
        console.log('');
        process.exit(1);
    }
}
