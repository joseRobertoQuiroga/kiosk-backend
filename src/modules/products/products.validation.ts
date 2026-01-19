/**
 * ═══════════════════════════════════════════════════════════════
 * 🔍 VALIDACIÓN Y NORMALIZACIÓN DE PRODUCTOS
 * ═══════════════════════════════════════════════════════════════
 * 
 * Este archivo contiene todas las funciones de validación y
 * conversión de datos para productos importados desde Excel/ZIP
 * 
 * VALIDACIONES IMPLEMENTADAS:
 * 1. ✅ Validación de tipos de datos
 * 2. ✅ Conversión automática de tipos
 * 3. ✅ Validación de código de barras (solo números)
 * 4. ✅ Normalización de promociones
 * 5. ✅ Validación de imágenes en ZIP
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import { BadRequestException } from '@nestjs/common';

// ═══════════════════════════════════════════════════════════════
// 🔷 INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface ProductoRaw {
  codigo?: any;
  nombre?: any;
  precio?: any;
  detalles?: any;
  categoria?: any;
  promocion?: any;
  imagen?: any;
}

export interface ProductoValidado {
  codigo: string;
  nombre: string;
  precio: number;
  detalles: string;
  categoria: string;
  promocion: string | number | '';
  imagen: string;
}

export interface ErrorValidacion {
  fila: number;
  campo: string;
  valor: any;
  error: string;
}

// ═══════════════════════════════════════════════════════════════
// 🔍 VALIDACIÓN DE CÓDIGO DE BARRAS
// ═══════════════════════════════════════════════════════════════

/**
 * Valida que el código de barras contenga SOLO NÚMEROS
 * 
 * ✅ Válido: "1234567890", "987654321", "0123456789"
 * ❌ Inválido: "ABC123", "12-34", "12 34", "12.34"
 * 
 * @throws Error si el código no es válido
 */
export function validarCodigoBarras(codigo: any, fila: number): string {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔍 [VALIDAR CÓDIGO] Fila ${fila}`);
  console.log('Valor recibido:', codigo, '(Tipo:', typeof codigo, ')');

  // 1️⃣ Verificar que no sea null/undefined
  if (codigo === null || codigo === undefined || codigo === '') {
    throw new Error('Código de barras es obligatorio');
  }

  // 2️⃣ Convertir a string
  const codigoStr = String(codigo).trim();

  if (codigoStr === '') {
    throw new Error('Código de barras no puede estar vacío');
  }

  // 3️⃣ VALIDAR QUE SOLO CONTENGA NÚMEROS
  const soloNumeros = /^[0-9]+$/;
  if (!soloNumeros.test(codigoStr)) {
    throw new Error(
      `Código de barras inválido: "${codigoStr}". Solo se permiten números (0-9). ` +
      `Caracteres no permitidos: letras, guiones, espacios, puntos`
    );
  }

  // 4️⃣ Validar longitud (generalmente 8-13 dígitos)
  if (codigoStr.length < 8) {
    throw new Error(`Código de barras muy corto: "${codigoStr}". Mínimo 8 dígitos`);
  }

  if (codigoStr.length > 18) {
    throw new Error(`Código de barras muy largo: "${codigoStr}". Máximo 18 dígitos`);
  }

  console.log('✅ Código válido:', codigoStr);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return codigoStr;
}

// ═══════════════════════════════════════════════════════════════
// 🔍 VALIDACIÓN Y CONVERSIÓN DE PRECIO
// ═══════════════════════════════════════════════════════════════

/**
 * Convierte y valida el precio a número válido
 * 
 * ✅ Válido: 10, "10", "10.5", "10,5", "  15.99  "
 * ❌ Inválido: "abc", "", null, -5, 0
 */
export function validarPrecio(precio: any, fila: number): number {
  console.log(`💰 [VALIDAR PRECIO] Fila ${fila}:`, precio, '(Tipo:', typeof precio, ')');

  // 1️⃣ Verificar que no sea null/undefined
  if (precio === null || precio === undefined || precio === '') {
    throw new Error('Precio es obligatorio');
  }

  // 2️⃣ Si es string, limpiar y convertir
  let precioNum: number;

  if (typeof precio === 'string') {
    // Limpiar espacios
    let precioStr = precio.trim();

    // Reemplazar coma por punto (para locales como "10,50")
    precioStr = precioStr.replace(',', '.');

    // Convertir a número
    precioNum = parseFloat(precioStr);
  } else if (typeof precio === 'number') {
    precioNum = precio;
  } else {
    throw new Error(`Precio tiene tipo inválido: ${typeof precio}`);
  }

  // 3️⃣ Validar que sea un número válido
  if (isNaN(precioNum)) {
    throw new Error(`Precio no es un número válido: "${precio}"`);
  }

  // 4️⃣ Validar que sea positivo
  if (precioNum <= 0) {
    throw new Error(`Precio debe ser mayor a 0 (actual: ${precioNum})`);
  }

  // 5️⃣ Validar límite razonable (máximo 1 millón)
  if (precioNum > 1000000) {
    throw new Error(`Precio excesivamente alto: ${precioNum}. Máximo: 1,000,000`);
  }

  console.log('✅ Precio válido:', precioNum);
  return precioNum;
}

// ═══════════════════════════════════════════════════════════════
// 🔍 VALIDACIÓN DE CAMPO STRING
// ═══════════════════════════════════════════════════════════════

/**
 * Valida y normaliza campos de texto obligatorios
 */
export function validarCampoTexto(
  valor: any,
  nombreCampo: string,
  fila: number,
  minLength: number = 1,
  maxLength: number = 500
): string {
  console.log(`📝 [VALIDAR ${nombreCampo.toUpperCase()}] Fila ${fila}:`, valor);

  // 1️⃣ Verificar que no sea null/undefined
  if (valor === null || valor === undefined) {
    throw new Error(`${nombreCampo} es obligatorio`);
  }

  // 2️⃣ Convertir a string y limpiar
  const valorStr = String(valor).trim();

  // 3️⃣ Validar que no esté vacío
  if (valorStr === '' || valorStr.length < minLength) {
    throw new Error(`${nombreCampo} debe tener al menos ${minLength} caracteres`);
  }

  // 4️⃣ Validar longitud máxima
  if (valorStr.length > maxLength) {
    throw new Error(
      `${nombreCampo} excede el límite de ${maxLength} caracteres (actual: ${valorStr.length})`
    );
  }

  console.log(`✅ ${nombreCampo} válido:`, valorStr.substring(0, 50) + '...');
  return valorStr;
}

// ═══════════════════════════════════════════════════════════════
// 🔍 NORMALIZACIÓN INTELIGENTE DE PROMOCIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Normaliza el campo promoción con validación inteligente
 * 
 * CASOS DE USO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. VACÍO/NULL/UNDEFINED → ""
 *    - null → ""
 *    - undefined → ""
 *    - "" → ""
 * 
 * 2. NÚMEROS PUROS → number (convertido)
 *    - 12 → 12
 *    - "12" → 12
 *    - "15.50" → 15.50
 *    - "15,50" → 15.50
 *    - "  25  " → 25
 * 
 * 3. TEXTO CON LETRAS → string (limpiado)
 *    - "2x1" → "2x1"
 *    - "Oferta" → "Oferta"
 *    - "33porciento" → "33porciento"
 *    - "  Promo  " → "Promo"
 * 
 * 4. SOLO ESPACIOS → ""
 *    - "   " → ""
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export function normalizarPromocion(valor: any): string | number | '' {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏷️  [NORMALIZAR PROMOCIÓN]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Valor recibido:', valor);
  console.log('Tipo:', typeof valor);

  // 1️⃣ CASO: Vacío, null o undefined
  if (valor === null || valor === undefined || valor === '') {
    console.log('✅ Resultado: "" (vacío)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return '';
  }

  // 2️⃣ CASO: Ya es un número
  if (typeof valor === 'number') {
    if (isNaN(valor)) {
      console.log('⚠️  NaN detectado, convirtiendo a ""');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return '';
    }
    console.log('✅ Resultado:', valor, '(number)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return valor;
  }

  // 3️⃣ CASO: Es string, necesita análisis
  if (typeof valor === 'string') {
    // Limpiar espacios en blanco
    const limpio = valor.trim();

    // Si quedó vacío después de trim
    if (limpio === '') {
      console.log('✅ Resultado: "" (solo espacios)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return '';
    }

    // 🔥 VALIDACIÓN CRÍTICA: ¿Es un número puro en formato string?
    // Ejemplos válidos: "12", "15.50", "15,50", "  25  "
    
    // Reemplazar coma por punto (para formatos como "15,50")
    const normalizado = limpio.replace(',', '.');
    
    // Intentar convertir a número
    const comoNumero = Number(normalizado);

    // 🔍 Verificar si es un número válido Y si el string original solo contenía dígitos/punto/coma
    const soloDigitosYPunto = /^[0-9]+([.,][0-9]+)?$/.test(limpio);

    if (!isNaN(comoNumero) && soloDigitosYPunto) {
      // ✅ ES UN NÚMERO PURO
      console.log('🔢 Detectado como NÚMERO PURO');
      console.log('   String original:', limpio);
      console.log('   Convertido a:', comoNumero);
      console.log('✅ Resultado:', comoNumero, '(number)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return comoNumero;
    } else {
      // ✅ ES TEXTO (contiene letras u otros caracteres)
      console.log('📝 Detectado como TEXTO');
      console.log('   Contiene letras o caracteres especiales');
      console.log('✅ Resultado:', `"${limpio}"`, '(string)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return limpio;
    }
  }

  // 4️⃣ CASO: Cualquier otro tipo (array, object, etc.)
  console.log('⚠️  Tipo no esperado, convirtiendo a string');
  const resultado = String(valor).trim();
  console.log('✅ Resultado:', `"${resultado}"`, '(string convertido)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return resultado === '' ? '' : resultado;
}

// ═══════════════════════════════════════════════════════════════
// 🔍 VALIDACIÓN COMPLETA DE PRODUCTO
// ═══════════════════════════════════════════════════════════════

/**
 * Valida y normaliza un producto completo del Excel
 * 
 * @returns ProductoValidado con todos los datos normalizados
 * @throws Error con mensaje descriptivo si alguna validación falla
 */
export function validarProducto(
  productoRaw: ProductoRaw,
  fila: number
): ProductoValidado {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log(`║  📦 VALIDANDO PRODUCTO - FILA ${fila.toString().padEnd(26)} ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    // 🔥 VALIDAR CADA CAMPO
    const codigo = validarCodigoBarras(productoRaw.codigo, fila);
    const nombre = validarCampoTexto(productoRaw.nombre, 'Nombre', fila, 3, 200);
    const precio = validarPrecio(productoRaw.precio, fila);
    const detalles = validarCampoTexto(productoRaw.detalles, 'Detalles', fila, 5, 500);
    const categoria = validarCampoTexto(productoRaw.categoria, 'Categoría', fila, 3, 100);
    const promocion = normalizarPromocion(productoRaw.promocion);
    const imagen = productoRaw.imagen ? String(productoRaw.imagen).trim() : '';

    const productoValidado: ProductoValidado = {
      codigo,
      nombre,
      precio,
      detalles,
      categoria,
      promocion,
      imagen,
    };

    console.log('');
    console.log('✅ PRODUCTO VALIDADO EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Código:', codigo);
    console.log('Nombre:', nombre);
    console.log('Precio:', precio);
    console.log('Promoción:', promocion || '(sin promoción)');
    console.log('Imagen:', imagen || '(sin especificar)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    return productoValidado;

  } catch (error: any) {
    console.log('');
    console.log('❌ ERROR EN VALIDACIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Fila:', fila);
    console.log('Error:', error.message);
    console.log('Datos recibidos:', JSON.stringify(productoRaw, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🖼️ VALIDACIÓN DE IMAGEN EN ZIP
// ═══════════════════════════════════════════════════════════════

/**
 * Busca y valida la imagen del producto en el ZIP
 * 
 * Estrategias de búsqueda:
 * 1. Por nombre especificado en Excel (columna "imagen")
 * 2. Por código del producto (ej: 1234567890.jpg)
 * 
 * @returns Nombre del archivo de imagen si se encuentra, null si no
 */
export function buscarImagenEnZip(
  zipEntries: any[],
  producto: ProductoValidado,
  fila: number
): { encontrada: boolean; entry: any | null; mensaje: string } {
  console.log('');
  console.log('🔍 [BUSCAR IMAGEN] Fila', fila);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Código producto:', producto.codigo);
  console.log('Imagen especificada:', producto.imagen || '(ninguna)');

  // ESTRATEGIA 1: Buscar por nombre especificado
  if (producto.imagen && producto.imagen.trim() !== '') {
    console.log('📌 Buscando por nombre especificado...');

    const imagenEntry = zipEntries.find(entry =>
      !entry.isDirectory &&
      entry.entryName.toLowerCase().includes('imagenes/') &&
      entry.entryName.toLowerCase().endsWith(producto.imagen.toLowerCase())
    );

    if (imagenEntry) {
      console.log('✅ Imagen encontrada por nombre:', imagenEntry.entryName);
      return {
        encontrada: true,
        entry: imagenEntry,
        mensaje: `Imagen encontrada: ${imagenEntry.entryName}`
      };
    } else {
      console.log('⚠️  Imagen NO encontrada por nombre especificado');
    }
  }

  // ESTRATEGIA 2: Buscar por código del producto
  console.log('📌 Buscando por código del producto...');

  const imagenPorCodigo = zipEntries.find(entry =>
    !entry.isDirectory &&
    entry.entryName.toLowerCase().includes('imagenes/') &&
    entry.entryName.toLowerCase().includes(producto.codigo.toLowerCase())
  );

  if (imagenPorCodigo) {
    console.log('✅ Imagen encontrada por código:', imagenPorCodigo.entryName);
    return {
      encontrada: true,
      entry: imagenPorCodigo,
      mensaje: `Imagen encontrada por código: ${imagenPorCodigo.entryName}`
    };
  }

  // NO SE ENCONTRÓ IMAGEN
  console.log('❌ Imagen NO encontrada en el ZIP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    encontrada: false,
    entry: null,
    mensaje: producto.imagen
      ? `Imagen "${producto.imagen}" no encontrada en carpeta imagenes/`
      : `No se encontró imagen con código ${producto.codigo} en carpeta imagenes/`
  };
}

// ═══════════════════════════════════════════════════════════════
// 📊 RESUMEN DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Genera un resumen de errores de validación
 */
export function generarResumenErrores(errores: ErrorValidacion[]): string {
  if (errores.length === 0) return '';

  let resumen = '\n╔═══════════════════════════════════════════════════════════╗\n';
  resumen += '║  ❌ ERRORES DE VALIDACIÓN                                 ║\n';
  resumen += '╚═══════════════════════════════════════════════════════════╝\n\n';

  errores.slice(0, 10).forEach((error, index) => {
    resumen += `${index + 1}. Fila ${error.fila} - Campo: ${error.campo}\n`;
    resumen += `   Error: ${error.error}\n`;
    resumen += `   Valor recibido: ${JSON.stringify(error.valor)}\n\n`;
  });

  if (errores.length > 10) {
    resumen += `... y ${errores.length - 10} errores más\n`;
  }

  return resumen;
}