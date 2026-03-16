
import React, { useEffect, useMemo, useState } from 'react';
import { 
  Globe, 
  Crosshair,
  ShieldCheck,
  Activity as ActivityIcon,
} from 'lucide-react';
import WorldMap from './WorldMap';
import { useNexusData } from '../hooks/useNexusData';

const GeoMonitoringView: React.FC = () => {
  const { regions, activities, geo, flows } = useNexusData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  const filteredRegions = useMemo(() => {
    return regions
      .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.sales - a.sales);
  }, [regions, searchQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateLayout = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(event.matches);
    };

    updateLayout(mediaQuery);
    const listener = (event: MediaQueryListEvent) => updateLayout(event);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const mapCanvas = (
    <div className="relative h-full">
      <WorldMap
        regions={regions}
        flows={flows}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
      />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0b0c10] overflow-hidden select-none">
      {/* Dark Command Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-[#2c3235] bg-black/40 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/5 rounded border border-blue-500/20 flex items-center justify-center relative overflow-hidden shrink-0">
            <Globe size={20} className="text-blue-400 relative z-10 sm:hidden" />
            <Globe size={24} className="text-blue-400 relative z-10 hidden sm:block" />
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-black leading-none tracking-tight text-white uppercase italic truncate">Nexus Global Terminal</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-[8px] sm:text-[9px] text-green-500 font-black uppercase">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                Engine {geo.engineVersion}
              </span>
              <span className="text-[9px] text-gray-700 hidden sm:inline">|</span>
              <span className="text-[9px] text-gray-500 font-mono tracking-widest hidden sm:inline">COORD_LOCK: 04.22</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Uptime</span>
            <span className="text-sm font-bold text-blue-400 font-mono">
              {geo.uptime > 0 ? `${geo.uptime.toFixed(3)}%` : '–'}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Global Load</span>
            <span className="text-sm font-bold text-orange-400 font-mono">
              {geo.globalLoad || '–'}
            </span>
          </div>
          <div className="w-px h-8 bg-[#2c3235]"></div>
          <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded border border-blue-500/20">
             <ShieldCheck size={14} className="text-blue-500" />
             <span className="text-[10px] font-black text-blue-400 uppercase italic">Protocol {geo.protocolStatus}</span>
          </div>
        </div>
      </div>

      {/* Mobile: scrollable vertical stack. Desktop: side-by-side grid */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Desktop layout */}
        {isDesktop ? (
        <div className="grid grid-cols-12 gap-0 h-full relative">
          {/* Left HUD Panel */}
          <div className="col-span-3 flex flex-col border-r border-[#2c3235] bg-black/20 z-10">
            <div className="p-4 bg-white/5 border-b border-[#2c3235] flex items-center gap-2">
              <Crosshair size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Monitoring</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {filteredRegions.length === 0 ? (
                <div className="text-[10px] text-gray-600 text-center py-4">Awaiting data...</div>
              ) : filteredRegions.map((region) => (
                <div 
                  key={region.name} 
                  className={`p-3 border transition-all cursor-pointer ${selectedRegion === region.name ? 'border-blue-500 bg-blue-500/5' : 'border-[#2c3235] bg-[#111217] hover:border-gray-600'}`}
                  onClick={() => setSelectedRegion(region.name)}
                >
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-600 uppercase">{region.name}</span>
                        <span className="text-sm font-bold text-white">${Math.round(region.sales).toLocaleString()}</span>
                     </div>
                     <span className={`text-[10px] font-mono ${region.intensity > 85 ? 'text-red-500' : 'text-blue-500'}`}>
                        {region.intensity.toFixed(1)}%
                     </span>
                  </div>
                  <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-1000 ${region.intensity > 85 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${region.intensity}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Centerpiece 3D Globe */}
           <div className="col-span-6 flex flex-col relative">{mapCanvas}</div>

          {/* Right Event Log Panel */}
          <div className="col-span-3 flex flex-col border-l border-[#2c3235] bg-black/20 z-10">
             <div className="p-4 bg-white/5 border-b border-[#2c3235] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ActivityIcon size={14} className="text-orange-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stream Log</h3>
                </div>
                <span className="text-[9px] font-mono text-gray-600">RT-SYNC_A</span>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {activities.length === 0 ? (
                  <div className="text-[10px] text-gray-600 text-center py-4">Awaiting events...</div>
                ) : activities.map((act) => (
                  <div key={act.id} className="group border-l border-[#2c3235] pl-4 relative hover:border-blue-500 transition-colors">
                     <div className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-[#1c1e23] border border-[#2c3235] group-hover:bg-blue-500 transition-colors"></div>
                     <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{act.location}</span>
                        <span className="text-[8px] font-mono text-gray-700">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                     <p className="text-[11px] text-gray-300 mt-1">
                        <span className="font-bold">{act.user}</span> triggered <span className="text-orange-400 font-bold uppercase">{act.action}</span>
                     </p>
                  </div>
                ))}
             </div>
          </div>
        </div>
        ) : (
        <div className="h-full overflow-y-auto">
          {/* Globe section */}
          <div className="relative" style={{ height: '50vh', minHeight: '280px', maxHeight: '400px' }}>
            {mapCanvas}
          </div>

          {/* Node Monitoring - horizontal scroll cards on mobile */}
          <div className="border-t border-[#2c3235] bg-black/20">
            <div className="p-3 bg-white/5 border-b border-[#2c3235] flex items-center gap-2">
              <Crosshair size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Monitoring</h3>
            </div>
            <div className="flex overflow-x-auto gap-2 p-3 custom-scrollbar">
              {filteredRegions.map((region) => (
                <div 
                  key={region.name} 
                  className={`p-3 border transition-all cursor-pointer shrink-0 w-[180px] ${selectedRegion === region.name ? 'border-blue-500 bg-blue-500/5' : 'border-[#2c3235] bg-[#111217]'}`}
                  onClick={() => setSelectedRegion(region.name)}
                >
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-600 uppercase">{region.name}</span>
                        <span className="text-sm font-bold text-white">${Math.round(region.sales).toLocaleString()}</span>
                     </div>
                     <span className={`text-[10px] font-mono ${region.intensity > 85 ? 'text-red-500' : 'text-blue-500'}`}>
                        {region.intensity.toFixed(1)}%
                     </span>
                  </div>
                  <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-1000 ${region.intensity > 85 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${region.intensity}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event Stream */}
          <div className="border-t border-[#2c3235] bg-black/20">
             <div className="p-3 bg-white/5 border-b border-[#2c3235] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ActivityIcon size={14} className="text-orange-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stream Log</h3>
                </div>
                <span className="text-[9px] font-mono text-gray-600">RT-SYNC_A</span>
             </div>
             <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {activities.map((act) => (
                  <div key={act.id} className="group border-l border-[#2c3235] pl-3 relative">
                     <div className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-[#1c1e23] border border-[#2c3235]"></div>
                     <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{act.location}</span>
                        <span className="text-[8px] font-mono text-gray-700">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                     <p className="text-[11px] text-gray-300 mt-1">
                        <span className="font-bold">{act.user}</span> triggered <span className="text-orange-400 font-bold uppercase">{act.action}</span>
                     </p>
                  </div>
                ))}
             </div>
          </div>
        </div>
        )}
      </div>
      
      {/* Custom Global Scrollbar Style */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2c3235; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>
    </div>
  );
};

export default GeoMonitoringView;
