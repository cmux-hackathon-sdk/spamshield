export interface IncidentLocation {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  spoofed?: boolean;
}

export interface IncidentEntities {
  institution: string | null;
  caseId: string | null;
  badge: string | null;
  payment: string;
  callback: string;
}

export interface IncidentCluster {
  count: number;
  type: string;
  region: string;
  period: string;
}

export type ScamType = 'police' | 'bank' | 'tech' | 'delivery' | 'romance' | 'job' | 'unknown';
export type IncidentStatus = 'live' | 'recent';
export type ToastVariant = 'success' | 'warning' | 'danger' | 'default';

export interface Incident {
  id: string;
  caller: string;
  location: IncidentLocation;
  type: ScamType;
  risk: number;
  confidence: number;
  status: IncidentStatus;
  timestamp: number;
  entities: IncidentEntities;
  cluster: IncidentCluster;
  flags: string[];
  leExported: boolean;
  leExportDate: string | null;
  blacklisted: boolean;
}

export interface LayerDefinition {
  id: ScamType;
  label: string;
  color: string;
  enabled: boolean;
}

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface ScamTypeInfo {
  label: string;
  color: string;
  short: string;
}
