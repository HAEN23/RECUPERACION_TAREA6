import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'gray';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function KpiCard({ title, value, subtitle, color = 'blue', trend, trendValue }: KpiCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]} shadow-sm`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</h3>
          <p className="text-3xl font-bold my-2">{value}</p>
          {subtitle && <p className="text-sm opacity-70">{subtitle}</p>}
        </div>
        {trend && trendValue && (
          <div className={`flex items-center space-x-1 font-semibold ${trendColors[trend]}`}>
            <span>{trendIcons[trend]}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}