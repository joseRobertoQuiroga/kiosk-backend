"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLicenseCommand = createLicenseCommand;
// cli/src/commands/create-license.ts
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../api");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function createLicenseCommand() {
    if (!(0, config_1.isAuthenticated)()) {
        logger_1.logger.error('Debes hacer login primero');
        logger_1.logger.info('Ejecuta: kiosko-cli login');
        process.exit(1);
    }
    logger_1.logger.header('🎫 CREAR NUEVA LICENCIA');
    const api = new api_1.ApiClient();
    try {
        // 1. Obtener lista de clientes
        const spinner = (0, ora_1.default)('Cargando clientes...').start();
        const clientsResponse = await api.getClients();
        spinner.stop();
        if (!clientsResponse.data || clientsResponse.data.length === 0) {
            logger_1.logger.warning('No hay clientes registrados');
            logger_1.logger.info('Primero crea un cliente con: kiosko-cli create-client');
            process.exit(1);
        }
        const clients = clientsResponse.data;
        // 2. Seleccionar cliente
        const { clientId } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'clientId',
                message: 'Selecciona el cliente:',
                choices: clients.map((c) => ({
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
            logger_1.logger.warning('Este cliente no tiene sucursales');
            logger_1.logger.info('Primero crea una sucursal con: kiosko-cli create-branch');
            process.exit(1);
        }
        const branches = branchesResponse.data;
        // 4. Seleccionar sucursal
        const { branchId } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'branchId',
                message: 'Selecciona la sucursal:',
                choices: branches.map((b) => ({
                    name: `${b.name} ${b.code ? `(${b.code})` : ''} - ${b.city || 'N/A'}`,
                    value: b.id,
                })),
            },
        ]);
        // 5. Seleccionar tipo de licencia
        const { type, notes } = await inquirer_1.default.prompt([
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
        logger_1.logger.separator();
        console.log(chalk_1.default.bold('Resumen de la licencia:'));
        console.log(`  Cliente: ${clients.find((c) => c.id === clientId)?.name}`);
        console.log(`  Sucursal: ${branches.find((b) => b.id === branchId)?.name}`);
        console.log(`  Tipo: ${type}`);
        if (notes)
            console.log(`  Notas: ${notes}`);
        logger_1.logger.separator();
        console.log('');
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: '¿Crear esta licencia?',
                default: true,
            },
        ]);
        if (!confirm) {
            logger_1.logger.warning('Operación cancelada');
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
        logger_1.logger.header('✅ LICENCIA GENERADA');
        logger_1.logger.table('Información de la Licencia', {
            'License Key': chalk_1.default.green.bold(license.license_key),
            'ID': license.id,
            'Tipo': license.type,
            'Estado': license.status,
            'Cliente': clients.find((c) => c.id === clientId)?.name,
            'Sucursal': branches.find((b) => b.id === branchId)?.name,
            'Emitida': new Date(license.issued_date).toLocaleDateString(),
            'Expira': license.expiry_date
                ? new Date(license.expiry_date).toLocaleDateString()
                : 'Nunca',
        });
        logger_1.logger.info('Proporciona este LICENSE KEY al cliente para activar el dispositivo');
        console.log('');
        console.log(chalk_1.default.cyan.bold('  LICENSE KEY: ') + chalk_1.default.green.bold(license.license_key));
        console.log('');
    }
    catch (error) {
        logger_1.logger.error('Error al crear licencia');
        if (error.response?.data?.message) {
            logger_1.logger.error(error.response.data.message);
        }
        else {
            logger_1.logger.error(error.message);
        }
        process.exit(1);
    }
}
