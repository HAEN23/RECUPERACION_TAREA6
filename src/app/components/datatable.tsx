import React from 'react';

// 1. Definir los tipos para las nuevas propiedades
type BadgeColors = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

interface Column {
  key: string;
  header: string;
  width?: string;
  format?: (value: any) => React.ReactNode; // Permitir que devuelva JSX
  color?: (value: any) => string; // Función para color de texto dinámico
  badge?: (value: any) => { text: string; color: BadgeColors }; // Función para badges
}

interface DataTableProps {
  data: any[];
  columns: Column[];
}

// 2. Clases de Tailwind para los colores de los badges
const badgeColorClasses: Record<BadgeColors, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
};

export default function DataTable({ data, columns }: DataTableProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-gray-500 text-center">No hay datos disponibles</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.width || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((col) => {
                const cellValue = row[col.key];
                // 3. Lógica de renderizado dinámico
                let content: React.ReactNode = cellValue;
                if (col.badge) {
                  const { text, color } = col.badge(cellValue);
                  content = (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeColorClasses[color]}`}>
                      {text}
                    </span>
                  );
                } else if (col.format) {
                  content = col.format(cellValue);
                }
                
                const textColor = col.color ? col.color(cellValue) : 'text-gray-900';

                return (
                  <td key={`${rowIndex}-${col.key}`} className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}