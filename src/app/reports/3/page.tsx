import { executeSafeQuery, reportQueries } from '@/app/lib/db';
import DataTable from '@/app/components/datatable';
import KpiCard from '@/app/components/KpiCard';
import { productRankingFilterSchema } from '@/app/lib/validations';

export default async function Reporte3Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ============================================
  // VALIDACIÓN CON ZOD (REQUISITO OBLIGATORIO)
  // ============================================
  const params = await searchParams;
  
  const filters = productRankingFilterSchema.parse({
    page: params.page ? parseInt(params.page as string) : 1,
    limit: params.limit ? parseInt(params.limit as string) : 20,
    categoria: params.categoria as string,
    minUnidades: params.minUnidades ? parseInt(params.minUnidades as string) : undefined,
    clasificacion: params.clasificacion as string,
  });

  // Variables locales seguras con valores por defecto
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  // ============================================
  // CONSTRUCCIÓN DE QUERY PARAMETRIZADA
  // ============================================
  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramCounter = 1;

  // Filtro por categoría
  if (filters.categoria && filters.categoria !== 'todas') {
    whereConditions.push(`categoria = $${paramCounter}`);
    queryParams.push(filters.categoria);
    paramCounter++;
  }

  // Filtro por unidades mínimas vendidas
  if (filters.minUnidades && filters.minUnidades > 0) {
    whereConditions.push(`unidades_vendidas >= $${paramCounter}`);
    queryParams.push(filters.minUnidades);
    paramCounter++;
  }

  // Filtro por clasificación ABC (CORREGIDO)
  if (filters.clasificacion && filters.clasificacion !== 'todas' && filters.clasificacion !== undefined) {
    whereConditions.push(`clasificacion_abc = $${paramCounter}`);
    queryParams.push(filters.clasificacion);
    paramCounter++;
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // Query para datos
  const dataQuery = `
    SELECT * FROM view_ranking_productos
    ${whereClause}
    ORDER BY ingresos_totales DESC
    LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
  `;
  queryParams.push(limit, offset);

  // Query para total de registros
  const countQuery = `
    SELECT COUNT(*) as total FROM view_ranking_productos
    ${whereClause}
  `;
  const countParams = queryParams.slice(0, queryParams.length - 2);

  // ============================================
  // EJECUCIÓN DE QUERIES
  // ============================================
  const data = await executeSafeQuery(dataQuery, queryParams);
  const countResult = await executeSafeQuery(countQuery, countParams);
  const totalRecords = parseInt(countResult[0]?.total || '0');
  const totalPages = Math.ceil(totalRecords / limit);

  // ============================================
  // CÁLCULO DE KPIs
  // ============================================
  const totalProductos = data.length;
  const totalIngresos = data.reduce((sum, item) => sum + parseFloat(item.ingresos_totales || 0), 0);
  const promedioCalificacion = totalProductos > 0
    ? (data.reduce((sum, item) => sum + parseFloat(item.calificacion_promedio || 0), 0) / totalProductos).toFixed(2)
    : '0.00';

  // Obtener categorías únicas para el filtro
  const categoriasQuery = 'SELECT DISTINCT categoria FROM view_ranking_productos ORDER BY categoria';
  const categorias = await executeSafeQuery(categoriasQuery, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Reporte 3: Ranking de Productos</h1>
      <p className="text-gray-600 mb-6">
        Ranking con Window Functions (ROW_NUMBER, RANK, PARTITION BY, NTILE, FIRST_VALUE)
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Productos en Ranking"
          value={totalProductos.toString()}
          subtitle={`De ${totalRecords} totales`}
          color="blue"
        />
        <KpiCard
          title="Ingresos Totales (Página)"
          value={`$${totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          subtitle="Suma de productos mostrados"
          color="green"
        />
        <KpiCard
          title="Calificación Promedio"
          value={promedioCalificacion}
          subtitle="De productos en pantalla"
          color="orange"
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select 
              name="categoria" 
              defaultValue={filters.categoria || 'todas'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((cat: any) => (
                <option key={cat.categoria} value={cat.categoria}>
                  {cat.categoria}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por clasificación ABC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clasificación ABC</label>
            <select 
              name="clasificacion" 
              defaultValue={filters.clasificacion || 'todas'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="A - Alto Valor">A - Alto Valor</option>
              <option value="B - Valor Medio">B - Valor Medio</option>
              <option value="C - Bajo Valor">C - Bajo Valor</option>
            </select>
          </div>

          {/* Filtro por unidades mínimas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unidades Vendidas Mín.</label>
            <input 
              type="number" 
              name="minUnidades" 
              min="0"
              defaultValue={filters.minUnidades || ''}
              placeholder="Ej: 10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Registros por página */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Por página</label>
            <select 
              name="limit" 
              defaultValue={limit.toString()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          {/* Botones */}
          <div className="md:col-span-4 flex gap-4">
            <button 
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Aplicar Filtros
            </button>
            <a 
              href="/reports/3"
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Limpiar
            </a>
          </div>
        </form>
      </div>

      {/* Tabla de datos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Ranking de Productos con Window Functions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Mostrando {Math.min(offset + 1, totalRecords)}-{Math.min(offset + limit, totalRecords)} de {totalRecords} productos
          </p>
        </div>

        <DataTable
          data={data}
          columns={[
            { key: 'nombre_producto', header: 'Producto', width: 'w-1/4' },
            { key: 'categoria', header: 'Categoría' },
            { 
              key: 'unidades_vendidas', 
              header: 'Unidades', 
              format: (val: any) => val !== null && val !== undefined ? Number(val).toString() : '0'
            },
            { 
              key: 'ingresos_totales', 
              header: 'Ingresos', 
              format: (val: any) => val !== null && val !== undefined ? `$${parseFloat(val).toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '$0.00'
            },
            { 
              key: 'ranking_categoria', 
              header: 'Rank Cat.', 
              format: (val: any) => val !== null && val !== undefined ? `#${Number(val)}` : 'N/A'
            },
            { 
              key: 'clasificacion_abc', 
              header: 'Clasificación', 
              format: (val: any) => val || 'N/A'
            },
          ]}
        />
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-700">
            Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
          </div>
          
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}&limit=${limit}${filters.categoria ? `&categoria=${filters.categoria}` : ''}${filters.clasificacion ? `&clasificacion=${filters.clasificacion}` : ''}${filters.minUnidades ? `&minUnidades=${filters.minUnidades}` : ''}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ← Anterior
              </a>
            )}
            
            {page < totalPages && (
              <a
                href={`?page=${page + 1}&limit=${limit}${filters.categoria ? `&categoria=${filters.categoria}` : ''}${filters.clasificacion ? `&clasificacion=${filters.clasificacion}` : ''}${filters.minUnidades ? `&minUnidades=${filters.minUnidades}` : ''}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Siguiente →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Explicación técnica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">🪟 Window Functions Usadas</h3>
          <ul className="text-sm text-purple-700 list-disc list-inside space-y-1">
            <li><strong>ROW_NUMBER()</strong>: Ranking general sin empates</li>
            <li><strong>RANK()</strong>: Ranking con empates permitidos</li>
            <li><strong>PARTITION BY</strong>: Ranking por categoría</li>
            <li><strong>NTILE(3)</strong>: Clasificación ABC en 3 grupos</li>
            <li><strong>FIRST_VALUE()</strong>: Comparación con líder</li>
          </ul>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">🔒 Seguridad Implementada</h3>
          <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
            <li><strong>Validación Zod</strong>: Todos los parámetros validados</li>
            <li><strong>Queries Parametrizadas</strong>: Sin concatenación de strings</li>
            <li><strong>Whitelist</strong>: Solo clasificaciones permitidas</li>
            <li><strong>Usuario restringido</strong>: Solo SELECT en VIEWS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}