"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutCommand = logoutCommand;
// cli/src/commands/logout.ts
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const api_1 = require("../api");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function logoutCommand() {
    logger_1.logger.header('👋 CERRAR SESIÓN');
    if (!(0, config_1.isAuthenticated)()) {
        logger_1.logger.warning('No hay una sesión activa');
        process.exit(0);
    }
    const config = (0, config_1.getConfig)();
    console.log(`Usuario: ${config.email}`);
    console.log(`Servidor: ${config.apiUrl}`);
    console.log('');
    const { confirm } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: '¿Cerrar sesión?',
            default: true,
        },
    ]);
    if (!confirm) {
        logger_1.logger.info('Operación cancelada');
        process.exit(0);
    }
    const spinner = (0, ora_1.default)('Cerrando sesión...').start();
    try {
        // Intentar invalidar el token en el servidor
        const api = new api_1.ApiClient();
        await api.logout();
    }
    catch (error) {
        // Si falla, continuar de todos modos
        spinner.warn('No se pudo invalidar el token en el servidor');
    }
    // Limpiar configuración local
    (0, config_1.clearConfig)();
    spinner.succeed('Sesión cerrada');
    console.log('');
    logger_1.logger.success('Token eliminado localmente');
    logger_1.logger.info('Para volver a autenticarte, ejecuta: kiosko-cli login');
    console.log('');
}
// Implementación en api.ts (agregar esto)
api_1.ApiClient.prototype.logout = async function () {
    const response = await this.client.post('/api/auth/logout');
    return response.data;
};
