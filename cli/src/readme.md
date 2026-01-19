# 🖥️ Kiosco License Manager CLI

CLI para gestión de licencias del sistema Kiosco Scanner.

## 📦 Instalación

```bash
cd cli
npm install
```

## 🚀 Uso (Desarrollo)

```bash
# Compilar TypeScript
npm run build

# Ejecutar en modo desarrollo
npm run dev login

# O ejecutar compilado
npm start login
```

## 📋 Comandos Disponibles

### 1. Login
```bash
npm start login
```
Inicia sesión como administrador. Te pedirá:
- URL del servidor (ej: http://localhost:3000)
- Email del super admin
- Contraseña

### 2. Crear Cliente
```bash
npm start create-client
```
Crea un nuevo cliente. Te pedirá:
- Nombre del cliente
- RUC/NIT (opcional)
- Email de contacto (opcional)
- Teléfono (opcional)
- Ciudad (opcional)

### 3. Crear Sucursal
```bash
npm start create-branch
```
Crea una nueva sucursal para un cliente existente.

### 4. Generar Licencia
```bash
npm start create-license
```
Genera una nueva licencia para una sucursal.

### 5. Listar Licencias
```bash
# Todas las licencias
npm start list

# Solo activas
npm start list --status active

# Por tipo
npm start list --type annual

# Por cliente
npm start list --client <client-id>
```

### 6. Revocar Licencia
```bash
npm start revoke
```
Revoca una licencia activa.

### 7. Exportar Reporte
```bash
# Exportar a archivo por defecto
npm start export

# Especificar archivo de salida
npm start export -o mi-reporte.txt
```

## 📦 Generar Ejecutable

Para crear un ejecutable standalone:

```bash
npm run package
```

Esto generará:
- `dist/kiosko-cli-win.exe` (Windows)
- `dist/kiosko-cli-linux` (Linux)

Luego puedes copiar el ejecutable a cualquier carpeta y usarlo:

```bash
# Windows
kiosko-cli-win.exe login

# Linux
./kiosko-cli-linux login
```

## 🔐 Seguridad

- Las credenciales NO se guardan en disco
- El token JWT se mantiene solo en memoria durante la sesión
- Cada ejecución del CLI requiere login nuevo

## 📝 Ejemplos de Uso Completo

### Flujo completo de creación de licencia:

```bash
# 1. Login
npm start login
# Ingresa: http://localhost:3000
# Ingresa: admin@ejemplo.com
# Ingresa: tu-password

# 2. Crear cliente
npm start create-client
# Ingresa: Hyper Supermercado
# Ingresa: 123456789 (RUC)
# etc.

# 3. Crear sucursal
npm start create-branch
# Selecciona: Hyper Supermercado
# Ingresa: Sucursal Norte
# etc.

# 4. Generar licencia
npm start create-license
# Selecciona: Hyper Supermercado
# Selecciona: Sucursal Norte
# Selecciona: annual
# ¡GUARDA EL LICENSE KEY GENERADO!

# 5. Exportar reporte
npm start export -o reporte-enero-2026.txt
```

## 🐛 Troubleshooting

### Error de conexión
```
❌ Error: connect ECONNREFUSED
```
- Verifica que el backend esté corriendo
- Verifica la URL del servidor

### Error de autenticación
```
❌ No has iniciado sesión
```
- Ejecuta `npm start login` primero

### Error al crear licencia
```
❌ Cliente con ID xxx no encontrado
```
- Verifica que el cliente y sucursal existan
- Usa `npm start list` para ver IDs válidos

## 📞 Soporte

Para problemas o consultas, contacta al desarrollador.