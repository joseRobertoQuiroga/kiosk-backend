import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  HttpCode, 
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createWriteStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import type { Response } from 'express';
import * as XLSX from 'xlsx';
import * as AdmZip from 'adm-zip';
import {
  validarProducto,
  buscarImagenEnZip,
  type ProductoValidado,
} from './products.validation';

import { ProductsService } from './products.service';
import { Public } from '../../common/decorators/public.decorator';
@Public()
@Controller('productos')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ═══════════════════════════════════════════════════════════════
  // 📥 DESCARGAR PLANTILLA EXCEL
  // ═══════════════════════════════════════════════════════════════
  @Public()
  @Get('template')
  downloadTemplate(@Res() res: Response) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [GET /productos/template] Generando plantilla Excel');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const templateData = [
      {
        codigo: '1234567890',
        nombre: 'Producto Ejemplo 1',
        categoria: 'Bebidas',
        precio: 15.50,
        detalles: 'Descripción del producto',
        promocion: 'Oferta 2x1',
        imagen: '1234567890.jpg' // 🔥 NUEVO: nombre de archivo de imagen
      },
      {
        codigo: '9876543210',
        nombre: 'Producto Ejemplo 2',
        categoria: 'Snacks',
        precio: 8.00,
        detalles: 'Otra descripción',
        promocion: '',
        imagen: '9876543210.png' // 🔥 Puede ser jpg, png, webp
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    worksheet['!cols'] = [
      { wch: 15 }, // codigo
      { wch: 30 }, // nombre
      { wch: 15 }, // categoria
      { wch: 10 }, // precio
      { wch: 40 }, // detalles
      { wch: 20 }, // promocion
      { wch: 25 }  // 🔥 imagen
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    console.log('✅ Plantilla generada correctamente');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=plantilla_productos.xlsx',
      'Content-Length': buffer.length
    });

    res.send(buffer);
  }

  // ═══════════════════════════════════════════════════════════════
  // 📦 CARGA MASIVA CON IMÁGENES (ZIP)
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * 🔥 NUEVO: Carga masiva desde archivo ZIP
   * 
   * Estructura del ZIP:
   * ├── productos.xlsx      (datos de productos)
   * └── imagenes/          (carpeta con imágenes)
   *     ├── 1234567890.jpg
   *     ├── 9876543210.png
   *     └── ...
   * 
   * El nombre de cada imagen DEBE coincidir con el código del producto
   */
  @Public()
  @Post('bulk-zip')
@HttpCode(HttpStatus.CREATED)
@UseInterceptors(FileInterceptor('archivo', {
  storage: diskStorage({
    destination: './temp',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      callback(null, `upload-${uniqueSuffix}.zip`);
    }
  }),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.includes('zip') && !file.originalname.endsWith('.zip')) {
      return callback(
        new BadRequestException('Solo se permiten archivos ZIP'),
        false
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  }
}))
async bulkCreateFromZip(@UploadedFile() file: Express.Multer.File) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 [POST /productos/bulk-zip] Procesando ZIP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!file) {
    throw new BadRequestException('No se recibió el archivo ZIP');
  }

  let insertados = 0;
  let errores = 0;
  const detallesErrores: Array<{ fila: number; error: string; codigo?: string }> = [];

  try {
    // 🔥 EXTRAER ZIP
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(file.path);
    const zipEntries = zip.getEntries();

    console.log('📂 Archivos en ZIP:', zipEntries.length);

    // 🔥 BUSCAR ARCHIVO EXCEL
    const excelEntry = zipEntries.find(entry => 
      entry.entryName.toLowerCase().includes('productos') && 
      (entry.entryName.endsWith('.xlsx') || entry.entryName.endsWith('.xls'))
    );

    if (!excelEntry) {
      throw new BadRequestException(
        'No se encontró el archivo productos.xlsx dentro del ZIP. ' +
        'Asegúrate de que el archivo Excel se llame "productos.xlsx"'
      );
    }

    console.log('📄 Excel encontrado:', excelEntry.entryName);

    // 🔥 LEER EXCEL
    const excelBuffer = excelEntry.getData();
    const workbook = XLSX.read(excelBuffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const productosRaw = XLSX.utils.sheet_to_json(sheet);

    console.log('📊 Productos detectados:', productosRaw.length);

    if (productosRaw.length === 0) {
      throw new BadRequestException('El archivo Excel está vacío o no tiene datos válidos');
    }

    // 🔥 CREAR DIRECTORIO DE IMÁGENES
    const imagenesDir = './public/imagenes';
    if (!existsSync(imagenesDir)) {
      mkdirSync(imagenesDir, { recursive: true });
      console.log('📁 Carpeta de imágenes creada');
    }

    // 🔥 PROCESAR CADA PRODUCTO CON VALIDACIÓN
    productosRaw.forEach((productoRaw: any, index) => {
      const fila = index + 2; // +2 porque Excel empieza en 1 y tiene header
      
      try {
        console.log('');
        console.log(`━━━━━━━━━━━━━━━━━━━━ FILA ${fila} ━━━━━━━━━━━━━━━━━━━━`);

        // ✅ VALIDAR PRODUCTO (usa tu archivo products.validation.ts)
        const productoValidado: ProductoValidado = validarProducto(productoRaw, fila);

        console.log('✅ Producto validado:', productoValidado.codigo);

        // 🔥 BUSCAR IMAGEN EN ZIP
        const resultadoBusqueda = buscarImagenEnZip(
          zipEntries,
          productoValidado,
          fila
        );

        let imagenGuardada = 'default-product.jpg';

        if (resultadoBusqueda.encontrada && resultadoBusqueda.entry) {
          try {
            // Extraer imagen del ZIP
            const imagenBuffer = resultadoBusqueda.entry.getData();
            
            // Generar nombre único
            const ext = extname(resultadoBusqueda.entry.entryName);
            const nombreUnico = `producto-${productoValidado.codigo}-${Date.now()}${ext}`;
            const rutaDestino = join(imagenesDir, nombreUnico);

            // Guardar imagen
            writeFileSync(rutaDestino, imagenBuffer);
            
            imagenGuardada = nombreUnico;
            console.log(`✅ Imagen guardada: ${nombreUnico}`);
          } catch (errorImagen: any) {
            console.warn(`⚠️ Error guardando imagen: ${errorImagen.message}`);
            console.warn(`   Se usará imagen por defecto`);
          }
        } else {
          console.warn(`⚠️ ${resultadoBusqueda.mensaje}`);
          console.warn(`   Se usará imagen por defecto`);
        }

        // 🔥 CREAR PRODUCTO EN EL SISTEMA
        this.productsService.create({
          codigo: productoValidado.codigo,
          nombre: productoValidado.nombre,
          precio: productoValidado.precio,
          detalles: productoValidado.detalles,
          categoria: productoValidado.categoria,
// 🔥 CORREGIDO: Convertir promocion a string si es number
  promocion: typeof productoValidado.promocion === 'number' 
    ? String(productoValidado.promocion) 
    : (productoValidado.promocion || ''),          imagen: imagenGuardada
        });

        insertados++;
        console.log(`✅ [${index + 1}/${productosRaw.length}] Producto insertado`);

      } catch (error: any) {
        errores++;
        const errorMsg = error.message || 'Error desconocido';
        
        detallesErrores.push({
          fila,
          codigo: productoRaw?.codigo || 'N/A',
          error: errorMsg
        });

        console.error(`❌ [${index + 1}/${productosRaw.length}] ERROR en fila ${fila}:`);
        console.error(`   Código: ${productoRaw?.codigo || 'N/A'}`);
        console.error(`   Error: ${errorMsg}`);
      }
    });

    // 🔥 LIMPIAR ARCHIVO TEMPORAL
    if (existsSync(file.path)) {
      unlinkSync(file.path);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN FINAL:');
    console.log(`   ✅ Insertados: ${insertados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📦 Total procesados: ${productosRaw.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      insertados,
      errores,
      total: productosRaw.length,
      detalles: errores > 0 ? detallesErrores : undefined
    };

  } catch (error: any) {
    console.error('❌ Error crítico procesando ZIP:', error);
    
    // Limpiar archivo temporal
    if (existsSync(file.path)) {
      unlinkSync(file.path);
    }

    throw new BadRequestException(
      `Error procesando ZIP: ${error.message}`
    );
  }
}

  // ═══════════════════════════════════════════════════════════════
  // 📦 CARGA MASIVA SIN IMÁGENES (ORIGINAL)
  // ═══════════════════════════════════════════════════════════════

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreateProducts(@Body() productos: Array<{
    codigo: string;
    nombre: string;
    precio: number;
    detalles: string;
    categoria: string;
    promocion?: string;
  }>) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 [POST /productos/bulk] Carga masiva SIN imágenes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Total registros:', productos.length);

    if (!productos || productos.length === 0) {
      throw new BadRequestException('No se enviaron productos');
    }

    let insertados = 0;
    let errores = 0;
    const detallesErrores: Array<{ fila: number; error: string }> = [];

    productos.forEach((producto, index) => {
      try {
        if (!producto.codigo || !producto.nombre || !producto.categoria) {
          throw new Error('Campos obligatorios faltantes');
        }

        if (producto.precio <= 0) {
          throw new Error('Precio debe ser mayor a 0');
        }

        this.productsService.create({
          ...producto,
          imagen: 'default-product.jpg',
          promocion: producto.promocion || ''
        });

        insertados++;
        console.log(`✅ [${index + 1}/${productos.length}] Insertado: ${producto.codigo}`);

      } catch (error: any) {
        errores++;
        const errorMsg = error.message || 'Error desconocido';
        detallesErrores.push({
          fila: index + 2,
          error: errorMsg
        });
        console.error(`❌ [${index + 1}/${productos.length}] Error en ${producto.codigo}: ${errorMsg}`);
      }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DE CARGA MASIVA:');
    console.log(`   ✅ Insertados: ${insertados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      insertados,
      errores,
      total: productos.length,
      detalles: errores > 0 ? detallesErrores : undefined
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📖 GET - OBTENER PRODUCTOS
  // ═══════════════════════════════════════════════════════════════
@Public()
 @Get()
async getAllProducts() { // 🔥 AGREGAR async
  console.log('🔍 [GET /productos] Obteniendo todos los productos');
  const productos = await this.productsService.findAll(); // 🔥 AGREGAR await
  console.log(`✅ [GET /productos] Retornando ${productos.length} productos`);
  return productos;
}
@Public()
@Get(':codigo')
async getProductByCode(@Param('codigo') codigo: string) { // 🔥 AGREGAR async
  console.log(`🔍 [GET /productos/${codigo}] Buscando producto`);
  const producto = await this.productsService.findByCode(codigo); // 🔥 AGREGAR await
  console.log(`✅ [GET /productos/${codigo}] Producto encontrado: ${producto.nombre}`);
  return producto;
}
@Public()
@Get('nombre/:codigo')
async getProductNameOnly(@Param('codigo') codigo: string) { // 🔥 AGREGAR async
  console.log(`🔍 [GET /productos/nombre/${codigo}] Obteniendo solo nombre`);
  return await this.productsService.findNameOnly(codigo); // 🔥 AGREGAR await
}

  // ═══════════════════════════════════════════════════════════════
  // ➕ POST - CREAR PRODUCTO (CON IMAGEN)
  // ═══════════════════════════════════════════════════════════════
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imagen', {
    storage: diskStorage({
      destination: './public/imagenes',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        const filename = `producto-${uniqueSuffix}${ext}`;
        callback(null, filename);
      }
    }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(
          new BadRequestException('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)'),
          false
        );
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    }
  }))
  createProduct(
    @Body() productData: {
      codigo: string;
      nombre: string;
      precio: string | number;
      detalles: string;
      categoria: string;
      promocion?: string;
    },
    @UploadedFile() file?: Express.Multer.File
  ) {
    const precio = typeof productData.precio === 'string' 
      ? parseFloat(productData.precio) 
      : productData.precio;

    const imagenNombre = file ? file.filename : 'default-product.jpg';

    const nuevoProducto = this.productsService.create({
      ...productData,
      precio,
      imagen: imagenNombre,
      promocion: productData.promocion || ''
    });

    return nuevoProducto;
  }

  // ═══════════════════════════════════════════════════════════════
  // ✏️ PUT - ACTUALIZAR PRODUCTO
  // ═══════════════════════════════════════════════════════════════
  @Public()
  @Put(':codigo')
  @UseInterceptors(FileInterceptor('imagen', {
    storage: diskStorage({
      destination: './public/imagenes',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `producto-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Solo se permiten imágenes'), false);
      }
      callback(null, true);
    }
  }))
  updateProduct(
    @Param('codigo') codigo: string,
    @Body() updateData: Partial<{
      nombre: string;
      precio: string | number;
      detalles: string;
      categoria: string;
      promocion: string;
    }>,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const dataToUpdate: any = {};

    if (updateData.nombre !== undefined) dataToUpdate.nombre = updateData.nombre;
    if (updateData.precio !== undefined) {
      dataToUpdate.precio = typeof updateData.precio === 'string'
        ? parseFloat(updateData.precio)
        : updateData.precio;
    }
    if (updateData.detalles !== undefined) dataToUpdate.detalles = updateData.detalles;
    if (updateData.categoria !== undefined) dataToUpdate.categoria = updateData.categoria;
    if (updateData.promocion !== undefined) dataToUpdate.promocion = updateData.promocion;
    if (file) dataToUpdate.imagen = file.filename;

    return this.productsService.update(codigo, dataToUpdate);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🗑️ DELETE - ELIMINAR PRODUCTO
  // ═══════════════════════════════════════════════════════════════
  @Public()
  @Delete(':codigo')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProduct(@Param('codigo') codigo: string) {
    this.productsService.delete(codigo);
  }
}