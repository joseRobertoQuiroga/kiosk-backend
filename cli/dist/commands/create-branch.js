"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBranchCommand = createBranchCommand;
// cli/src/commands/create-branch.ts
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const api_1 = require("../api");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function createBranchCommand() {
    try {
        logger_1.logger.header('🏪 CREAR NUEVA SUCURSAL');
        // Verificar autenticación
        if (!(0, config_1.isAuthenticated)()) {
            logger_1.logger.error('No has iniciado sesión. Ejecuta: kiosko-cli login');
            process.exit(1);
        }
        const api = new api_1.ApiClient();
        // Obtener lista de clientes
        logger_1.logger.info('Cargando clientes...');
        const clientsResponse = await api.getClients();
        const clients = clientsResponse.data;
        if (clients.length === 0) {
            logger_1.logger.warning('No hay clientes registrados.');
            logger_1.logger.info('Primero crea un cliente con: kiosko-cli create-client');
            process.exit(0);
        }
        // Seleccionar cliente
        const clientChoices = clients.map((client) => ({
            name: `${client.name} (${client.id})`,
            value: client.id,
        }));
        const { clientId } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'clientId',
                message: 'Selecciona el cliente:',
                choices: clientChoices,
            },
        ]);
        // Solicitar información de la sucursal
        const answers = await inquirer_1.default.prompt([
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
        const spinner = (0, ora_1.default)('Creando sucursal...').start();
        const response = await api.createBranch(clientId, {
            name: answers.name,
            code: answers.code || undefined,
            city: answers.city || undefined,
            address: answers.address || undefined,
        });
        spinner.succeed('Sucursal creada exitosamente');
        // Obtener nombre del cliente
        const client = clients.find((c) => c.id === clientId);
        // Mostrar información
        logger_1.logger.table('📋 INFORMACIÓN DE LA SUCURSAL', {
            'ID': response.data.id,
            'Nombre': response.data.name,
            'Código': response.data.code || 'N/A',
            'Cliente': client?.name || 'N/A',
            'Ciudad': response.data.city || 'N/A',
            'Dirección': response.data.address || 'N/A',
            'Fecha de creación': new Date(response.data.created_at).toLocaleString(),
        });
        logger_1.logger.info('Guarda el ID de la sucursal para generar licencias.');
        console.log('');
    }
    catch (error) {
        logger_1.logger.error('Error al crear sucursal: ' + (error.response?.data?.message || error.message));
        process.exit(1);
    }
}
