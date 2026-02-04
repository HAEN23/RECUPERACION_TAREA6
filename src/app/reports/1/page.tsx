import { executeSafeQuery, reportQueries } from '@/app/lib/db';
import DataTable from '@/app/components/datatable';
import KpiCard from '@/app/components/KpiCard';
import { 
  categoryFilterSchema, 
  validateSearchParams, 
  calculateOffset, 
  calculateTotalPages 
} from '@/app/lib/validations';
import Link from 'next/link';

export default async function Reporte1Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ============================================
  // VALIDACIÓN CON ZOD (REQUISITO OBLIGATORIO)
  // ============================================
  const params = await searchParams;
  const validated = validateSearchParams(params, categoryFilterSchema);
  
  // Si validación falla, usar valores por defecto
  const filters = validated || {
    page: 1,
    limit: 10,
    orderBy: 'ingresos_totales' as const,
    orderDir: 'DESC' as const,
  };
  
  // Asegurar valores seguros para TypeScript
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const orderBy = filters.orderBy ?? 'ingresos_totales';
  const orderDir = filters.orderDir ?? 'DESC';
  
  const offset = calculateOffset(page, limit);
  
  // ============================================
  // QUERIES PARAMETRIZADAS (SEGURIDAD)
  // ============================================
  
  // Construir query con whitelist de orderBy
  const orderByWhitelist: Record<string, string> = {
    'ingresos_totales': 'ingresos_totales',
    'unidades_vendidas': 'unidades_vendidas',
    'margen_total': 'margen_total',
  };
  
  const safeOrderBy = orderByWhitelist[orderBy] || 'ingresos_totales';
  const safeOrderDir = orderDir === 'ASC' ? 'ASC' : 'DESC';
  
  // Query con filtro opcional de ingresos mínimos
  let query = `SELECT * FROM view_ventas_por_categoria`;
  const queryParams: any[] = [];
  
  if (filters.minIngresos !== undefined) {
    query += ` WHERE ingresos_totales >= $1`;
    queryParams.push(filters.minIngresos);
    query += ` ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT $2 OFFSET $3`;
    queryParams.push(limit, offset);
  } else {
    query += ` ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT $1 OFFSET $2`;
    queryParams.push(limit, offset);
  }
  
  const data = await executeSafeQuery(query, queryParams);
  
  // Obtener total para paginación
  const totalResult = await executeSafeQuery(
    filters.minIngresos !== undefined
      ? `SELECT COUNT(*) as total FROM view_ventas_por_categoria WHERE ingresos_totales >= $1`
      : reportQueries.countVentasCategoria,
    filters.minIngresos !== undefined ? [filters.minIngresos] : []
  );
  
  const total = parseInt(totalResult[0]?.total || '0');
  const totalPages = calculateTotalPages(total, limit);
  
  // Calcular KPIs
  const totalIngresos = data.reduce((sum, row) => 
    sum + parseFloat(row.ingresos_totales || 0), 0
  );
  
  const totalUnidades = data.reduce((sum, row) => 
    sum + parseInt(row.unidades_vendidas || 0), 0
  );
  
  const avgMargin = data.length > 0 
    ? (data.reduce((sum, row) => sum + parseFloat(row.margen_porcentual_total || 0), 0) / data.length).toFixed(1)
    : '0.0';
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Reporte 1: Ventas por Categoría</h1>
      <p className="text-gray-600 mb-6">
        Análisis de ventas agrupadas por categoría de producto. Incluye ingresos, márgenes y 
        clasificación de desempeño. <strong>HAVING</strong> filtra categorías con ventas mayores a $500.
      </p>
      
      {/* Filtros con validación Zod */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">🔍 Filtros (Validados con Zod)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <Link 
              href={`/reports/1?page=1&limit=${limit}&orderBy=ingresos_totales&orderDir=${orderDir}${filters.minIngresos ? `&minIngresos=${filters.minIngresos}` : ''}`}
              className={`block w-full px-3 py-2 border rounded-md text-sm ${orderBy === 'ingresos_totales' ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'}`}
            >
              Ingresos
            </Link>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registros por página
            </label>
            <div className="flex gap-2">
              {[10, 20, 50].map(l => (
                <Link 
                  key={l}
                  href={`/reports/1?page=1&limit=${l}&orderBy=${orderBy}&orderDir=${orderDir}${filters.minIngresos ? `&minIngresos=${filters.minIngresos}` : ''}`}
                  className={`px-3 py-2 border rounded-md text-sm ${limit === l ? 'bg-blue-600 text-white' : 'bg-white'}`}
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              &nbsp;
            </label>
            <Link 
              href="/reports/1"
              className="block w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm text-center"
            >
              Limpiar Filtros
            </Link>
          </div>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Ingresos Totales"
          value={`$${totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          subtitle="Suma de todas las ventas"
          color="blue"
        />
        <KpiCard
          title="Unidades Vendidas"
          value={totalUnidades.toLocaleString('es-ES')}
          subtitle="Total unidades en categorías activas"
          color="green"
        />
        <KpiCard
          title="Margen Promedio"
          value={`${avgMargin}%`}
          subtitle="Margen porcentual promedio"
          color="purple"
        />
      </div>
      
      {/* Tabla de datos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Ventas por Categoría</h2>
          <p className="text-sm text-gray-500">
            Categorías con ventas superiores a $500 (filtrado por HAVING SUM(...) {'>'} 500)
          </p>
        </div>
        
        <DataTable 
          data={data}
          columns={[
            { 
              key: 'categoria', 
              header: 'Categoría', 
              width: 'w-1/4' 
            },
            { 
              key: 'ingresos_totales', 
              header: 'Ingresos Totales', 
              format: (val) => `$${parseFloat(val).toLocaleString('es-ES', { minimumFractionDigits: 2 })}` 
            },
            { 
              key: 'unidades_vendidas', 
              header: 'Unidades Vendidas', 
              format: (val) => parseInt(val).toLocaleString('es-ES')
            },
            { 
              key: 'margen_porcentual_total', 
              header: 'Margen %', 
              format: (val) => `${parseFloat(val).toFixed(1)}%`,
              color: (val) => parseFloat(val) > 30 ? 'text-green-600' : parseFloat(val) > 20 ? 'text-yellow-600' : 'text-red-600'
            },
            { 
              key: 'margen_total', 
              header: 'Margen Absoluto', 
              format: (val) => `$${parseFloat(val).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
            },
            { 
              key: 'total_ordenes', 
              header: 'Órdenes', 
              format: (val) => val.toString()
            },
            { 
              key: 'clasificacion_desempeno', 
              header: 'Desempeño', 
              width: 'w-32',
              badge: (val: string) => {
                if (val === 'Alto Desempeño') {
                  return { text: 'Alto', color: 'green' };
                }
                if (val === 'Desempeño Medio') {
                  return { text: 'Medio', color: 'yellow' };
                }
                return { text: 'Bajo', color: 'red' };
              }
            }
          ]}
        />
        
        {/* Paginación mejorada */}
        {totalPages > 1 && (
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} de {total} registros
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/reports/1?page=${page - 1}&limit=${limit}&orderBy=${orderBy}&orderDir=${orderDir}${filters.minIngresos ? `&minIngresos=${filters.minIngresos}` : ''}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ← Anterior
                </Link>
              )}
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/reports/1?page=${page + 1}&limit=${limit}&orderBy=${orderBy}&orderDir=${orderDir}${filters.minIngresos ? `&minIngresos=${filters.minIngresos}` : ''}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Siguiente →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Explicación técnica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📊 Funciones SQL Utilizadas</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start">
              <span className="font-mono bg-blue-100 px-2 py-1 rounded mr-2">SUM()</span>
              <span>Cálculo de ingresos_totales, margen_total, unidades_vendidas</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-blue-100 px-2 py-1 rounded mr-2">COUNT()</span>
              <span>Conteo de órdenes y productos únicos vendidos</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-blue-100 px-2 py-1 rounded mr-2">AVG()</span>
              <span>Cálculo de margen_promedio_unitario</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-blue-100 px-2 py-1 rounded mr-2">GROUP BY</span>
              <span>Agrupación por categoría para consolidar métricas</span>
            </li>
          </ul>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">🔒 Seguridad con Zod</h3>
          <ul className="text-sm text-purple-700 space-y-2">
            <li className="flex items-start">
              <span className="font-mono bg-purple-100 px-2 py-1 rounded mr-2">Validación</span>
              <span>Parámetros validados con schemas Zod (page, limit, orderBy)</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-purple-100 px-2 py-1 rounded mr-2">Whitelist</span>
              <span>OrderBy usa whitelist para prevenir SQL injection</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-purple-100 px-2 py-1 rounded mr-2">Parametrizado</span>
              <span>Queries usan $1, $2... para evitar concatenación</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Ejemplo de consulta */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">🔍 Ejemplo de Consulta SQL</h4>
        <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`SELECT 
    c.nombre as categoria,
    SUM(od.cantidad * od.precio_unitario) as ingresos_totales,
    SUM(od.cantidad) as unidades_vendidas,
    ROUND(
        (SUM(od.cantidad * (od.precio_unitario - p.costo)) / 
         SUM(od.cantidad * od.precio_unitario) * 100)::numeric,
        2
    ) as margen_porcentual_total,
    CASE 
        WHEN SUM(od.cantidad * od.precio_unitario) > 1000 
        THEN 'Alto Desempeño'
        WHEN SUM(od.cantidad * od.precio_unitario) > 500 
        THEN 'Desempeño Medio'
        ELSE 'Bajo Desempeño'
    END as clasificacion_desempeno
FROM categorias c
JOIN productos p ON c.id = p.categoria_id
JOIN orden_detalles od ON p.id = od.producto_id
JOIN ordenes o ON od.orden_id = o.id
WHERE o.status IN ('entregado', 'pagado')
GROUP BY c.id, c.nombre
HAVING SUM(od.cantidad * od.precio_unitario) > 500
ORDER BY ingresos_totales DESC;`}
        </pre>
      </div>
    </div>
  );
}