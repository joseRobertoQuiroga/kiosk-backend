export function normalizePromotion(value: any): string | number | '' {
  if (value === null || value === undefined) return '';

  // 🔢 Si ya es número válido
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }

  // 🔤 Si es string
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === '') return '';

    // 🔢 String que representa número → convertir
    const numeric = Number(trimmed);
    if (!isNaN(numeric)) {
      return numeric;
    }

    // 🔤 Texto real ("2x1", "33porciento")
    return trimmed;
  }

  // ❌ Cualquier otro tipo
  return '';
}
