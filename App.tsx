
import React, { useState } from 'react';
import { 
  Activity as ActivityIcon, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  Globe, 
  Cpu, 
  Layout, 
  Settings, 
  Bell, 
  Clock,
  Search,
  Menu,
  ChevronDown,
  LineChart as LineChartIcon,
  ShieldAlert,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Panel from './components/Panel';
import KpiCard from './components/KpiCard';
import WorldMap from './components/WorldMap';
import AlertsView from './components/AlertsView';
import GeoMonitoringView from './components/GeoMonitoringView';
import { useNexusData } from './hooks/useNexusData';
import type { ConnectionStatus } from './types';

const COLORS = ['#5e5ce6', '#32d74b', '#ff9f0a', '#ff453a', '#64d2ff', '#bf5af2'];

// ── Connection status badge ──────────────────────────────────────────────────
const ConnectionBadge: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const configs: Record<ConnectionStatus, { dot: string; label: string; text: string }> = {
    connected:    { dot: 'bg-green-500 animate-pulse', label: 'LIVE',         text: 'text-green-400' },
    connecting:   { dot: 'bg-yellow-500 animate-pulse', label: 'CONNECTING',  text: 'text-yellow-400' },
    reconnecting: { dot: 'bg-yellow-500 animate-ping',  label: 'RECONNECTING',text: 'text-yellow-400' },
    disconnected: { dot: 'bg-red-500',                  label: 'OFFLINE',     text: 'text-red-400' },
  };
  const { dot, label, text } = configs[status];
  return (
    <div className={`hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase ${text}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerting' | 'geo' | 'explore'>('dashboard');

  const { metrics, traffic, activities, platform, platformReceived, health, regions, flows, connectionStatus } = useNexusData();

  return (
    <div className="flex h-screen bg-[#0b0c10] text-[#d8d9da] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-12 sm:w-16 md:w-52 bg-[#111217] border-r border-[#2c3235] flex flex-col shrink-0 z-50">
        <div className="p-2 sm:p-4 border-b border-[#2c3235] flex items-center gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)] shrink-0">
            <ActivityIcon size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg hidden md:block tracking-tighter text-white">NEXUS <span className="text-[10px] text-orange-500 align-top ml-0.5">PRO</span></span>
        </div>
        
        <nav className="flex-1 py-2 sm:py-4">
          <ul className="space-y-1 px-1 sm:px-2">
            {[
              { id: 'dashboard', icon: Layout, label: 'Dashboards' },
              { id: 'geo', icon: Globe, label: 'Geo Monitor' },
              { id: 'explore', icon: Search, label: 'Explore' },
              { id: 'alerting', icon: Bell, label: 'Alerting' },
            ].map((tab) => (
              <li key={tab.id}>
                <button 
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-center sm:justify-start gap-3 p-2 sm:p-2.5 rounded transition-all duration-200 group relative ${
                    activeTab === tab.id 
                      ? 'bg-[#1c1e23] text-orange-400 border-l-2 border-orange-400 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' 
                      : 'hover:bg-[#1c1e23] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <tab.icon size={18} className={`shrink-0 ${activeTab === tab.id ? 'text-orange-400' : 'group-hover:text-gray-300'}`} />
                  <span className="text-sm font-semibold hidden md:block">{tab.label}</span>
                  {activeTab === tab.id && <div className="absolute right-2 w-1.5 h-1.5 bg-orange-400 rounded-full hidden md:block animate-pulse"></div>}
                </button>
              </li>
            ))}
            
            <div className="my-4 border-t border-[#2c3235] mx-1 sm:mx-2"></div>
            
            {[
              { icon: Cpu, label: 'Inventory' },
              { icon: Settings, label: 'Configuration' },
            ].map((item, idx) => (
              <li key={idx}>
                <button className="w-full flex items-center justify-center sm:justify-start gap-3 p-2 sm:p-2.5 rounded transition-colors text-gray-500 hover:text-gray-300 hover:bg-[#1c1e23]">
                  <item.icon size={18} className="shrink-0" />
                  <span className="text-sm font-semibold hidden md:block">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-2 sm:p-4 border-t border-[#2c3235] bg-[#0b0c10]/40">
          <div className="flex items-center justify-center sm:justify-start gap-3 text-gray-400 hover:text-white cursor-pointer group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-[10px] sm:text-xs font-bold ring-2 ring-transparent group-hover:ring-orange-500/50 transition-all shrink-0">JD</div>
            <div className="flex-col hidden md:flex">
              <span className="text-xs font-bold leading-none">John Doe</span>
              <span className="text-[9px] text-gray-600 uppercase mt-0.5">Admin Role</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b0c10]">
        {/* Header */}
        <header className="h-12 bg-[#111217] border-b border-[#2c3235] flex items-center justify-between px-2 sm:px-4 z-20 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Menu className="sm:hidden cursor-pointer shrink-0" size={20} />
            <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
              <span className="hover:text-gray-300 cursor-pointer hidden sm:inline">Home</span>
              <span className="text-[#2c3235] hidden sm:inline">/</span>
              <span className="text-gray-200 font-bold uppercase tracking-tight truncate">
                {activeTab === 'dashboard' ? 'Overview' : activeTab === 'geo' ? 'Geo Monitor' : activeTab === 'explore' ? 'Explorer' : 'Alerting'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ConnectionBadge status={connectionStatus} />
            <div className="hidden sm:flex items-center bg-[#181b1f] border border-[#2c3235] rounded-sm px-3 py-1.5 gap-2 cursor-pointer hover:bg-[#2c3235] transition-colors">
              <Clock size={14} className="text-gray-500" />
              <span className="text-[11px] font-bold text-gray-300">Last 1h</span>
              <ChevronDown size={14} className="text-gray-500" />
            </div>
            <button className="bg-[#181b1f] border border-[#2c3235] p-1.5 rounded-sm hover:text-orange-400 transition-colors">
              <Search size={16} />
            </button>
            <div className="w-px h-6 bg-[#2c3235] hidden sm:block"></div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-sm shadow-lg shadow-orange-500/20">
              <Clock size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Route Switching */}
        <main className="flex-1 overflow-hidden relative min-h-0">
          {activeTab === 'dashboard' && (
            <div className="h-full overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
              {/* KPI Section */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                <div className="bg-[#181b1f] border border-[#2c3235] p-2.5 sm:p-4 rounded-sm flex items-center gap-2 sm:gap-4 hover:border-blue-500/30 transition-all min-w-0 overflow-hidden">
                  <div className="p-1.5 sm:p-2.5 bg-blue-500/10 rounded-sm shrink-0">
                    <Users className="text-blue-500" size={18} />
                  </div>
                  <KpiCard label="Live Visitors" value={metrics.activeUsers.toLocaleString()} trend={metrics.activeUsersTrend} />
                </div>
                <div className="bg-[#181b1f] border border-[#2c3235] p-2.5 sm:p-4 rounded-sm flex items-center gap-2 sm:gap-4 hover:border-green-500/30 transition-all min-w-0 overflow-hidden">
                  <div className="p-1.5 sm:p-2.5 bg-green-500/10 rounded-sm shrink-0">
                    <DollarSign className="text-green-500" size={18} />
                  </div>
                  <KpiCard label="Revenue" value={`$${(metrics.revenue / 1000).toFixed(1)}k`} trend={metrics.revenueTrend} color="text-green-400" />
                </div>
                <div className="bg-[#181b1f] border border-[#2c3235] p-2.5 sm:p-4 rounded-sm flex items-center gap-2 sm:gap-4 min-w-0 overflow-hidden">
                  <div className="p-1.5 sm:p-2.5 bg-purple-500/10 rounded-sm shrink-0">
                    <ShoppingCart className="text-purple-500" size={18} />
                  </div>
                  <KpiCard label="Orders" value={metrics.orders} trend={metrics.ordersTrend} color="text-purple-400" />
                </div>
                <div className="bg-[#181b1f] border border-[#2c3235] p-2.5 sm:p-4 rounded-sm flex items-center gap-2 sm:gap-4 min-w-0 overflow-hidden">
                  <div className="p-1.5 sm:p-2.5 bg-red-500/10 rounded-sm shrink-0">
                    <AlertTriangle className="text-red-500" size={18} />
                  </div>
                  <KpiCard label="Errors" value={`${metrics.errorRate.toFixed(2)}%`} trend={metrics.errorRateTrend} color="text-red-400" />
                </div>
                <div className="bg-[#181b1f] border border-[#2c3235] p-2.5 sm:p-4 rounded-sm flex items-center gap-2 sm:gap-4 col-span-2 sm:col-span-1 min-w-0 overflow-hidden">
                  <div className="p-1.5 sm:p-2.5 bg-yellow-500/10 rounded-sm shrink-0">
                    <Clock className="text-yellow-500" size={18} />
                  </div>
                  <KpiCard label="Latency" value={metrics.latency} unit="ms" trend={metrics.latencyTrend} color="text-yellow-400" />
                </div>
              </div>

              {/* Main Visuals Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
                <Panel title="Traffic Throughput" className="lg:col-span-2 min-h-[250px] sm:min-h-[350px]" icon={<ActivityIcon size={14} />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={traffic}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5e5ce6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#5e5ce6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2c3235" />
                      <XAxis dataKey="label" stroke="#4a4f5b" fontSize={9} tickLine={false} axisLine={false} minTickGap={30} />
                      <YAxis stroke="#4a4f5b" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#111217', border: '1px solid #2c3235', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="value" stroke="#5e5ce6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Panel>
                
                <Panel title="Regional Distribution" className="min-h-[280px] sm:min-h-[350px]" icon={<Globe size={14} />}>
                  <WorldMap regions={regions} flows={flows} />
                </Panel>
              </div>

              {/* Activity & Platform Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <Panel title="Real-time Events" className="lg:col-span-2" icon={<Clock size={14} />}>
                  <div className="space-y-3 overflow-y-auto max-h-[200px] sm:max-h-[250px] pr-2 custom-scrollbar">
                    {activities.length === 0 ? (
                      <div className="text-[10px] text-gray-600 text-center py-4">Waiting for events...</div>
                    ) : activities.map((act) => (
                      <div key={act.id} className="flex items-center justify-between border-b border-[#2c3235] pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${act.action === 'purchase' ? 'bg-green-500' : act.action === 'cart' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-200">{act.user} <span className="font-normal text-gray-500">{act.action}d</span></span>
                            <span className="text-[10px] text-gray-500 font-medium">{act.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {act.amount != null && <div className="text-[11px] font-bold text-green-400">+${act.amount}</div>}
                          <div className="text-[9px] text-gray-600 italic">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="Device Platform" icon={<Cpu size={14} />}>
                  {!platformReceived ? (
                    <div className="text-[10px] text-gray-600 text-center py-8">Loading...</div>
                  ) : platform.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={platform} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={5} dataKey="value">
                            {platform.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#111217', border: 'none', fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {platform.map((p, i) => (
                          <div key={p.name} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-gray-600 text-center py-8">No data yet</div>
                  )}
                </Panel>

                <Panel title="Health Check" icon={<ShieldAlert size={14} />}>
                  <div className="flex flex-col justify-center h-full gap-4">
                    <div className="flex flex-col">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1 uppercase">
                        <span>CPU Utilization</span>
                        <span className="text-gray-300">{health.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="h-1 bg-[#111217] rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, health.cpu)}%` }}></div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1 uppercase">
                        <span>Memory Load</span>
                        <span className="text-gray-300">{health.memory.toFixed(1)}%</span>
                      </div>
                      <div className="h-1 bg-[#111217] rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, health.memory)}%` }}></div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1 uppercase">
                        <span>API Cluster</span>
                        <span className={health.apiClusterStatus === 'HEALTHY' ? 'text-green-500' : 'text-red-400'}>{health.apiClusterStatus}</span>
                      </div>
                      <div className="h-1 bg-[#111217] rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, health.apiClusterScore)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {activeTab === 'geo' && <GeoMonitoringView />}
          {activeTab === 'alerting' && <AlertsView />}
          
          {activeTab === 'explore' && (
            <div className="h-full bg-[#0b0c10] p-4 flex flex-col items-center justify-center">
              <div className="max-w-md text-center">
                <LineChartIcon size={48} className="mx-auto text-gray-700 mb-4" />
                <h3 className="text-lg font-bold text-gray-300">Data Explorer / Tableau Style</h3>
                <p className="text-xs text-gray-500 mt-2">Advanced ad-hoc analytics and multi-dimensional filtering module is currently initializing in the background.</p>
                <div className="mt-6 flex justify-center gap-2">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2c3235; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>
    </div>
  );
};

export default App;
