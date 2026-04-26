import type { Incident, LayerDefinition, ScamType, ScamTypeInfo } from './types';

export const SCAM_TYPES: Record<ScamType, ScamTypeInfo> = {
  police:   { label: 'Police Impersonation', color: '#ef4444', short: 'POLICE' },
  bank:     { label: 'Bank / Payment Fraud',  color: '#f97316', short: 'BANK' },
  tech:     { label: 'Tech Support Scam',     color: '#eab308', short: 'TECH' },
  delivery: { label: 'Delivery Scam',         color: '#3b82f6', short: 'DELIVERY' },
  romance:  { label: 'Romance Scam',          color: '#ec4899', short: 'ROMANCE' },
  job:      { label: 'Job Scam',              color: '#8b5cf6', short: 'JOB' },
  unknown:  { label: 'Unknown',               color: '#64748b', short: 'UNKNOWN' },
};

export const LAYER_DEFINITIONS: LayerDefinition[] = [
  { id: 'police',   label: 'Police Impersonation', color: '#ef4444', enabled: true },
  { id: 'bank',     label: 'Bank / Payment Fraud',  color: '#f97316', enabled: true },
  { id: 'tech',     label: 'Tech Support Scam',     color: '#eab308', enabled: true },
  { id: 'delivery', label: 'Delivery Scam',         color: '#3b82f6', enabled: true },
  { id: 'romance',  label: 'Romance Scam',           color: '#ec4899', enabled: true },
  { id: 'job',      label: 'Job Scam',              color: '#8b5cf6', enabled: false },
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: '1a2b3c4d',
    caller: '+234 567 890 123',
    location: { city: 'Lagos', country: 'Nigeria', countryCode: 'NG', lat: 6.5, lng: 3.4 },
    type: 'police', risk: 87, confidence: 92, status: 'live',
    timestamp: Date.now() - 2 * 60 * 1000,
    entities: { institution: 'Lagos Police Department', caseId: 'LP-2025-4521', badge: 'Officer Johnson (unverified)', payment: 'Gift card', callback: '+234 XXX XXXX 8' },
    cluster: { count: 14, type: 'Police impersonation', region: 'Lagos, Nigeria', period: '30 days' },
    flags: ['urgency', 'impersonation', 'money'], leExported: true, leExportDate: '2025-01-15 09:43', blacklisted: false,
  },
  {
    id: '2c3d4e5f',
    caller: '+91 9812 345 678',
    location: { city: 'Mumbai', country: 'India', countryCode: 'IN', lat: 19.0, lng: 72.8 },
    type: 'bank', risk: 76, confidence: 88, status: 'recent',
    timestamp: Date.now() - 5 * 60 * 1000,
    entities: { institution: 'State Bank of India', caseId: 'SBI-2025-783', badge: null, payment: 'Wire transfer', callback: '+91 XXX XXX 4' },
    cluster: { count: 9, type: 'Bank / Payment Fraud', region: 'Mumbai, India', period: '14 days' },
    flags: ['urgency', 'money'], leExported: false, leExportDate: null, blacklisted: false,
  },
  {
    id: '3e4f5a6b',
    caller: '+55 11 9234 5678',
    location: { city: 'São Paulo', country: 'Brazil', countryCode: 'BR', lat: -23.5, lng: -46.6 },
    type: 'tech', risk: 64, confidence: 79, status: 'recent',
    timestamp: Date.now() - 8 * 60 * 1000,
    entities: { institution: 'Microsoft Support (fake)', caseId: 'MS-FAKE-2025', badge: null, payment: 'Gift card', callback: '+55 XXX XXX 9' },
    cluster: { count: 6, type: 'Tech Support Scam', region: 'South America', period: '7 days' },
    flags: ['impersonation', 'money'], leExported: false, leExportDate: null, blacklisted: false,
  },
  {
    id: '4a5b6c7d',
    caller: '+63 917 234 5678',
    location: { city: 'Manila', country: 'Philippines', countryCode: 'PH', lat: 14.6, lng: 121.0 },
    type: 'delivery', risk: 54, confidence: 71, status: 'recent',
    timestamp: Date.now() - 9 * 60 * 1000,
    entities: { institution: 'DHL Philippines (fake)', caseId: 'DHL-FAKE-447', badge: null, payment: 'Processing fee', callback: '+63 XXX XXX 2' },
    cluster: { count: 4, type: 'Delivery Scam', region: 'Southeast Asia', period: '7 days' },
    flags: ['urgency'], leExported: false, leExportDate: null, blacklisted: false,
  },
  {
    id: '5b6c7d8e',
    caller: '+233 20 123 4567',
    location: { city: 'Accra', country: 'Ghana', countryCode: 'GH', lat: 5.6, lng: -0.2 },
    type: 'police', risk: 81, confidence: 85, status: 'live',
    timestamp: Date.now() - 3 * 60 * 1000,
    entities: { institution: 'Ghana Police Service', caseId: 'GPS-2025-119', badge: 'Inspector Mensah (unverified)', payment: 'Mobile money', callback: '+233 XXX XXX 1' },
    cluster: { count: 7, type: 'Police impersonation', region: 'West Africa', period: '14 days' },
    flags: ['urgency', 'impersonation', 'money'], leExported: true, leExportDate: '2025-01-14 14:22', blacklisted: false,
  },
  {
    id: '6c7d8e9f',
    caller: '+254 712 345 678',
    location: { city: 'Nairobi', country: 'Kenya', countryCode: 'KE', lat: -1.3, lng: 36.8 },
    type: 'romance', risk: 62, confidence: 74, status: 'recent',
    timestamp: Date.now() - 22 * 60 * 1000,
    entities: { institution: null, caseId: null, badge: null, payment: 'Wire transfer', callback: '+254 XXX XXX 5' },
    cluster: { count: 3, type: 'Romance Scam', region: 'East Africa', period: '30 days' },
    flags: ['money'], leExported: false, leExportDate: null, blacklisted: false,
  },
  {
    id: '7d8e9f0a',
    caller: '+91 9934 567 890',
    location: { city: 'Delhi', country: 'India', countryCode: 'IN', lat: 28.6, lng: 77.2 },
    type: 'tech', risk: 79, confidence: 91, status: 'live',
    timestamp: Date.now() - 1 * 60 * 1000,
    entities: { institution: 'Windows Security (fake)', caseId: null, badge: null, payment: 'Remote access + gift card', callback: '+1 XXX XXX 3' },
    cluster: { count: 21, type: 'Tech Support Scam', region: 'India', period: '30 days' },
    flags: ['urgency', 'impersonation', 'money'], leExported: false, leExportDate: null, blacklisted: false,
  },
  {
    id: '8e9f0a1b',
    caller: '+62 812 3456 7890',
    location: { city: 'Jakarta', country: 'Indonesia', countryCode: 'ID', lat: -6.2, lng: 106.8 },
    type: 'job', risk: 45, confidence: 68, status: 'recent',
    timestamp: Date.now() - 45 * 60 * 1000,
    entities: { institution: 'Global Recruitment Ltd (fake)', caseId: null, badge: null, payment: 'Processing fee', callback: '+62 XXX XXX 7' },
    cluster: { count: 5, type: 'Job Scam', region: 'Southeast Asia', period: '7 days' },
    flags: ['money'], leExported: false, leExportDate: null, blacklisted: false,
  },
  {
    id: '9f0a1b2c',
    caller: '+27 71 234 5678',
    location: { city: 'Johannesburg', country: 'South Africa', countryCode: 'ZA', lat: -26.2, lng: 28.0 },
    type: 'bank', risk: 71, confidence: 83, status: 'recent',
    timestamp: Date.now() - 18 * 60 * 1000,
    entities: { institution: 'Standard Bank (fake)', caseId: 'SB-FRAUD-2025-88', badge: null, payment: 'OTP phishing', callback: '+27 XXX XXX 2' },
    cluster: { count: 8, type: 'Bank / Payment Fraud', region: 'Southern Africa', period: '14 days' },
    flags: ['money', 'urgency'], leExported: false, leExportDate: null, blacklisted: false,
  },
  {
    id: '0a1b2c3d',
    caller: '+66 89 123 4567',
    location: { city: 'Bangkok', country: 'Thailand', countryCode: 'TH', lat: 13.8, lng: 100.5 },
    type: 'romance', risk: 58, confidence: 72, status: 'recent',
    timestamp: Date.now() - 34 * 60 * 1000,
    entities: { institution: null, caseId: null, badge: null, payment: 'Cryptocurrency', callback: '+66 XXX XXX 8' },
    cluster: { count: 2, type: 'Romance Scam', region: 'Southeast Asia', period: '7 days' },
    flags: ['money'], leExported: false, leExportDate: null, blacklisted: false,
  },
  {
    id: 'b1c2d3e4',
    caller: '+57 314 123 4567',
    location: { city: 'Bogotá', country: 'Colombia', countryCode: 'CO', lat: 4.7, lng: -74.1 },
    type: 'bank', risk: 68, confidence: 80, status: 'recent',
    timestamp: Date.now() - 12 * 60 * 1000,
    entities: { institution: 'Bancolombia (fake)', caseId: 'BC-2025-3312', badge: null, payment: 'Wire transfer', callback: '+57 XXX XXX 6' },
    cluster: { count: 6, type: 'Bank / Payment Fraud', region: 'South America', period: '14 days' },
    flags: ['urgency', 'money'], leExported: false, leExportDate: null, blacklisted: false,
  },
  {
    id: 'c2d3e4f5',
    caller: '+20 100 123 4567',
    location: { city: 'Cairo', country: 'Egypt', countryCode: 'EG', lat: 30.0, lng: 31.2 },
    type: 'job', risk: 49, confidence: 65, status: 'recent',
    timestamp: Date.now() - 67 * 60 * 1000,
    entities: { institution: 'Gulf Employment Agency (fake)', caseId: null, badge: null, payment: 'Visa processing fee', callback: '+20 XXX XXX 9' },
    cluster: { count: 4, type: 'Job Scam', region: 'MENA', period: '30 days' },
    flags: ['money'], leExported: false, leExportDate: null, blacklisted: false,
  },
];

export const NEW_INCIDENT_TEMPLATES = [
  {
    caller: '+44 7700 900123',
    location: { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5, lng: -0.1 },
    type: 'tech' as ScamType, risk: 73, confidence: 84,
    entities: { institution: 'BT Support (fake)', caseId: null, badge: null, payment: 'Gift card', callback: '+44 XXX XXX 1' },
    cluster: { count: 3, type: 'Tech Support Scam', region: 'UK', period: '7 days' },
    flags: ['impersonation', 'money'],
  },
  {
    caller: '+1 646 555 0182',
    location: { city: 'New York', country: 'United States', countryCode: 'US', lat: 40.7, lng: -74.0 },
    type: 'police' as ScamType, risk: 91, confidence: 95,
    entities: { institution: 'NYPD (fake)', caseId: 'NYPD-FAKE-2025', badge: 'Detective Rivera (unverified)', payment: 'Wire transfer', callback: '+1 XXX XXX 7' },
    cluster: { count: 11, type: 'Police impersonation', region: 'North America', period: '14 days' },
    flags: ['urgency', 'impersonation', 'money'],
  },
  {
    caller: '+86 138 0000 1234',
    location: { city: 'Beijing', country: 'China', countryCode: 'CN', lat: 39.9, lng: 116.4 },
    type: 'bank' as ScamType, risk: 82, confidence: 88,
    entities: { institution: 'Bank of China (fake)', caseId: 'BOC-2025-991', badge: null, payment: 'Wire transfer', callback: '+86 XXX XXX 4' },
    cluster: { count: 5, type: 'Bank / Payment Fraud', region: 'East Asia', period: '7 days' },
    flags: ['urgency', 'money'],
  },
];

export function getRiskColor(risk: number): string {
  if (risk >= 80) return '#ef4444';
  if (risk >= 60) return '#f97316';
  if (risk >= 40) return '#eab308';
  return '#22c55e';
}

export function getRiskLabel(risk: number): string {
  if (risk >= 80) return 'Critical';
  if (risk >= 60) return 'Elevated';
  if (risk >= 40) return 'Moderate';
  return 'Low';
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function latLngToXY(lat: number, lng: number): { x: number; y: number } {
  const x = (lng + 180) / 360 * 900;
  const y = (90 - lat) / 180 * 500;
  return { x, y };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
