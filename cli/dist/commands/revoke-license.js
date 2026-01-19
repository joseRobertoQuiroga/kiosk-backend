"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeLicenseCommand = revokeLicenseCommand;
// cli/src/commands/revoke-license.ts
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const api_1 = require("../api");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function revokeLicenseCommand() {
    try {
        logger_1.logger.header('🚫 REVOCAR LICENCIA');
        // Verificar autenticación
        if (!(0, config_1.isAuthenticated)()) {
            logger_1.logger.error('No has iniciado sesión. Ejecuta: kiosko-cli login');
            process.exit(1);
        }
        const api = new api_1.ApiClient();
        // Obtener licencias activas
        logger_1.logger.info('Cargando licencias activas...');
        const response = await api.getLicenses({ status: 'active' });
        const licenses = response.data;
        if (licenses.length === 0) {
            logger_1.logger.warning('No hay licencias activas para revocar.');
            process.exit(0);
        }
        // Seleccionar licencia
        const licenseChoices = licenses.map((license) => ({
            name: `${license.license_key} - ${license.client?.name || 'N/A'} (${license.branch?.name || 'N/A'})`,
            value: license.id,
        }));
        const { licenseId, reason } = await inquirer_1.default.prompt([
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
            logger_1.logger.warning('Operación cancelada.');
            process.exit(0);
        }
        // Revocar licencia
        const spinner = (0, ora_1.default)('Revocando licencia...').start();
        const revokeResponse = await api.revokeLicense(licenseId, reason);
        spinner.succeed('Licencia revocada exitosamente');
        // Obtener info de la licencia revocada
        const license = licenses.find((l) => l.id === licenseId);
        logger_1.logger.table('📋 LICENCIA REVOCADA', {
            'License Key': license.license_key,
            'Cliente': license.client?.name || 'N/A',
            'Sucursal': license.branch?.name || 'N/A',
            'Tipo': license.type,
            'Razón': reason,
            'Revocada el': new Date().toLocaleString(),
        });
        logger_1.logger.warning('Los dispositivos con esta licencia serán bloqueados en el próximo heartbeat.');
        console.log('');
    }
    catch (error) {
        logger_1.logger.error('Error al revocar licencia: ' + (error.response?.data?.message || error.message));
        process.exit(1);
    }
}
