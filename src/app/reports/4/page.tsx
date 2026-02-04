import { executeSafeQuery, reportQueries } from '@/app/lib/db';
import DataTable from '@/app/components/datatable';
import KpiCard from '@/app/components/KpiCard';

export default async function Reporte4Page({
  searchParams,
}: {
  searchParams?: { meses?: string };
}) {
  const meses = parseInt(searchParams?.meses || '6');
  
  // Obtener datos de la VIEW 4
  const data = await executeSafeQuery(
    reportQueries.tendenciaMensual,
    [meses]
  );
  
  // Calcular métricas
  const currentMonth = data[0];
  const growth = currentMonth?.crecimiento_ventas_porcentual || 0;
  const avgTicket = currentMonth?.ticket_promedio || 0;
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Reporte 4: Tendencia Mensual de Ventas</h1>
      <p className="text-gray-600 mb-6">
        Análisis temporal usando CTE (WITH) y Window Functions (LAG). Muestra crecimiento mes a mes,
        ticket promedio y otras métricas de tendencia.
      </p>
      
      {/* Filtro de meses */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Período de análisis:
        </label>
        <div className="flex space-x-2">
          {[3, 6, 12].map(num => (
            <a
              key={num}
              href={`/reports/4?meses=${num}`}
              className={`px-4 py-2 rounded ${meses === num ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Últimos {num} meses
            </a>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Ventas Mes Actual"
          value={currentMonth ? `$${parseFloat(currentMonth.ventas_totales).toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : 'N/A'}
          subtitle={currentMonth?.periodo || ''}
          color="orange"
          trend={growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(growth)}%`}
        />
        <KpiCard
          title="Crecimiento vs Mes Anterior"
          value={`${growth > 0 ? '+' : ''}${parseFloat(growth).toFixed(1)}%`}
          subtitle={currentMonth?.tendencia_ventas || ''}
          color={growth > 0 ? 'green' : growth < 0 ? 'red' : 'gray'}
        />
        <KpiCard
          title="Ticket Promedio"
          value={`$${parseFloat(avgTicket).toFixed(2)}`}
          subtitle="Por cliente activo"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Evolución Mensual</h2>
          <p className="text-sm text-gray-500">
            CTE (Common Table Expressions) para preparar datos + Window Function LAG() para comparación temporal
          </p>
        </div>
        
        <DataTable 
          data={data}
          columns={[
            { key: 'periodo', header: 'Período', width: 'w-24' },
            { key: 'ventas_totales', header: 'Ventas', format: (val) => `$${parseFloat(val).toLocaleString('es-ES', { minimumFractionDigits: 2 })}` },
            { key: 'crecimiento_ventas_porcentual', header: 'Crecimiento', format: (val) => val ? `${parseFloat(val) > 0 ? '↑' : '↓'} ${Math.abs(parseFloat(val)).toFixed(1)}%` : 'N/A' },
            { key: 'clientes_unicos', header: 'Clientes', format: (val) => val.toString() },
            { key: 'ticket_promedio', header: 'Ticket Prom.', format: (val) => `$${parseFloat(val).toFixed(2)}` },
            { key: 'unidades_por_orden', header: 'Unid./Orden', format: (val) => parseFloat(val).toFixed(1) },
            { key: 'margen_porcentual', header: 'Margen %', format: (val) => `${parseFloat(val).toFixed(1)}%` },
            { key: 'tendencia_ventas', header: 'Tendencia', width: 'w-32' }
          ]}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-2">📅 Estructura CTE</h3>
          <div className="space-y-2 text-sm text-orange-700">
            <div>
              <code className="font-mono bg-orange-100 px-2 py-1 rounded">WITH ventas_mensuales AS (...)</code>
              <p className="mt-1">Agrupa datos por mes con funciones agregadas</p>
            </div>
            <div>
              <code className="font-mono bg-orange-100 px-2 py-1 rounded">tendencia_calculada AS (...)</code>
              <p className="mt-1">Calcula métricas derivadas y usa LAG()</p>
            </div>
            <div>
              <code className="font-mono bg-orange-100 px-2 py-1 rounded">SELECT * FROM tendencia_calculada</code>
              <p className="mt-1">Consulta final que muestra los resultados</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📊 Window Function LAG()</h3>
          <p className="text-sm text-blue-700 mb-2">
            <strong>LAG(ventas_totales) OVER (ORDER BY mes)</strong> obtiene el valor del mes anterior para calcular crecimiento:
          </p>
          <div className="text-sm bg-blue-100 p-3 rounded">
            <div className="font-mono">Crecimiento = ((mes_actual - mes_anterior) / mes_anterior) * 100</div>
            <div className="mt-2 text-blue-600">
              Donde <em>mes_anterior</em> = LAG(ventas_totales) OVER (ORDER BY mes)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}