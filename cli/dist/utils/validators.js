"use strict";
// cli/src/utils/validators.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.isValidUrl = isValidUrl;
exports.isValidLicenseKey = isValidLicenseKey;
exports.formatDate = formatDate;
exports.formatDaysRemaining = formatDaysRemaining;
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function isValidLicenseKey(key) {
    // Formato: LIC-XXXX-XXXX-XXXX-XXXX
    return key.length >= 16 && key.includes('-');
}
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function formatDaysRemaining(days) {
    if (days === null)
        return 'Perpetua';
    if (days < 0)
        return 'Expirada';
    if (days === 0)
        return 'Expira hoy';
    if (days === 1)
        return '1 día';
    return `${days} días`;
}
