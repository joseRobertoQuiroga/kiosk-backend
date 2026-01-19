// src/scripts/init-super-admin.ts
/**
 * Script de inicialización del Super Admin
 * 
 * Ejecutar con:
 * npm run init-admin
 * 
 * O directamente:
 * ts-node src/scripts/init-super-admin.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/auth.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 INICIALIZACIÓN DEL SUPER ADMINISTRADOR');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const configService = app.get(ConfigService);

  try {
    const email = configService.get<string>('SUPER_ADMIN_EMAIL');
    const password = configService.get<string>('SUPER_ADMIN_PASSWORD');
    const name = configService.get<string>('SUPER_ADMIN_NAME');

    if (!email || !password || !name) {
      console.error('❌ Error: Falta configuración en el archivo .env');
      console.error('');
      console.error('Por favor, agrega las siguientes variables:');
      console.error('  SUPER_ADMIN_EMAIL=tu-email@ejemplo.com');
      console.error('  SUPER_ADMIN_PASSWORD=tu-password-seguro');
      console.error('  SUPER_ADMIN_NAME=Tu Nombre Completo');
      console.error('');
      await app.close();
      process.exit(1);
    }

    console.log('📧 Email:', email);
    console.log('👤 Nombre:', name);
    console.log('');
    console.log('⏳ Creando super admin...');
    console.log('');

    // Verificar si el password está hasheado (bcrypt empieza con $2b$)
    let finalPassword = password;
    if (password.startsWith('$2b$')) {
      console.log('ℹ️  La contraseña en .env ya está hasheada');
      console.log('⚠️  Para crear el usuario, necesitas la contraseña en texto plano');
      console.log('');
      console.log('Por favor, crea temporalmente una variable:');
      console.log('  SUPER_ADMIN_PASSWORD_PLAIN=tu-password-temporal');
      console.log('');
      
      const plainPassword = configService.get<string>('SUPER_ADMIN_PASSWORD_PLAIN');
      if (!plainPassword) {
        await app.close();
        process.exit(1);
      }
      finalPassword = plainPassword;
    }

    const admin = await authService.createSuperAdmin(email, finalPassword, name);

    console.log('✅ Super Admin creado exitosamente!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CREDENCIALES DE ACCESO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`  🆔 ID:       ${admin.id}`);
    console.log(`  📧 Email:    ${admin.email}`);
    console.log(`  👤 Nombre:   ${admin.name}`);
    console.log(`  🔑 Role:     ${admin.role}`);
    console.log(`  📅 Creado:   ${admin.created_at.toLocaleString()}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 PRÓXIMOS PASOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Inicia el servidor:');
    console.log('   npm run start:dev');
    console.log('');
    console.log('2. Haz login para obtener tu token:');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('   Body: {');
    console.log(`     "email": "${email}",`);
    console.log('     "password": "tu-password"');
    console.log('   }');
    console.log('');
    console.log('3. Usa el token para acceder a los endpoints protegidos:');
    console.log('   Authorization: Bearer <tu-token>');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

  } catch (error: any) {
    if (error.message && error.message.includes('ya existe')) {
      console.log('ℹ️  El super admin ya existe en la base de datos');
      console.log('');
      console.log('Si necesitas cambiar la contraseña, usa el endpoint:');
      console.log('  POST /api/auth/change-password');
      console.log('');
    } else {
      console.error('❌ Error al crear super admin:', error.message);
      console.error('');
    }
  }

  await app.close();
  process.exit(0);
}

bootstrap();