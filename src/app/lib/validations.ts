import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN CON ZOD
// ============================================
// Validación de parámetros de entrada para reportes
// Cumple requisitos de seguridad: whitelist de parámetros
// ============================================

// Schema para paginación
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// Schema para filtros de fecha (Reporte 4: Tendencia Mensual)
export const dateFilterSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export type DateFilterParams = z.infer<typeof dateFilterSchema>;

// Schema para filtros de categoría (Reporte 1: Ventas por Categoría)
export const categoryFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  minIngresos: z.coerce.number().min(0).optional(),
  orderBy: z.enum(['ingresos_totales', 'unidades_vendidas', 'margen_total']).default('ingresos_totales'),
  orderDir: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CategoryFilterParams = z.infer<typeof categoryFilterSchema>;

// Schema para filtros de ranking de productos (Reporte 3)
export const productRankingFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  categoria: z.string().optional(),
  minUnidades: z.coerce.number().int().min(0).optional(),
  clasificacion: z.enum(['A - Alto Valor', 'B - Valor Medio', 'C - Bajo Valor', 'todas']).optional(),
});

export type ProductRankingFilterParams = z.infer<typeof productRankingFilterSchema>;

// Schema para filtros de satisfacción (Reporte 5)
export const satisfactionFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  minCalificacion: z.coerce.number().min(1).max(5).optional(),
  minReseñas: z.coerce.number().int().min(1).default(3),
  nivel: z.enum(['Excelente', 'Muy Bueno', 'Aceptable', 'Necesita Mejora']).optional(),
});

export type SatisfactionFilterParams = z.infer<typeof satisfactionFilterSchema>;

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida y parsea parámetros de búsqueda con el schema proporcionado
 * @param searchParams - URL search params
 * @param schema - Zod schema para validación
 * @returns Objeto validado o null si falla
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams | { [key: string]: string | string[] | undefined },
  schema: z.ZodSchema<T>
): T | null {
  try {
    // Convertir searchParams a objeto plano
    const params: Record<string, any> = {};
    
    if (searchParams instanceof URLSearchParams) {
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } else {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          params[key] = value[0]; // Tomar primer valor si es array
        } else {
          params[key] = value;
        }
      });
    }
    
    return schema.parse(params);
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
}

/**
 * Calcula offset para paginación
 * @param page - Número de página (1-indexed)
 * @param limit - Límite de resultados por página
 * @returns Offset para SQL query
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calcula total de páginas
 * @param totalRows - Total de filas
 * @param limit - Límite por página
 * @returns Total de páginas
 */
export function calculateTotalPages(totalRows: number, limit: number): number {
  return Math.ceil(totalRows / limit);
}
