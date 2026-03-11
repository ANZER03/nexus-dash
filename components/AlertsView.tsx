
import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus,
  MoreVertical,
  ShieldAlert,
  Info
} from 'lucide-react';
import { AlertRule, AlertStatus, AlertSeverity } from '../types';
import { useNexusData } from '../hooks/useNexusData';

const StatusBadge = ({ status }: { status: AlertStatus }) => {
  const styles = {
    firing: 'bg-red-500/10 text-red-500 border-red-500/20',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    ok: 'bg-green-500/10 text-green-500 border-green-500/20',
  };
  const labels = { firing: 'Firing', pending: 'Pending', ok: 'Normal' };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const SeverityIndicator = ({ severity }: { severity: AlertSeverity }) => {
  const colors = { critical: 'text-red-500', warning: 'text-yellow-500', info: 'text-blue-500' };
  return <div className={`w-1.5 h-1.5 rounded-full ${colors[severity]} bg-current shadow-[0_0_5px_currentColor]`} />;
};

const AlertsView: React.FC = () => {
  const { alerts } = useNexusData();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { rules, summary } = alerts;

  const filteredRules = rules.filter(r =>
    activeFilter === 'all' || r.status === activeFilter
  );

  return (
    <div className="flex flex-col h-full bg-[#0b0c10] text-[#d8d9da]">
      {/* Sub-header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 sm:p-4 border-b border-[#2c3235] bg-[#111217]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-orange-400" />
            <h2 className="text-base sm:text-lg font-bold">Alert Rules</h2>
          </div>
          <div className="flex bg-[#181b1f] rounded p-0.5 border border-[#2c3235]">
            {['all', 'firing', 'pending', 'ok'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2 sm:px-3 py-1 text-[10px] uppercase font-bold rounded transition-colors ${
                  activeFilter === f ? 'bg-[#2c3235] text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold transition-all shadow-lg shadow-orange-500/10 shrink-0">
          <Plus size={14} />
          <span className="hidden sm:inline">New Alert Rule</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-[#181b1f] border-l-4 border-red-500 p-3 sm:p-4 rounded shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Critical Failures</span>
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold mt-1">{summary.criticalCount}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              {summary.criticalImpact || 'No active critical failures'}
            </div>
          </div>
          <div className="bg-[#181b1f] border-l-4 border-yellow-500 p-3 sm:p-4 rounded shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Warnings</span>
              <Clock size={16} className="text-yellow-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold mt-1">{summary.warningCount}</div>
            <div className="text-[10px] text-gray-500 mt-1">Evaluated in last 5 minutes</div>
          </div>
          <div className="bg-[#181b1f] border-l-4 border-green-500 p-3 sm:p-4 rounded shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Healthy Rules</span>
              <CheckCircle size={16} className="text-green-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold mt-1">{summary.healthyCount}</div>
            <div className="text-[10px] text-gray-500 mt-1">All systems operational</div>
          </div>
        </div>

        {/* Rules Table */}
        <div className="bg-[#181b1f] border border-[#2c3235] rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[#111217] text-[10px] uppercase text-gray-500 font-bold border-b border-[#2c3235]">
                  <th className="px-3 sm:px-4 py-3 w-8"></th>
                  <th className="px-3 sm:px-4 py-3">Rule Name</th>
                  <th className="px-3 sm:px-4 py-3">State</th>
                  <th className="px-3 sm:px-4 py-3">Metric</th>
                  <th className="px-3 sm:px-4 py-3 text-right">Value / Threshold</th>
                  <th className="px-3 sm:px-4 py-3">Frequency</th>
                  <th className="px-3 sm:px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2c3235]">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-[10px] text-gray-600 py-8">
                      {rules.length === 0 ? 'Awaiting alert data...' : 'No rules match current filter'}
                    </td>
                  </tr>
                ) : filteredRules.map((rule) => (
                  <tr key={rule.id} className="group hover:bg-[#1c1e23] transition-colors">
                    <td className="px-3 sm:px-4 py-4">
                      <SeverityIndicator severity={rule.severity} />
                    </td>
                    <td className="px-3 sm:px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-200">{rule.name}</span>
                        <span className="text-[10px] text-gray-500">Folder: General Dashboard</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-4">
                      <StatusBadge status={rule.status} />
                    </td>
                    <td className="px-3 sm:px-4 py-4">
                      <code className="text-[10px] bg-[#111217] px-1.5 py-0.5 rounded text-blue-400">{rule.metric}</code>
                    </td>
                    <td className="px-3 sm:px-4 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-bold ${rule.status === 'firing' ? 'text-red-400' : 'text-gray-300'}`}>
                          {typeof rule.currentValue === 'number' ? rule.currentValue.toFixed(2) : rule.currentValue}
                        </span>
                        <span className="text-[10px] text-gray-500">Target: {rule.threshold}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <Clock size={12} />
                        <span>{rule.frequency}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-4 text-gray-600 group-hover:text-gray-400 cursor-pointer">
                      <MoreVertical size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="bg-[#111217] border border-[#2c3235] rounded p-3 sm:p-4">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Info size={14} className="text-gray-500" />
               <h3 className="text-xs font-bold uppercase tracking-wider">Contact Points</h3>
             </div>
             <span className="text-[10px] text-blue-400 cursor-pointer hover:underline hidden sm:inline">Manage notification channels</span>
           </div>
           <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
             <div className="bg-[#181b1f] border border-[#2c3235] px-3 py-2 rounded flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
               <span className="text-xs text-gray-300 font-medium">Slack: #ops-alerts</span>
             </div>
             <div className="bg-[#181b1f] border border-[#2c3235] px-3 py-2 rounded flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
               <span className="text-xs text-gray-300 font-medium">Email: SRE Team</span>
             </div>
             <div className="bg-[#181b1f] border border-[#2c3235] px-3 py-2 rounded flex items-center gap-3 opacity-50">
               <div className="w-2 h-2 rounded-full bg-gray-500 shrink-0"></div>
               <span className="text-xs text-gray-300 font-medium">PagerDuty: Primary</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsView;
