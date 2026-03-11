
import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: number;
  unit?: string;
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, trend, unit = '', color = 'text-blue-400' }) => {
  return (
    <div className="flex flex-col min-w-0 overflow-hidden">
      <span className="text-[9px] sm:text-[10px] font-medium text-gray-500 uppercase tracking-widest truncate">{label}</span>
      <div className="flex items-baseline gap-1 mt-1 min-w-0">
        <span className={`text-lg sm:text-2xl font-bold ${color} truncate`}>{value}</span>
        <span className="text-[10px] sm:text-xs font-medium text-gray-500 shrink-0">{unit}</span>
      </div>
      {trend !== undefined && (
        <div className={`text-[9px] sm:text-[10px] mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% <span className="text-gray-600 hidden sm:inline">vs last hour</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
