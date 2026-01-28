// src/common/decorators/public.decorator.ts
// ✅ DECORADOR PARA MARCAR ENDPOINTS PÚBLICOS

import { SetMetadata } from '@nestjs/common';

// Clave para identificar endpoints públicos
export const IS_PUBLIC_KEY = 'isPublic';

// Decorador @Public() que se aplica a controllers o métodos
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);