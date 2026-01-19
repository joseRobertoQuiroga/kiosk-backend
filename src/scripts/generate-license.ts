// src/scripts/generate-license.ts
/**
 * Script CLI para generar licencias
 * 
 * Uso:
 * npm run generate-license -- --client-id=xxx --branch-id=yyy --type=annual
 * 
 * O directamente:
 * ts-node src/scripts/generate-license.ts --client-id=xxx --branch-id=yyy --type=annual
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LicensesService } from '../modules/licenses/services/licenses.service';
import { ClientsService } from '../modules/clients/clients.service';
import { BranchesService } from '../modules/clients/branches.service';
import { LicenseType } from '../modules/licenses/entities/license.entity';

async function bootstrap() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎫 GENERADOR DE LICENCIAS (CLI)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const app = await NestFactory.createApplicationContext(AppModule);
  const licensesService = app.get(LicensesService);
  const clientsService = app.get(ClientsService);
  const branchesService = app.get(BranchesService);

  try {
    // Parsear argumentos de línea de comandos
    const args = process.argv.slice(2);
    const getArg = (name: string) => {
      const arg = args.find((a) => a.startsWith(`--${name}=`));
      return arg ? arg.split('=')[1] : undefined;
    };

    const clientId = getArg('client-id');
    const branchId = getArg('branch-id');
    const typeArg = getArg('type') || 'annual';
    const notes = getArg('notes');
    const adminEmail = getArg('admin') || 'system';

    // Validar argumentos
    if (!clientId || !branchId) {
      console.error('❌ Error: Faltan argumentos obligatorios');
      console.error('');
      console.error('Uso:');
      console.error('  npm run generate-license -- \\');
      console.error('    --client-id=<uuid> \\');
      console.error('    --branch-id=<uuid> \\');
      console.error('    --type=<trial|annual|perpetual> \\');
      console.error('    --notes="Notas opcionales" \\');
      console.error('    --admin=email@ejemplo.com');
      console.error('');
      console.error('Ejemplo:');
      console.error('  npm run generate-license -- \\');
      console.error('    --client-id=a1b2c3d4-... \\');
      console.error('    --branch-id=e5f6g7h8-... \\');
      console.error('    --type=annual');
      console.error('');
      await app.close();
      process.exit(1);
    }

    // Validar tipo de licencia
    const validTypes = Object.values(LicenseType);
    if (!validTypes.includes(typeArg as LicenseType)) {
      console.error(`❌ Error: Tipo de licencia inválido: ${typeArg}`);
      console.error(`   Tipos válidos: ${validTypes.join(', ')}`);
      console.error('');
      await app.close();
      process.exit(1);
    }

    const type = typeArg as LicenseType;

    // Verificar que el cliente y sucursal existen
    console.log('🔍 Verificando cliente y sucursal...');
    const client = await clientsService.findOne(clientId);
    const branch = await branchesService.findOne(branchId);

    console.log(`✅ Cliente: ${client.name}`);
    console.log(`✅ Sucursal: ${branch.name}`);
    console.log('');

    // Crear licencia
    console.log('⏳ Generando licencia...');
    const license = await licensesService.create(
      {
        type,
        client_id: clientId,
        branch_id: branchId,
        notes,
      },
      adminEmail,
    );

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LICENCIA GENERADA EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`  🆔 ID:           ${license.id}`);
    console.log(`  🔑 LICENSE KEY:  ${license.license_key}`);
    console.log(`  📝 Tipo:         ${license.type}`);
    console.log(`  📊 Estado:       ${license.status}`);
    console.log(`  🏢 Cliente:      ${client.name}`);
    console.log(`  🏪 Sucursal:     ${branch.name}`);
    console.log(`  📅 Emitida:      ${license.issued_date.toLocaleString()}`);
    
    if (license.expiry_date) {
      console.log(`  ⏰ Expira:       ${license.expiry_date.toLocaleString()}`);
      const daysRemaining = Math.ceil(
        (license.expiry_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      console.log(`  📆 Días restantes: ${daysRemaining}`);
    } else {
      console.log('  ⏰ Expira:       Nunca (Perpetua)');
    }

    if (notes) {
      console.log(`  📝 Notas:        ${notes}`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 INSTRUCCIONES PARA ACTIVACIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Proporciona este LICENSE KEY al cliente:');
    console.log('');
    console.log(`   ${license.license_key}`);
    console.log('');
    console.log('2. El cliente debe ingresar este código en la app móvil');
    console.log('   durante la configuración inicial del kiosco.');
    console.log('');
    console.log('3. La licencia se activará automáticamente al vincular');
    console.log('   el dispositivo con este código.');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('❌ Error al generar licencia:', error.message);
    console.error('');
    
    if (error.message.includes('no encontrado')) {
      console.error('Verifica que los IDs de cliente y sucursal sean correctos.');
      console.error('');
      console.error('Para listar clientes:');
      console.error('  GET /api/clients');
      console.error('');
      console.error('Para listar sucursales de un cliente:');
      console.error('  GET /api/clients/{client-id}/branches');
      console.error('');
    }
  }

  await app.close();
  process.exit(0);
}

bootstrap();