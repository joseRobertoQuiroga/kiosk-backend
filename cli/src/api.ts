// cli/src/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { getConfig } from './config';

export class ApiClient {
  protected client: AxiosInstance;

  constructor() {
    const config = getConfig();
    
    // ✅ IMPORTANTE: baseURL ya incluye /api, no duplicar
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token JWT
    this.client.interceptors.request.use(
      (config) => {
        const currentConfig = getConfig();
        if (currentConfig.token) {
          config.headers.Authorization = `Bearer ${currentConfig.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor de respuestas para logging
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Error del servidor (4xx, 5xx)
          console.error(`[API Error ${error.response.status}]`, error.response.data);
        } else if (error.request) {
          // Sin respuesta del servidor
          console.error('[Network Error] No se recibió respuesta del servidor');
        } else {
          // Error en la configuración
          console.error('[Request Error]', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════════

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // CLIENTES
  // ═══════════════════════════════════════════════════════════════

  async createClient(data: {
    name: string;
    tax_id?: string;
    contact_email?: string;
    contact_phone?: string;
    city?: string;
  }) {
    const response = await this.client.post('/clients', data);
    return response.data;
  }

  async getClients() {
    const response = await this.client.get('/clients');
    return response.data;
  }

  async getClientById(clientId: string) {
    const response = await this.client.get(`/clients/${clientId}`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // SUCURSALES
  // ═══════════════════════════════════════════════════════════════

 async createBranch(
  clientId: string,
  data: {
    name: string;
    code?: string;
    city?: string;
    address?: string;
  }
) {
  const response = await this.client.post(
    `/clients/${clientId}/branches`,
    {
      name: data.name,
      code: data.code,
      city: data.city,
      address: data.address,
    }
  );

  return response.data;
}

  async getBranches(clientId: string) {
  const response = await this.client.get(
    `/clients/${clientId}/branches`
  );
  return response.data;
}

  // ═══════════════════════════════════════════════════════════════
  // LICENCIAS
  // ═══════════════════════════════════════════════════════════════

  async createLicense(data: {
    type: 'trial' | 'annual' | 'perpetual';
    client_id: string;
    branch_id: string;
    notes?: string;
  }) {
    const response = await this.client.post('/licenses', data);
    return response.data;
  }

  async getLicenses(filters?: {
    status?: string;
    type?: string;
    client_id?: string;
    branch_id?: string;
  }) {
    const response = await this.client.get('/licenses', {
      params: filters,
    });
    return response.data;
  }

  async getLicenseById(id: string) {
    const response = await this.client.get(`/licenses/${id}`);
    return response.data;
  }

  async revokeLicense(licenseId: string, reason: string) {
    const response = await this.client.post('/licenses/revoke', {
      license_id: licenseId,
      reason,
    });
    return response.data;
  }

  async extendLicense(licenseId: string, days: number) {
    const response = await this.client.post('/licenses/extend', {
      license_id: licenseId,
      days,
    });
    return response.data;
  }

  async getStats() {
    const response = await this.client.get('/licenses/stats');
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // DISPOSITIVOS
  // ═══════════════════════════════════════════════════════════════

  async getDevices(filters?: {
    license_id?: string;
    is_blacklisted?: boolean;
  }) {
    const response = await this.client.get('/licenses/devices/all', {
      params: filters,
    });
    return response.data;
  }

  async getDeviceById(deviceId: string) {
    const response = await this.client.get(`/licenses/devices/${deviceId}`);
    return response.data;
  }

  async blacklistDevice(deviceId: string, reason: string) {
    const response = await this.client.post(
      `/licenses/devices/${deviceId}/blacklist`,
      { reason }
    );
    return response.data;
  }

  async unblacklistDevice(deviceId: string) {
    const response = await this.client.post(
      `/licenses/devices/${deviceId}/unblacklist`
    );
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // AUDITORÍA
  // ═══════════════════════════════════════════════════════════════

  async getAuditLogs(filters?: {
    license_id?: string;
    event_type?: string;
    limit?: number;
  }) {
    const response = await this.client.get('/licenses/audit/logs', {
      params: filters,
    });
    return response.data;
  }

  async getCriticalEvents(limit: number = 50) {
    const response = await this.client.get('/licenses/audit/critical', {
      params: { limit },
    });
    return response.data;
  }

  async getCloningAttempts(limit: number = 50) {
    const response = await this.client.get('/licenses/audit/cloning-attempts', {
      params: { limit },
    });
    return response.data;
  }

  async getBlacklistedFingerprints() {
    const response = await this.client.get('/licenses/blacklist');
    return response.data;
  }
}