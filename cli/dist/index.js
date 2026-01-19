#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// cli/src/index.ts
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const login_1 = require("./commands/login");
const logout_1 = require("./commands/logout");
const create_client_1 = require("./commands/create-client");
const create_branch_1 = require("./commands/create-branch");
const create_license_1 = require("./commands/create-license");
const list_licenses_1 = require("./commands/list-licenses");
const revoke_license_1 = require("./commands/revoke-license");
const export_report_1 = require("./commands/export-report");
const logger_1 = require("./utils/logger");
const config_1 = require("./config");
const program = new commander_1.Command();
// Banner de inicio
console.clear();
console.log('');
console.log(chalk_1.default.cyan.bold('═'.repeat(70)));
console.log(chalk_1.default.cyan.bold('  🔐 KIOSCO LICENSE MANAGER CLI v1.0.0'));
console.log(chalk_1.default.cyan.bold('  Sistema de Gestión de Licencias para Kiosco Scanner'));
console.log(chalk_1.default.cyan.bold('═'.repeat(70)));
console.log('');
// Mostrar estado de sesión
if ((0, config_1.isAuthenticated)()) {
    const config = (0, config_1.getConfig)();
    console.log(chalk_1.default.green('✓ Sesión activa: ') + chalk_1.default.white(config.email));
    console.log(chalk_1.default.gray('  Servidor: ' + config.apiUrl));
    console.log('');
}
// Configuración del programa
program
    .name('kiosko-cli')
    .description('CLI para gestión de licencias del sistema Kiosco Scanner')
    .version('1.0.0');
// ═══════════════════════════════════════════════════════════════
// 🔐 AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════
program
    .command('login')
    .description('Iniciar sesión como super administrador')
    .action(login_1.loginCommand);
program
    .command('logout')
    .description('Cerrar sesión actual')
    .action(logout_1.logoutCommand);
// ═══════════════════════════════════════════════════════════════
// 👥 GESTIÓN DE CLIENTES
// ═══════════════════════════════════════════════════════════════
program
    .command('create-client')
    .alias('cc')
    .description('Crear un nuevo cliente')
    .action(create_client_1.createClientCommand);
program
    .command('create-branch')
    .alias('cb')
    .description('Crear una nueva sucursal para un cliente')
    .action(create_branch_1.createBranchCommand);
// ═══════════════════════════════════════════════════════════════
// 🎫 GESTIÓN DE LICENCIAS
// ═══════════════════════════════════════════════════════════════
program
    .command('create-license')
    .alias('cl')
    .description('Generar una nueva licencia')
    .action(create_license_1.createLicenseCommand);
program
    .command('list')
    .alias('ls')
    .description('Listar licencias')
    .option('-s, --status <status>', 'Filtrar por estado (active, expired, revoked)')
    .option('-t, --type <type>', 'Filtrar por tipo (trial, annual, perpetual)')
    .option('-c, --client <clientId>', 'Filtrar por ID de cliente')
    .option('-f, --format <format>', 'Formato de salida (table, json)', 'table')
    .action(list_licenses_1.listLicensesCommand);
program
    .command('revoke')
    .description('Revocar una licencia existente')
    .action(revoke_license_1.revokeLicenseCommand);
// ═══════════════════════════════════════════════════════════════
// 📊 REPORTES Y ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════
program
    .command('stats')
    .description('Ver estadísticas del sistema')
    .action(async () => {
    if (!(0, config_1.isAuthenticated)()) {
        logger_1.logger.error('Debes hacer login primero');
        process.exit(1);
    }
    const { ApiClient } = await Promise.resolve().then(() => __importStar(require('./api.js')));
    const ora = (await Promise.resolve().then(() => __importStar(require('ora')))).default;
    logger_1.logger.header('📊 ESTADÍSTICAS DEL SISTEMA');
    const spinner = ora('Cargando estadísticas...').start();
    try {
        const api = new ApiClient();
        const response = await api.getStats();
        const stats = response.data;
        spinner.succeed('Estadísticas cargadas');
        console.log('');
        logger_1.logger.table('Resumen General', {
            'Total Licencias': stats.total || 0,
            'Activas': chalk_1.default.green(stats.by_status?.active || 0),
            'Expiradas': chalk_1.default.red(stats.by_status?.expired || 0),
            'Revocadas': chalk_1.default.yellow(stats.by_status?.revoked || 0),
            'Pendientes': chalk_1.default.gray(stats.by_status?.pending || 0),
        });
        logger_1.logger.table('Por Tipo de Licencia', {
            'Trial (10 días)': stats.by_type?.trial || 0,
            'Annual (365 días)': stats.by_type?.annual || 0,
            'Perpetual': stats.by_type?.perpetual || 0,
        });
    }
    catch (error) {
        spinner.fail('Error al cargar estadísticas');
        logger_1.logger.error(error.message);
    }
});
program
    .command('export')
    .description('Exportar reporte de licencias a archivo TXT')
    .option('-o, --output <file>', 'Archivo de salida', 'licenses-report.txt')
    .action((options) => (0, export_report_1.exportReportCommand)(options.output));
// ═══════════════════════════════════════════════════════════════
// 📚 AYUDA Y DOCUMENTACIÓN
// ═══════════════════════════════════════════════════════════════
program
    .command('help-guide')
    .description('Guía completa de uso con ejemplos')
    .action(() => {
    console.log('');
    logger_1.logger.header('📚 GUÍA DE USO - KIOSCO CLI');
    console.log(chalk_1.default.bold('1️⃣  PRIMER USO - AUTENTICACIÓN'));
    console.log('   $ kiosko-cli login');
    console.log('   Ingresar URL: http://localhost:3000/api');
    console.log('   Ingresar email y contraseña del super admin');
    console.log('');
    console.log(chalk_1.default.bold('2️⃣  CREAR ESTRUCTURA DE CLIENTE'));
    console.log('   a) Crear cliente:');
    console.log('      $ kiosko-cli create-client');
    console.log('');
    console.log('   b) Crear sucursal para ese cliente:');
    console.log('      $ kiosko-cli create-branch');
    console.log('');
    console.log(chalk_1.default.bold('3️⃣  GENERAR LICENCIA'));
    console.log('   $ kiosko-cli create-license');
    console.log('   Seleccionar cliente, sucursal y tipo de licencia');
    console.log('   ' + chalk_1.default.cyan('¡GUARDAR EL LICENSE KEY GENERADO!'));
    console.log('');
    console.log(chalk_1.default.bold('4️⃣  GESTIÓN DE LICENCIAS'));
    console.log('   Ver todas:        $ kiosko-cli list');
    console.log('   Ver activas:      $ kiosko-cli list --status active');
    console.log('   Ver por tipo:     $ kiosko-cli list --type annual');
    console.log('   Revocar:          $ kiosko-cli revoke');
    console.log('');
    console.log(chalk_1.default.bold('5️⃣  REPORTES Y ESTADÍSTICAS'));
    console.log('   Ver estadísticas: $ kiosko-cli stats');
    console.log('   Exportar reporte: $ kiosko-cli export -o reporte.txt');
    console.log('');
    console.log(chalk_1.default.bold('6️⃣  CERRAR SESIÓN'));
    console.log('   $ kiosko-cli logout');
    console.log('');
    logger_1.logger.separator();
    console.log('');
    console.log(chalk_1.default.cyan('💡 Tip: Usa aliases para comandos rápidos'));
    console.log('   cc = create-client');
    console.log('   cb = create-branch');
    console.log('   cl = create-license');
    console.log('   ls = list');
    console.log('');
});
// ═══════════════════════════════════════════════════════════════
// ⚙️ COMANDOS DE CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════
program
    .command('config')
    .description('Mostrar configuración actual')
    .action(() => {
    const config = (0, config_1.getConfig)();
    logger_1.logger.header('⚙️  CONFIGURACIÓN ACTUAL');
    if ((0, config_1.isAuthenticated)()) {
        logger_1.logger.table('Sesión Activa', {
            'Usuario': config.email || 'N/A',
            'Servidor': config.apiUrl || 'N/A',
            'Autenticado': chalk_1.default.green('Sí'),
        });
    }
    else {
        console.log(chalk_1.default.yellow('⚠️  No hay sesión activa'));
        console.log('');
        logger_1.logger.info('Ejecuta: kiosko-cli login');
    }
    console.log('');
});
// Parsear argumentos
program.parse(process.argv);
// Si no se especifica comando, mostrar ayuda
if (!process.argv.slice(2).length) {
    program.outputHelp();
    if (!(0, config_1.isAuthenticated)()) {
        console.log('');
        console.log(chalk_1.default.yellow('⚠️  No has iniciado sesión'));
        console.log(chalk_1.default.cyan('   Ejecuta: kiosko-cli login'));
        console.log('');
    }
}
