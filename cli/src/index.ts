#!/usr/bin/env node
// cli/src/index.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { createClientCommand } from './commands/create-client';
import { createBranchCommand } from './commands/create-branch';
import { createLicenseCommand } from './commands/create-license';
import { listLicensesCommand } from './commands/list-licenses';
import { revokeLicenseCommand } from './commands/revoke-license';
import { exportReportCommand } from './commands/export-report';
import { logger } from './utils/logger';
import { getConfig, isAuthenticated } from './config';

const program = new Command();

// Banner de inicio
console.clear();
console.log('');
console.log(chalk.cyan.bold('═'.repeat(70)));
console.log(chalk.cyan.bold('  🔐 KIOSCO LICENSE MANAGER CLI v1.0.0'));
console.log(chalk.cyan.bold('  Sistema de Gestión de Licencias para Kiosco Scanner'));
console.log(chalk.cyan.bold('═'.repeat(70)));
console.log('');

// Mostrar estado de sesión
if (isAuthenticated()) {
  const config = getConfig();
  console.log(chalk.green('✓ Sesión activa: ') + chalk.white(config.email));
  console.log(chalk.gray('  Servidor: ' + config.apiUrl));
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
  .action(loginCommand);

program
  .command('logout')
  .description('Cerrar sesión actual')
  .action(logoutCommand);

// ═══════════════════════════════════════════════════════════════
// 👥 GESTIÓN DE CLIENTES
// ═══════════════════════════════════════════════════════════════

program
  .command('create-client')
  .alias('cc')
  .description('Crear un nuevo cliente')
  .action(createClientCommand);

program
  .command('create-branch')
  .alias('cb')
  .description('Crear una nueva sucursal para un cliente')
  .action(createBranchCommand);

// ═══════════════════════════════════════════════════════════════
// 🎫 GESTIÓN DE LICENCIAS
// ═══════════════════════════════════════════════════════════════

program
  .command('create-license')
  .alias('cl')
  .description('Generar una nueva licencia')
  .action(createLicenseCommand);

program
  .command('list')
  .alias('ls')
  .description('Listar licencias')
  .option('-s, --status <status>', 'Filtrar por estado (active, expired, revoked)')
  .option('-t, --type <type>', 'Filtrar por tipo (trial, annual, perpetual)')
  .option('-c, --client <clientId>', 'Filtrar por ID de cliente')
  .option('-f, --format <format>', 'Formato de salida (table, json)', 'table')
  .action(listLicensesCommand);

program
  .command('revoke')
  .description('Revocar una licencia existente')
  .action(revokeLicenseCommand);

// ═══════════════════════════════════════════════════════════════
// 📊 REPORTES Y ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════

program
  .command('stats')
  .description('Ver estadísticas del sistema')
  .action(async () => {
    if (!isAuthenticated()) {
      logger.error('Debes hacer login primero');
      process.exit(1);
    }

    const { ApiClient } = await import('./api.js');
    const ora = (await import('ora')).default;
    
    logger.header('📊 ESTADÍSTICAS DEL SISTEMA');
    
    const spinner = ora('Cargando estadísticas...').start();
    
    try {
      const api = new ApiClient();
      const response = await api.getStats();
      const stats = response.data;
      
      spinner.succeed('Estadísticas cargadas');
      console.log('');
      
      logger.table('Resumen General', {
        'Total Licencias': stats.total || 0,
        'Activas': chalk.green(stats.by_status?.active || 0),
        'Expiradas': chalk.red(stats.by_status?.expired || 0),
        'Revocadas': chalk.yellow(stats.by_status?.revoked || 0),
        'Pendientes': chalk.gray(stats.by_status?.pending || 0),
      });
      
      logger.table('Por Tipo de Licencia', {
        'Trial (10 días)': stats.by_type?.trial || 0,
        'Annual (365 días)': stats.by_type?.annual || 0,
        'Perpetual': stats.by_type?.perpetual || 0,
      });
      
    } catch (error: any) {
      spinner.fail('Error al cargar estadísticas');
      logger.error(error.message);
    }
  });

program
  .command('export')
  .description('Exportar reporte de licencias a archivo TXT')
  .option('-o, --output <file>', 'Archivo de salida', 'licenses-report.txt')
  .action((options) => exportReportCommand(options.output));

// ═══════════════════════════════════════════════════════════════
// 📚 AYUDA Y DOCUMENTACIÓN
// ═══════════════════════════════════════════════════════════════

program
  .command('help-guide')
  .description('Guía completa de uso con ejemplos')
  .action(() => {
    console.log('');
    logger.header('📚 GUÍA DE USO - KIOSCO CLI');
    
    console.log(chalk.bold('1️⃣  PRIMER USO - AUTENTICACIÓN'));
    console.log('   $ kiosko-cli login');
    console.log('   Ingresar URL: http://localhost:3000/api');
    console.log('   Ingresar email y contraseña del super admin');
    console.log('');
    
    console.log(chalk.bold('2️⃣  CREAR ESTRUCTURA DE CLIENTE'));
    console.log('   a) Crear cliente:');
    console.log('      $ kiosko-cli create-client');
    console.log('');
    console.log('   b) Crear sucursal para ese cliente:');
    console.log('      $ kiosko-cli create-branch');
    console.log('');
    
    console.log(chalk.bold('3️⃣  GENERAR LICENCIA'));
    console.log('   $ kiosko-cli create-license');
    console.log('   Seleccionar cliente, sucursal y tipo de licencia');
    console.log('   ' + chalk.cyan('¡GUARDAR EL LICENSE KEY GENERADO!'));
    console.log('');
    
    console.log(chalk.bold('4️⃣  GESTIÓN DE LICENCIAS'));
    console.log('   Ver todas:        $ kiosko-cli list');
    console.log('   Ver activas:      $ kiosko-cli list --status active');
    console.log('   Ver por tipo:     $ kiosko-cli list --type annual');
    console.log('   Revocar:          $ kiosko-cli revoke');
    console.log('');
    
    console.log(chalk.bold('5️⃣  REPORTES Y ESTADÍSTICAS'));
    console.log('   Ver estadísticas: $ kiosko-cli stats');
    console.log('   Exportar reporte: $ kiosko-cli export -o reporte.txt');
    console.log('');
    
    console.log(chalk.bold('6️⃣  CERRAR SESIÓN'));
    console.log('   $ kiosko-cli logout');
    console.log('');
    
    logger.separator();
    console.log('');
    console.log(chalk.cyan('💡 Tip: Usa aliases para comandos rápidos'));
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
    const config = getConfig();
    logger.header('⚙️  CONFIGURACIÓN ACTUAL');
    
    if (isAuthenticated()) {
      logger.table('Sesión Activa', {
        'Usuario': config.email || 'N/A',
        'Servidor': config.apiUrl || 'N/A',
        'Autenticado': chalk.green('Sí'),
      });
    } else {
      console.log(chalk.yellow('⚠️  No hay sesión activa'));
      console.log('');
      logger.info('Ejecuta: kiosko-cli login');
    }
    console.log('');
  });

// Parsear argumentos
program.parse(process.argv);

// Si no se especifica comando, mostrar ayuda
if (!process.argv.slice(2).length) {
  program.outputHelp();
  
  if (!isAuthenticated()) {
    console.log('');
    console.log(chalk.yellow('⚠️  No has iniciado sesión'));
    console.log(chalk.cyan('   Ejecuta: kiosko-cli login'));
    console.log('');
  }
}