// src/common/utils/crypto.util.ts
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

/**
 * Utilidades criptográficas para el sistema de licencias
 */
export class CryptoUtil {
  /**
   * Genera un hash SHA256 de un string
   * Usado para device fingerprints
   */
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Genera un hash SHA512 (más seguro que SHA256)
   */
  static sha512(data: string): string {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  /**
   * Hashea una contraseña con bcrypt
   * 🔐 Blindado contra valores string desde ConfigService
   */
  static async hashPassword(
    password: string,
    rounds: number | string = 10,
  ): Promise<string> {
    const saltRounds = Number(rounds);

    if (!Number.isInteger(saltRounds) || saltRounds <= 0) {
      throw new Error('BCRYPT_ROUNDS inválido');
    }

    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compara una contraseña con su hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Genera un token aleatorio seguro
   * Usado para activation codes
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Genera un UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Genera un device fingerprint a partir de múltiples parámetros
   * Esto es lo que el APK Flutter enviará al backend
   */
  static generateDeviceFingerprint(components: {
    androidId: string;
    buildBoard: string;
    buildBrand: string;
    buildModel: string;
    macAddressHash?: string;
    appSignatureHash?: string;
  }): string {
    const data = [
      components.androidId,
      components.buildBoard,
      components.buildBrand,
      components.buildModel,
      components.macAddressHash || '',
      components.appSignatureHash || '',
    ].join('|');

    return this.sha256(data);
  }

  /**
   * Valida el formato de un device fingerprint
   */
  static isValidFingerprint(fingerprint: string): boolean {
    // SHA256 produce 64 caracteres hexadecimales
    return /^[a-f0-9]{64}$/i.test(fingerprint);
  }

  /**
   * Encripta datos sensibles con AES-256-CBC
   * Para guardar información crítica en la BD
   */
  static encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Desencripta datos
   */
  static decrypt(encrypted: string, key: string): string {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyHash, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Genera un par de claves RSA para firmas digitales
   * (Opcional: para firmar licencias digitalmente)
   */
  static generateRSAKeyPair(keySize: number = 2048): {
    publicKey: string;
    privateKey: string;
  } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Firma datos con clave privada RSA
   */
  static signData(data: string, privateKey: string): string {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  /**
   * Verifica firma RSA
   */
  static verifySignature(data: string, signature: string, publicKey: string): boolean {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
  }
}
