// src/modules/licenses/services/fingerprint.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { CryptoUtil } from '../../../common/utils/crypto.util';

/**
 * Servicio de Fingerprint
 * Valida y genera fingerprints de dispositivos
 */
@Injectable()
export class FingerprintService {
  /**
   * Valida que un fingerprint tenga el formato correcto
   */
  validateFingerprint(fingerprint: string): boolean {
    if (!fingerprint || fingerprint.length < 64 || fingerprint.length > 128) {
      return false;
    }

    // Debe ser hexadecimal (SHA256 o SHA512)
    return /^[a-f0-9]+$/i.test(fingerprint);
  }

  /**
   * Genera un fingerprint a partir de componentes del dispositivo
   */
  generateFingerprint(components: {
    androidId: string;
    buildBoard: string;
    buildBrand: string;
    buildModel: string;
    macAddressHash?: string;
    appSignatureHash?: string;
  }): string {
    if (!components.androidId || !components.buildBoard || !components.buildBrand) {
      throw new BadRequestException(
        'Componentes insuficientes para generar fingerprint',
      );
    }

    return CryptoUtil.generateDeviceFingerprint(components);
  }

  /**
   * Verifica si un fingerprint es válido y no está malformado
   */
  verifyFingerprint(fingerprint: string): void {
    if (!this.validateFingerprint(fingerprint)) {
      throw new BadRequestException(
        'Device fingerprint inválido o malformado. ' +
        'Debe ser un hash SHA256 (64 caracteres hexadecimales).',
      );
    }
  }

  /**
   * Compara dos fingerprints de forma segura
   */
  compareFingerprints(fp1: string, fp2: string): boolean {
    if (!fp1 || !fp2) return false;
    return fp1.toLowerCase() === fp2.toLowerCase();
  }

  /**
   * Calcula similitud entre dos fingerprints (detección de modificaciones)
   * Retorna un porcentaje de similitud (0-100)
   */
  calculateSimilarity(fp1: string, fp2: string): number {
    if (!fp1 || !fp2) return 0;
    if (fp1.length !== fp2.length) return 0;

    let matches = 0;
    for (let i = 0; i < fp1.length; i++) {
      if (fp1[i].toLowerCase() === fp2[i].toLowerCase()) {
        matches++;
      }
    }

    return (matches / fp1.length) * 100;
  }

  /**
   * Detecta si un fingerprint parece ser falso o generado
   * (patrones sospechosos)
   */
  detectSuspiciousFingerprint(fingerprint: string): {
    suspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Verificar patrones repetitivos
    if (/(.)\1{10,}/.test(fingerprint)) {
      reasons.push('Patrón repetitivo detectado');
    }

    // Verificar si es todo ceros
    if (/^0+$/.test(fingerprint)) {
      reasons.push('Fingerprint de solo ceros');
    }

    // Verificar si es todo unos o F
    if (/^[f1]+$/i.test(fingerprint)) {
      reasons.push('Fingerprint con patrón uniforme');
    }

    // Verificar secuencias (123456789...)
    const hasSequence = this.hasSequentialPattern(fingerprint);
    if (hasSequence) {
      reasons.push('Secuencia numérica/alfabética detectada');
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Detecta patrones secuenciales en el fingerprint
   */
  private hasSequentialPattern(fingerprint: string): boolean {
    for (let i = 0; i < fingerprint.length - 5; i++) {
      const char1 = fingerprint.charCodeAt(i);
      const char2 = fingerprint.charCodeAt(i + 1);
      const char3 = fingerprint.charCodeAt(i + 2);
      const char4 = fingerprint.charCodeAt(i + 3);
      const char5 = fingerprint.charCodeAt(i + 4);

      // Verificar secuencia ascendente o descendente
      if (
        (char2 === char1 + 1 &&
          char3 === char2 + 1 &&
          char4 === char3 + 1 &&
          char5 === char4 + 1) ||
        (char2 === char1 - 1 &&
          char3 === char2 - 1 &&
          char4 === char3 - 1 &&
          char5 === char4 - 1)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Genera un código de activación único
   */
  generateActivationCode(): string {
    return CryptoUtil.generateSecureToken(32);
  }

  /**
   * Hashea información sensible (como MAC address)
   */
  hashSensitiveData(data: string): string {
    return CryptoUtil.sha256(data);
  }
}