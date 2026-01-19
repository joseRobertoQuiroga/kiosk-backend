"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLicensesCommand = listLicensesCommand;
// cli/src/commands/list-licenses.ts
const ora_1 = __importDefault(require("ora"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../api");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function listLicensesCommand(options) {
    if (!(0, config_1.isAuthenticated)()) {
        logger_1.logger.error('Debes hacer login primero');
        process.exit(1);
    }
    logger_1.logger.header('📋 LISTADO DE LICENCIAS');
    const api = new api_1.ApiClient();
    const spinner = (0, ora_1.default)('Cargando licencias...').start();
    try {
        const response = await api.getLicenses({
            status: options.status,
            type: options.type,
        });
        spinner.stop();
        if (!response.data || response.data.length === 0) {
            logger_1.logger.warning('No hay licencias registradas');
            console.log('');
            logger_1.logger.info('Crea una licencia con: kiosko-cli create-license');
            process.exit(0);
        }
        const licenses = response.data;
        // Formato JSON
        if (options.format === 'json') {
            console.log(JSON.stringify(licenses, null, 2));
            process.exit(0);
        }
        // Formato tabla
        const table = new cli_table3_1.default({
            head: [
                chalk_1.default.cyan.bold('License Key'),
                chalk_1.default.cyan.bold('Cliente'),
                chalk_1.default.cyan.bold('Sucursal'),
                chalk_1.default.cyan.bold('Tipo'),
                chalk_1.default.cyan.bold('Estado'),
                chalk_1.default.cyan.bold('Expira'),
                chalk_1.default.cyan.bold('Días Rest.'),
            ],
            colWidths: [25, 20, 20, 12, 12, 12, 10],
            wordWrap: true,
        });
        licenses.forEach((license) => {
            const statusColor = license.status === 'active'
                ? chalk_1.default.green
                : license.status === 'expired'
                    ? chalk_1.default.red
                    : chalk_1.default.yellow;
            const daysRemaining = license.days_remaining
                ? license.days_remaining > 0
                    ? chalk_1.default.green(license.days_remaining)
                    : chalk_1.default.red('Expirado')
                : chalk_1.default.gray('N/A');
            table.push([
                license.license_key,
                license.client?.name || 'N/A',
                license.branch?.name || 'N/A',
                license.type,
                statusColor(license.status),
                license.expiry_date
                    ? new Date(license.expiry_date).toLocaleDateString()
                    : chalk_1.default.gray('Nunca'),
                daysRemaining,
            ]);
        });
        console.log('');
        console.log(table.toString());
        console.log('');
        logger_1.logger.info(`Total: ${licenses.length} licencias`);
        // Mostrar estadísticas
        const stats = {
            active: licenses.filter((l) => l.status === 'active').length,
            expired: licenses.filter((l) => l.status === 'expired').length,
            revoked: licenses.filter((l) => l.status === 'revoked').length,
        };
        console.log('');
        console.log(`${chalk_1.default.green('Activas:')} ${stats.active}  |  ` +
            `${chalk_1.default.red('Expiradas:')} ${stats.expired}  |  ` +
            `${chalk_1.default.yellow('Revocadas:')} ${stats.revoked}`);
        console.log('');
    }
    catch (error) {
        spinner.fail('Error al cargar licencias');
        logger_1.logger.error(error.message);
        process.exit(1);
    }
}
