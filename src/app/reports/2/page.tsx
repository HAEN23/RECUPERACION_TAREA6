import { executeSafeQuery, reportQueries } from '@/app/lib/db';
import DataTable from '@/app/components/datatable';
import KpiCard from '@/app/components/KpiCard';

export default async function Reporte2Page() {
  // Obtener datos de la VIEW 2
  const data = await executeSafeQuery(reportQueries.analisisClientes, []);
  
  // Calcular KPIs con validación para undefined
  const rowPremium = data.find(d => d.tipo_cliente === 'Cliente Premium');
  const rowRegular = data.find(d => d.tipo_cliente === 'Cliente Regular');

  const totalPremium = rowPremium ? Number(rowPremium.total_clientes) : 0;
  const totalRegular = rowRegular ? Number(rowRegular.total_clientes) : 0;
  const totalClientes = totalPremium + totalRegular;

  const avgGastoPremium = rowPremium ? Number(rowPremium.gasto_promedio_por_orden) : 0;
  const avgGastoRegular = rowRegular ? Number(rowRegular.gasto_promedio_por_orden) : 0;

  const porcentajePremium = totalClientes > 0 
    ? ((totalPremium / totalClientes) * 100).toFixed(1)
    : '0.0';

  const diferenciaSaldo = avgGastoPremium - avgGastoRegular;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Reporte 2: Análisis de Clientes</h1>
      <p className="text-gray-600 mb-6">
        Segmentación de clientes por comportamiento de compra usando subqueries y agregaciones.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Total Clientes"
          value={totalClientes.toString()}
          subtitle={`${totalPremium} Premium | ${totalRegular} Regular`}
          color="blue"
        />
        <KpiCard
          title="Porcentaje Premium"
          value={`${porcentajePremium}%`}
          subtitle={`${totalPremium} de ${totalClientes} clientes`}
          color="purple"
        />
        <KpiCard
          title="Diferencia Gasto Promedio"
          value={`$${(avgGastoPremium - avgGastoRegular).toFixed(2)}`}
          subtitle="Premium vs Regular"
          color="green"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Análisis por Tipo de Cliente</h2>
        </div>
        
        <DataTable 
          data={data}
          columns={[
            { key: 'tipo_cliente', header: 'Tipo Cliente', width: 'w-1/4' },
            { 
              key: 'total_clientes', 
              header: 'Total Clientes', 
              format: (val: any) => (val || 0).toString() 
            },
            { 
              key: 'promedio_gasto', 
              header: 'Gasto Promedio', 
              format: (val: any) => `$${parseFloat(val || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}` 
            },
            { 
              key: 'ingresos_totales', 
              header: 'Ingresos Totales', 
              format: (val: any) => `$${parseFloat(val || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}` 
            },
          ]}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2"> Subquery Anidada</h3>
          <p className="text-sm text-purple-700">
            Se usa una subquery para calcular primero el total gastado por cada usuario,
            y luego se agrupa por tipo de cliente en la consulta externa.
          </p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2"> Segmentación con CASE</h3>
          <p className="text-sm text-blue-700">
            La expresión CASE evalúa el número de órdenes (COUNT) para clasificar automáticamente
            a los clientes como Premium ({'>'}=5 órdenes) o Regular.
          </p>
        </div>
      </div>
    </div>
  );
}