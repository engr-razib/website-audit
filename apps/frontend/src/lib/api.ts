export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  uptime: number;
}

export interface QuickScanRequest {
  url: string;
  findingType?: 'font' | 'image' | 'text' | 'cta';
  findingValue?: string;
  fontName?: string;
}

export interface FullAuditRequest {
  sitemapUrl?: string;
  crawlUrl?: string;
  urls?: string[];
  findingType?: 'font' | 'image' | 'text' | 'cta';
  findingValue?: string;
  fontName?: string;
  maxPages?: number;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    currentUrl: string;
    percent: number;
  };
  createdAt: string;
  completedAt: string | null;
  summary?: {
    totalPagesAudited: number;
    uniqueFontsFound: number;
    totalCTAsFound: number;
    missingAltImagesCount: number;
    targetFontElementMatches: number;
    targetFontStyleMatches: number;
  };
  downloadUrls?: {
    excel: string;
    json: string;
  } | null;
  error?: string | null;
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function startQuickScan(data: QuickScanRequest): Promise<any> {
  const res = await fetch(`${API_BASE}/audit/quick-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Quick scan request failed' }));
    throw new Error(err.error || 'Quick scan failed');
  }
  return res.json();
}

export async function startFullAudit(data: FullAuditRequest): Promise<{ jobId: string; statusUrl: string }> {
  const res = await fetch(`${API_BASE}/audit/full`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Full audit request failed' }));
    throw new Error(err.error || 'Full audit failed');
  }
  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE}/audit/jobs/${jobId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch job status');
  return res.json();
}

export function getExcelDownloadUrl(jobId: string): string {
  return `${API_BASE}/audit/jobs/${jobId}/download/excel`;
}

export function getJsonDownloadUrl(jobId: string): string {
  return `${API_BASE}/audit/jobs/${jobId}/download/json`;
}
