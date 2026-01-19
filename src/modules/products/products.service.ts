// src/modules/products/products.service.ts - ✅ BASE_URL CORREGIDA

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService implements OnModuleInit {
  private baseUrl: string;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly configService: ConfigService,
  ) {
    // ═══════════════════════════════════════════════════════════════
    // 🔧 CONSTRUIR BASE_URL CORRECTAMENTE - ✅ SOLUCIÓN
    // ═══════════════════════════════════════════════════════════════

    const protocol = this.configService.get<string>('API_PROTOCOL', 'http');
    const host = this.configService.get<string>('API_HOST', '172.20.20.70');
    const port = this.configService.get<number>('PORT', 3000);

    // ✅ CORRECTO: Solo la base sin duplicar protocolo
    // Resultado: "http://172.20.20.70:3000"
    this.baseUrl = `${protocol}://${host}:${port}`;

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 ProductsService - Configuración de URLs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Protocolo:', protocol);
    console.log('🖥️  Host:', host);
    console.log('🔌 Puerto:', port);
    console.log('🌐 Base URL:', this.baseUrl);
    console.log('📸 URL Imágenes:', `${this.baseUrl}/public/imagenes/`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  }

  async onModuleInit() {
    const count = await this.productRepository.count();

    if (count === 0) {
      console.log('📦 Base de datos vacía, creando productos por defecto...');
      await this.seedDefaultProducts();
      console.log('✅ Productos por defecto creados');
    } else {
      console.log(`✅ ProductsService inicializado con ${count} productos`);
    }
  }

  private async seedDefaultProducts() {
    const defaultProducts = [
      {
        codigo: '987654321',
        nombre: 'Coca-Cola 500ml',
        precio: 8.5,
        detalles: 'Bebida gaseosa sabor cola',
        imagen: 'coca-cola.jpg',
        categoria: 'Bebidas',
        promocion: '2x1'
      },
      {
        codigo: '1234567891',
        nombre: 'Papas Fritas Lays 45g',
        precio: 5.0,
        detalles: 'Papas fritas clásicas',
        imagen: 'papas-lays.jpg',
        categoria: 'Snacks',
        promocion: ''
      }
    ];

    await this.productRepository.save(defaultProducts);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 BUSCAR PRODUCTOS CON URL CORRECTA
  // ═══════════════════════════════════════════════════════════════

  async findAll(): Promise<any[]> {
    const products = await this.productRepository.find({
      order: { fecha_creacion: 'DESC' }
    });

    // ✅ Pasar baseUrl al método toJSON de cada producto
    return products.map(product => product.toJSON(this.baseUrl));
  }

  async findByCode(codigo: string): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { codigo }
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        mensaje: 'Producto no encontrado',
        codigo: codigo
      });
    }

    // ✅ Pasar baseUrl al método toJSON
    const productJson = product.toJSON(this.baseUrl);

    // 🔍 LOG ESTRATÉGICO: Mostrar URL de imagen generada
    console.log('');
    console.log('┌────────────────────────────────────────────────────┐');
    console.log('│ 🔍 PRODUCTO ENCONTRADO                             │');
    console.log('└────────────────────────────────────────────────────┘');
    console.log('📋 Código:', codigo);
    console.log('📦 Nombre:', product.nombre);
    console.log('💰 Precio:', product.precio);
    console.log('📸 Archivo imagen:', product.imagen || 'Sin imagen');
    console.log('🌐 URL imagen completa:', productJson.imagen_url || 'Sin URL');
    console.log('└────────────────────────────────────────────────────┘');
    console.log('');

    return productJson;
  }

  async findNameOnly(codigo: string): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { codigo },
      select: ['codigo', 'nombre']
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        mensaje: 'Producto no encontrado',
        codigo: codigo
      });
    }

    return {
      codigo: product.codigo,
      nombre: product.nombre
    };
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const existe = await this.productRepository.findOne({
      where: { codigo: productData.codigo }
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe un producto con el código ${productData.codigo}`
      );
    }

    if (!productData.codigo || !productData.nombre || !productData.categoria) {
      throw new BadRequestException('Faltan campos obligatorios');
    }

    if (!productData.precio || productData.precio <= 0) {
      throw new BadRequestException('Precio inválido');
    }

    const nuevoProducto = this.productRepository.create({
      ...productData,
      promocion: productData.promocion || ''
    });

    const saved = await this.productRepository.save(nuevoProducto);

    console.log('');
    console.log('✅ Producto creado:', saved.codigo);
    console.log('📸 Imagen:', saved.imagen);
    console.log('🌐 URL completa:', `${this.baseUrl}/public/imagenes/${saved.imagen}`);
    console.log('');

    return saved;
  }

  async update(codigo: string, updateData: Partial<Product>): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { codigo }
    });

    if (!product) {
      throw new NotFoundException(`Producto ${codigo} no encontrado`);
    }

    const { codigo: _, ...dataToUpdate } = updateData;
    Object.assign(product, dataToUpdate);

    return await this.productRepository.save(product);
  }

  async delete(codigo: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { codigo }
    });

    if (!product) {
      throw new NotFoundException(`Producto ${codigo} no encontrado`);
    }

    await this.productRepository.remove(product);
  }

  async exists(codigo: string): Promise<boolean> {
    const count = await this.productRepository.count({
      where: { codigo }
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return await this.productRepository.count();
  }

  async findByCategoria(categoria: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { categoria },
      order: { nombre: 'ASC' }
    });
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('producto')
      .where('producto.precio >= :minPrice', { minPrice })
      .andWhere('producto.precio <= :maxPrice', { maxPrice })
      .orderBy('producto.precio', 'ASC')
      .getMany();
  }

  async getCategorias(): Promise<string[]> {
    const result = await this.productRepository
      .createQueryBuilder('producto')
      .select('DISTINCT producto.categoria', 'categoria')
      .getRawMany();

    return result.map(r => r.categoria);
  }
}