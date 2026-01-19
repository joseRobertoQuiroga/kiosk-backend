// cli/src/config.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CLIConfig {
  apiUrl: string;
  token: string | null;
  email: string | null;
  refreshToken?: string | null;
}

const CONFIG_DIR = path.join(os.homedir(), '.kiosko-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

let currentConfig: CLIConfig = {
  apiUrl: '',
  token: null,
  email: null,
  refreshToken: null,
};

/**
 * Carga la configuración desde el archivo
 */
function loadConfigFromFile(): CLIConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error al cargar configuración:', error);
  }
  return null;
}

/**
 * Guarda la configuración en el archivo
 */
function saveConfigToFile(config: CLIConfig): void {
  try {
    // Crear directorio si no existe
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Guardar configuración
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    
    // Establecer permisos solo lectura/escritura para el usuario (600)
    fs.chmodSync(CONFIG_FILE, 0o600);
  } catch (error) {
    console.error('Error al guardar configuración:', error);
  }
}

/**
 * Inicializa la configuración (carga desde archivo si existe)
 */
export function initConfig(): void {
  const savedConfig = loadConfigFromFile();
  if (savedConfig) {
    currentConfig = savedConfig;
  }
}

/**
 * Obtiene la configuración actual
 */
export function getConfig(): CLIConfig {
  return currentConfig;
}

/**
 * Actualiza la configuración
 */
export function setConfig(config: Partial<CLIConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  saveConfigToFile(currentConfig);
}

/**
 * Limpia la configuración (logout)
 */
export function clearConfig(): void {
  currentConfig = {
    apiUrl: currentConfig.apiUrl, // Mantener solo la URL
    token: null,
    email: null,
    refreshToken: null,
  };
  saveConfigToFile(currentConfig);
}

/**
 * Elimina completamente el archivo de configuración
 */
export function deleteConfig(): void {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    currentConfig = {
      apiUrl: '',
      token: null,
      email: null,
      refreshToken: null,
    };
  } catch (error) {
    console.error('Error al eliminar configuración:', error);
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return currentConfig.token !== null && currentConfig.token.length > 0;
}

/**
 * Obtiene la ruta del archivo de configuración
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

// Inicializar configuración al importar el módulo
initConfig();