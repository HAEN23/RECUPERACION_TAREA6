import { executeSafeQuery } from '@/app/lib/db';
import DataTable from '@/app/components/datatable';
import KpiCard from '@/app/components/KpiCard';

export default async function Reporte5Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Parámetro de filtro para mínimo de reseñas
  const minResenas = params.minResenas ? parseInt(params.minResenas as string) : 2;

  // Query parametrizada con filtro dinámico
  const query = `
    SELECT * FROM view_satisfaccion_clientes
    WHERE total_reseñas >= $1
    ORDER BY calificacion_promedio DESC
  `;
  
  const data = await executeSafeQuery(query, [minResenas]);

  // KPIs
  const totalProductos = data.length;
  const promedioGeneral = totalProductos > 0
    ? (data.reduce((sum: number, item: any) => sum + parseFloat(item.calificacion_promedio || 0), 0) / totalProductos).toFixed(2)
    : '0.00';
  const productosPositivos = data.filter((item: any) => item.nivel_satisfaccion === 'Positivo').length;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Reporte 5: Satisfacción del Cliente</h1>
      <p className="text-gray-600 mb-6">
        Análisis de satisfacción con HAVING, CASE y campos calculados avanzados
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Productos Evaluados"
          value={totalProductos.toString()}
          subtitle={`Con ${minResenas}+ reseñas`}
          color="blue"
        />
        <KpiCard
          title="Calificación Promedio Global"
          value={promedioGeneral}
          subtitle="De todos los productos"
          color="green"
        />
        <KpiCard
          title="Productos Positivos"
          value={productosPositivos.toString()}
          subtitle={`${totalProductos > 0 ? ((productosPositivos / totalProductos) * 100).toFixed(1) : 0}% del total`}
          color="purple"
        />
      </div>

      {/* Filtro */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <form method="get" className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mínimo de Reseñas
            </label>
            <input
              type="number"
              name="minResenas"
              min="1"
              defaultValue={minResenas}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Aplicar
          </button>
          <a
            href="/reports/5"
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Limpiar
          </a>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Análisis de Satisfacción por Producto</h2>
          <p className="text-sm text-gray-500 mt-1">
            Productos con mínimo {minResenas} reseñas - Filtrado con HAVING
          </p>
        </div>

        <DataTable
          data={data}
          columns={[
            { key: 'producto', header: 'Producto', width: 'w-1/4' },
            { key: 'categoria', header: 'Categoría' },
            { 
              key: 'total_reseñas', 
              header: 'Reseñas',
              format: (val: any) => val !== null && val !== undefined ? Number(val).toString() : '0'
            },
            { 
              key: 'calificacion_promedio', 
              header: 'Calificación',
              format: (val: any) => val !== null && val !== undefined ? `⭐ ${parseFloat(val).toFixed(2)}` : 'N/A'
            },
            { 
              key: 'porcentaje_satisfaccion', 
              header: '% Satisfacción',
              format: (val: any) => val !== null && val !== undefined ? `${parseFloat(val).toFixed(1)}%` : 'N/A'
            },
            {
              key: 'nivel_satisfaccion',
              header: 'Nivel',
              format: (val: any) => {
                const badges: Record<string, string> = {
                  'Positivo': '✅ Positivo',
                  'Neutral': '⚠️ Neutral',
                  'Negativo': '❌ Negativo'
                };
                return badges[val] || val || 'N/A';
              }
            },
            { 
              key: 'accion_recomendada', 
              header: 'Acción Recomendada',
              width: 'w-1/5'
            },
          ]}
        />
      </div>

      {/* Explicación técnica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">📊 Funciones Usadas</h3>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li><strong>HAVING</strong>: Filtra productos con mínimo 2 comentarios</li>
            <li><strong>COUNT con CASE</strong>: Cuenta reseñas según condición</li>
            <li><strong>CASE anidado</strong>: Clasifica nivel y acción recomendada</li>
            <li><strong>ROUND + AVG</strong>: Calificación promedio redondeada</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🎯 Métricas Calculadas</h3>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li><strong>Porcentaje Satisfacción</strong>: (Calif. {'>'}=4) / Total</li>
            <li><strong>NPS Simplificado</strong>: Promotores - Detractores</li>
            <li><strong>Nivel</strong>: Basado en promedio de calificación</li>
            <li><strong>Acción</strong>: Recomendación según nivel</li>
          </ul>
        </div>
      </div>
    </div>
  );
}