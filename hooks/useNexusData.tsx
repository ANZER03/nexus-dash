import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { NexusWsClient } from '../services/wsClient';
import type {
  Metrics,
  DataPoint,
  Activity,
  RegionMetric,
  DataFlow,
  AlertsPayload,
  PlatformEntry,
  HealthStatus,
  GeoHeader,
  ConnectionStatus,
} from '../types';

// ── Default values (shown while WS snapshot is in flight) ───────────────────

const DEFAULT_METRICS: Metrics = {
  activeUsers: 0,
  activeUsersTrend: 0,
  revenue: 0,
  revenueTrend: 0,
  orders: 0,
  ordersTrend: 0,
  errorRate: 0,
  errorRateTrend: 0,
  latency: 0,
  latencyTrend: 0,
  updatedAt: 0,
};

const DEFAULT_ALERTS: AlertsPayload = {
  rules: [],
  summary: {
    criticalCount: 0,
    warningCount: 0,
    healthyCount: 0,
    criticalImpact: '',
    updatedAt: 0,
  },
};

const DEFAULT_HEALTH: HealthStatus = {
  cpu: 0,
  memory: 0,
  apiClusterStatus: 'UNKNOWN',
  apiClusterScore: 0,
  updatedAt: 0,
};

const DEFAULT_GEO: GeoHeader = {
  uptime: 0,
  globalLoad: '0 B/S',
  globalLoadBytes: 0,
  engineVersion: 'V4-Orbit',
  protocolStatus: 'Unknown',
  updatedAt: 0,
};

// ── Context shape ────────────────────────────────────────────────────────────

interface NexusDataContextValue {
  metrics: Metrics;
  traffic: DataPoint[];
  activities: Activity[];
  regions: RegionMetric[];
  flows: DataFlow[];
  alerts: AlertsPayload;
  platform: PlatformEntry[];
  platformReceived: boolean;
  health: HealthStatus;
  geo: GeoHeader;
  connectionStatus: ConnectionStatus;
}

const NexusDataContext = createContext<NexusDataContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

interface NexusDataProviderProps {
  wsUrl: string;
  children: React.ReactNode;
}

export const NexusDataProvider: React.FC<NexusDataProviderProps> = ({ wsUrl, children }) => {
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS);
  const [traffic, setTraffic] = useState<DataPoint[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [regions, setRegions] = useState<RegionMetric[]>([]);
  const [flows, setFlows] = useState<DataFlow[]>([]);
  const [alerts, setAlerts] = useState<AlertsPayload>(DEFAULT_ALERTS);
  const [platform, setPlatform] = useState<PlatformEntry[]>([]);
  const [platformReceived, setPlatformReceived] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthStatus>(DEFAULT_HEALTH);
  const [geo, setGeo] = useState<GeoHeader>(DEFAULT_GEO);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  // Keep client in a ref so it survives renders without triggering effects
  const clientRef = useRef<NexusWsClient | null>(null);

  useEffect(() => {
    const client = new NexusWsClient(wsUrl);
    clientRef.current = client;

    // Connection status
    client.onConnectionChange(setConnectionStatus);

    // 9 event handlers
    client.on('metrics', setMetrics);

    client.on('traffic', (data) => {
      // API sends oldest-first; keep as-is (AreaChart reads left→right)
      setTraffic(data);
    });

    client.on('activity', (data) => {
      // API sends newest-first (up to 15); take top 10 for the feed
      setActivities(data.slice(0, 10));
    });

    client.on('regions', setRegions);
    client.on('flows', setFlows);
    client.on('alert', setAlerts);
    client.on('platform', (data) => {
      setPlatform(data);
      setPlatformReceived(true);
    });
    client.on('health', setHealth);
    client.on('geo', setGeo);

    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [wsUrl]);

  const value: NexusDataContextValue = {
    metrics,
    traffic,
    activities,
    regions,
    flows,
    alerts,
    platform,
    platformReceived,
    health,
    geo,
    connectionStatus,
  };

  return (
    <NexusDataContext.Provider value={value}>
      {children}
    </NexusDataContext.Provider>
  );
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNexusData(): NexusDataContextValue {
  const ctx = useContext(NexusDataContext);
  if (!ctx) {
    throw new Error('useNexusData must be used inside <NexusDataProvider>');
  }
  return ctx;
}
