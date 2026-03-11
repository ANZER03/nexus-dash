
export interface DataPoint {
  timestamp: number;
  value: number;
  label: string;
}

export interface Activity {
  id: string;
  user: string;
  action: 'purchase' | 'view' | 'cart' | 'login';
  amount?: number | null;
  timestamp: string; // ISO 8601 string from API
  location: string;
}

export interface Metrics {
  activeUsers: number;
  activeUsersTrend: number;
  revenue: number;
  revenueTrend: number;
  orders: number;
  ordersTrend: number;
  errorRate: number;
  errorRateTrend: number;
  latency: number;
  latencyTrend: number;
  updatedAt: number;
}

export interface RegionMetric {
  name: string;
  coords: [number, number]; // [Longitude, Latitude]
  intensity: number;
  sales: number;
}

export interface DataFlow {
  id: string;
  source: [number, number];
  target: [number, number];
  value: number;
}

export type AlertStatus = 'firing' | 'pending' | 'ok';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertRule {
  id: string;
  name: string;
  status: AlertStatus;
  severity: AlertSeverity;
  metric: string;
  currentValue: number;
  threshold: number;
  lastEvaluated: number | string;
  updatedAt: number;
  frequency: string;
}

export interface AlertSummary {
  criticalCount: number;
  warningCount: number;
  healthyCount: number;
  criticalImpact: string;
  updatedAt: number;
}

export interface AlertsPayload {
  rules: AlertRule[];
  summary: AlertSummary;
}

export interface PlatformEntry {
  name: string;
  value: number;
}

export interface HealthStatus {
  cpu: number;
  memory: number;
  apiClusterStatus: string;
  apiClusterScore: number;
  updatedAt: number;
}

export interface GeoHeader {
  uptime: number;
  globalLoad: string;
  globalLoadBytes: number;
  engineVersion: string;
  protocolStatus: string;
  updatedAt: number;
}

// WebSocket typed event map
export interface WsEventMap {
  metrics: Metrics;
  traffic: DataPoint[];
  activity: Activity[];
  regions: RegionMetric[];
  flows: DataFlow[];
  alert: AlertsPayload;
  platform: PlatformEntry[];
  health: HealthStatus;
  geo: GeoHeader;
}

export type WsEventName = keyof WsEventMap;

export interface WsMessage<E extends WsEventName = WsEventName> {
  event: E;
  data: WsEventMap[E];
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
