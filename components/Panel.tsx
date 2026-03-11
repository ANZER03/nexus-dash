
import React from 'react';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ title, children, className = '', icon }) => {
  return (
    <div className={`bg-[#181b1f] border border-[#2c3235] rounded shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="px-4 py-2 border-b border-[#2c3235] flex items-center justify-between bg-[#111217]">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-600"></div>
          <div className="w-2 h-2 rounded-full bg-gray-600"></div>
        </div>
      </div>
      <div className="flex-1 p-4 relative min-h-0">
        {children}
      </div>
    </div>
  );
};

export default Panel;
