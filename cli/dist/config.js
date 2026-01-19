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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initConfig = initConfig;
exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.clearConfig = clearConfig;
exports.deleteConfig = deleteConfig;
exports.isAuthenticated = isAuthenticated;
exports.getConfigPath = getConfigPath;
// cli/src/config.ts
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONFIG_DIR = path.join(os.homedir(), '.kiosko-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
let currentConfig = {
    apiUrl: '',
    token: null,
    email: null,
    refreshToken: null,
};
/**
 * Carga la configuración desde el archivo
 */
function loadConfigFromFile() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.error('Error al cargar configuración:', error);
    }
    return null;
}
/**
 * Guarda la configuración en el archivo
 */
function saveConfigToFile(config) {
    try {
        // Crear directorio si no existe
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        // Guardar configuración
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
        // Establecer permisos solo lectura/escritura para el usuario (600)
        fs.chmodSync(CONFIG_FILE, 0o600);
    }
    catch (error) {
        console.error('Error al guardar configuración:', error);
    }
}
/**
 * Inicializa la configuración (carga desde archivo si existe)
 */
function initConfig() {
    const savedConfig = loadConfigFromFile();
    if (savedConfig) {
        currentConfig = savedConfig;
    }
}
/**
 * Obtiene la configuración actual
 */
function getConfig() {
    return currentConfig;
}
/**
 * Actualiza la configuración
 */
function setConfig(config) {
    currentConfig = { ...currentConfig, ...config };
    saveConfigToFile(currentConfig);
}
/**
 * Limpia la configuración (logout)
 */
function clearConfig() {
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
function deleteConfig() {
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
    }
    catch (error) {
        console.error('Error al eliminar configuración:', error);
    }
}
/**
 * Verifica si el usuario está autenticado
 */
function isAuthenticated() {
    return currentConfig.token !== null && currentConfig.token.length > 0;
}
/**
 * Obtiene la ruta del archivo de configuración
 */
function getConfigPath() {
    return CONFIG_FILE;
}
// Inicializar configuración al importar el módulo
initConfig();
