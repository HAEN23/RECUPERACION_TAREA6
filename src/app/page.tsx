import Link from 'next/link';

export default function Home() {
  const reportes = [
    {
      id: 1,
      titulo: 'Ventas por Categoría',
      descripcion: 'Análisis de ventas agrupadas por categoría con GROUP BY y HAVING',
      icon: '📈',
      color: 'from-blue-500 to-blue-600',
      tags: ['GROUP BY', 'HAVING', 'SUM', 'COUNT']
    },
    {
      id: 2,
      titulo: 'Análisis de Clientes',
      descripcion: 'Comparativa Premium vs Regular con CASE y COALESCE',
      icon: '👥',
      color: 'from-purple-500 to-purple-600',
      tags: ['CASE', 'COALESCE', 'AVG']
    },
    {
      id: 3,
      titulo: 'Ranking de Productos',
      descripcion: 'Productos más vendidos con Window Functions',
      icon: '🏆',
      color: 'from-yellow-500 to-yellow-600',
      tags: ['RANK()', 'DENSE_RANK()', 'ROW_NUMBER()']
    },
    {
      id: 4,
      titulo: 'Tendencia Mensual',
      descripcion: 'Evolución temporal con CTE y LAG',
      icon: '📊',
      color: 'from-orange-500 to-orange-600',
      tags: ['CTE', 'LAG()', 'Window Functions']
    },
    {
      id: 5,
      titulo: 'Satisfacción del Cliente',
      descripcion: 'Análisis de reseñas con HAVING COUNT',
      icon: '⭐',
      color: 'from-red-500 to-red-600',
      tags: ['HAVING COUNT', 'CASE', 'NPS']
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Dashboard de Reportes SQL
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sistema completo de análisis de datos con PostgreSQL Views avanzadas, 
            implementando GROUP BY, Window Functions, CTEs y más.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-gray-900">5</div>
            <div className="text-sm text-gray-600 mt-1">Reportes SQL</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-gray-900">15+</div>
            <div className="text-sm text-gray-600 mt-1">Funciones SQL Avanzadas</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-gray-900">100%</div>
            <div className="text-sm text-gray-600 mt-1">Dockerizado</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="text-3xl font-bold text-gray-900">Next.js 16</div>
            <div className="text-sm text-gray-600 mt-1">Framework</div>
          </div>
        </div>

        {/* Reportes Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Reportes Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reportes.map((reporte) => (
              <Link
                key={reporte.id}
                href={`/reports/${reporte.id}`}
                className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-500 transform hover:-translate-y-2"
              >
                <div className={`h-2 bg-gradient-to-r ${reporte.color}`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl bg-gray-100 p-3 rounded-lg">{reporte.icon}</div>
                    <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">#{reporte.id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {reporte.titulo}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 h-10">
                    {reporte.descripcion}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {reporte.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Stack Tecnológico</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'Next.js 16', icon: '⚡', desc: 'React Framework' },
              { name: 'PostgreSQL 16', icon: '🐘', desc: 'Base de Datos' },
              { name: 'Docker', icon: '🐳', desc: 'Containerización' },
              { name: 'TypeScript', icon: '📘', desc: 'Type Safety' },
              { name: 'Tailwind CSS', icon: '🎨', desc: 'Estilos' },
              { name: 'Recharts', icon: '📊', desc: 'Gráficos' },
              { name: 'Zod', icon: '✅', desc: 'Validación' },
              { name: 'pg', icon: '🔌', desc: 'PostgreSQL Client' },
            ].map((tech) => (
              <div key={tech.name} className="text-center">
                <div className="text-4xl mb-2">{tech.icon}</div>
                <div className="font-semibold text-gray-900">{tech.name}</div>
                <div className="text-sm text-gray-500 mt-1">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}