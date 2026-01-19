"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientCommand = createClientCommand;
// cli/src/commands/create-client.ts
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const api_1 = require("../api");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function createClientCommand() {
    try {
        logger_1.logger.header('🏢 CREAR NUEVO CLIENTE');
        // Verificar autenticación
        if (!(0, config_1.isAuthenticated)()) {
            logger_1.logger.error('No has iniciado sesión. Ejecuta: kiosko-cli login');
            process.exit(1);
        }
        // Solicitar información del cliente
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Nombre del cliente:',
                validate: (input) => input.length > 0 || 'El nombre es requerido',
            },
            {
                type: 'input',
                name: 'tax_id',
                message: 'RUC/NIT (opcional):',
            },
            {
                type: 'input',
                name: 'contact_email',
                message: 'Email de contacto (opcional):',
            },
            {
                type: 'input',
                name: 'contact_phone',
                message: 'Teléfono de contacto (opcional):',
            },
            {
                type: 'input',
                name: 'city',
                message: 'Ciudad (opcional):',
            },
        ]);
        // Crear cliente
        const spinner = (0, ora_1.default)('Creando cliente...').start();
        const api = new api_1.ApiClient();
        const response = await api.createClient({
            name: answers.name,
            tax_id: answers.tax_id || undefined,
            contact_email: answers.contact_email || undefined,
            contact_phone: answers.contact_phone || undefined,
            city: answers.city || undefined,
        });
        spinner.succeed('Cliente creado exitosamente');
        // Mostrar información
        logger_1.logger.table('📋 INFORMACIÓN DEL CLIENTE', {
            'ID': response.data.id,
            'Nombre': response.data.name,
            'RUC/NIT': response.data.tax_id || 'N/A',
            'Email': response.data.contact_email || 'N/A',
            'Teléfono': response.data.contact_phone || 'N/A',
            'Ciudad': response.data.city || 'N/A',
            'Fecha de creación': new Date(response.data.created_at).toLocaleString(),
        });
        logger_1.logger.info('Guarda el ID del cliente para crear sucursales y licencias.');
        console.log('');
    }
    catch (error) {
        logger_1.logger.error('Error al crear cliente: ' + (error.response?.data?.message || error.message));
        process.exit(1);
    }
}
