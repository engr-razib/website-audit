export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  uptime: number;
}

export interface QuickScanRequest {
  url: string;
  findingType?: 'font' | 'image' | 'text' | 'cta' | 'all';
  findingValue?: string;
  fontName?: string;
}

export interface FullAuditRequest {
  sitemapUrl?: string;
  crawlUrl?: string;
  urls?: string[];
  findingType?: 'font' | 'image' | 'text' | 'cta' | 'all';
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

export async function checkBackendHealth(): Promise<HealthResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_BASE}/health`, { 
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch (err: any) {
    clearTimeout(timeoutId);
    return null;
  }
}

export async function startQuickScan(data: QuickScanRequest): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/audit/quick-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Quick scan request failed' }));
      throw new Error(err.error || 'Quick scan failed');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error('Backend server is offline or unreachable. Please start the backend server to run live scans.');
  }
}

export async function startFullAudit(data: FullAuditRequest): Promise<{ jobId: string; statusUrl: string }> {
  try {
    const res = await fetch(`${API_BASE}/audit/full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Full audit request failed' }));
      throw new Error(err.error || 'Full audit failed');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error('Backend server is offline or unreachable. Please start the backend server to run live audits.');
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  try {
    const res = await fetch(`${API_BASE}/audit/jobs/${jobId}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch job status');
    return await res.json();
  } catch (err: any) {
    throw new Error(err.message === 'Failed to fetch' ? 'Backend server is offline' : err.message || 'Failed to fetch job status');
  }
}

export function getExcelDownloadUrl(jobId: string): string {
  return `${API_BASE}/audit/jobs/${jobId}/download/excel`;
}

export function getJsonDownloadUrl(jobId: string): string {
  return `${API_BASE}/audit/jobs/${jobId}/download/json`;
}

export interface BrowserlessStatusResponse {
  status: 'CONNECTED' | 'FAILED' | 'ERROR' | 'NOT_CONFIGURED' | 'INVALID_KEY';
  message: string;
  version?: string;
  keyConfigured?: boolean;
}

export interface BrowserlessKeyStatus {
  configured: boolean;
  maskedKey: string | null;
}

const BROWSERLESS_STORAGE_KEY = 'browserless_api_key';

export function getStoredBrowserlessKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(BROWSERLESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredBrowserlessKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BROWSERLESS_STORAGE_KEY, apiKey);
  } catch (err) {
    console.error('Failed to save Browserless key to localStorage:', err);
  }
}

export function removeStoredBrowserlessKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(BROWSERLESS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to remove Browserless key from localStorage:', err);
  }
}

export async function checkBrowserlessConnection(): Promise<BrowserlessStatusResponse> {
  try {
    const res = await fetch(`${API_BASE}/health/browserless`, { cache: 'no-store' });
    return await res.json().catch(() => ({ status: 'FAILED', message: 'Failed to communicate with test endpoint' }));
  } catch {
    return { status: 'FAILED', message: 'Backend server is offline' };
  }
}

export async function testBrowserlessKey(apiKey: string): Promise<BrowserlessStatusResponse> {
  try {
    const res = await fetch(`${API_BASE}/health/browserless?key=${encodeURIComponent(apiKey)}`, { cache: 'no-store' });
    return await res.json().catch(() => ({ status: 'FAILED', message: 'Failed to test the API key' }));
  } catch {
    return { status: 'FAILED', message: 'Backend server is offline' };
  }
}

export async function saveBrowserlessKey(apiKey: string): Promise<{ status: string; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/settings/browserless-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    const data = await res.json();
    if (data.status === 'SAVED') {
      setStoredBrowserlessKey(apiKey);
    }
    return data;
  } catch {
    return { status: 'FAILED', error: 'Backend server is offline' };
  }
}

export async function getBrowserlessKeyStatus(): Promise<BrowserlessKeyStatus> {
  try {
    const res = await fetch(`${API_BASE}/settings/browserless-key/status`, { cache: 'no-store' });
    if (!res.ok) return { configured: false, maskedKey: null };
    return await res.json().catch(() => ({ configured: false, maskedKey: null }));
  } catch {
    return { configured: false, maskedKey: null };
  }
}

export async function syncBrowserlessKeyWithBackend(): Promise<BrowserlessKeyStatus> {
  const storedKey = getStoredBrowserlessKey();
  if (storedKey) {
    try {
      const status = await getBrowserlessKeyStatus();
      if (!status.configured) {
        await saveBrowserlessKey(storedKey);
      }
    } catch {
      // ignore
    }
  }
  return getBrowserlessKeyStatus();
}

export interface ImageDownloadProgress {
  url: string;
  filename: string | null;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  size: number | null;
  error: string | null;
  durationMs: number | null;
  previewUrl?: string | null;
}

export interface ImageDownloadJobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    currentUrl: string;
    percent: number;
  };
  details: ImageDownloadProgress[];
  createdAt: string;
  completedAt: string | null;
  downloadUrls?: {
    zip: string;
    excel: string;
  } | null;
  localFolderPath?: string | null;
  error?: string | null;
}

export async function startImageDownloadJob(text: string): Promise<{ jobId: string }> {
  try {
    const res = await fetch(`${API_BASE}/image-downloader/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Image download job start failed' }));
      throw new Error(err.error || 'Failed to start image downloader');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error('Backend server is offline or unreachable.');
  }
}

export async function getImageDownloadJobStatus(jobId: string): Promise<ImageDownloadJobStatus> {
  try {
    const res = await fetch(`${API_BASE}/image-downloader/jobs/${jobId}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch job status');
    return await res.json();
  } catch (err: any) {
    throw new Error(err.message === 'Failed to fetch' ? 'Backend server is offline' : err.message || 'Failed to fetch job status');
  }
}

export async function openLocalFolder(jobId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/image-downloader/jobs/${jobId}/open-folder`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to open local folder' }));
      throw new Error(err.error || 'Failed to open local folder');
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(err.message || 'Failed to communicate with backend to open local folder');
  }
}

export function getZipDownloadUrl(jobId: string): string {
  return `${API_BASE}/image-downloader/jobs/${jobId}/download/zip`;
}

export function getImageExcelDownloadUrl(jobId: string): string {
  return `${API_BASE}/image-downloader/jobs/${jobId}/download/excel`;
}

export async function scanWebpageForImages(url: string, selector?: string): Promise<{ status: string; source: string; urls: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/image-downloader/scan-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, selector }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Webpage image extraction failed' }));
      throw new Error(err.error || 'Failed to extract images from website');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error('Backend server is offline or webpage scanner is unreachable.');
  }
}

export interface CustomCrawlMapping {
  selector: string;
  type: 'text' | 'attr';
  attrName?: string;
}

export interface CustomCrawlRequest {
  url: string;
  crawlOption: 'data' | 'data-and-images';
  maxPages: number;
  containerSelector?: string;
  mappings: Record<string, CustomCrawlMapping>;
  xlsxBase64: string;
}

export interface CustomCrawlJobStatus {
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
  headers: string[];
  data: Record<string, any>[];
  downloadUrls?: {
    excel: string;
    zip?: string | null;
  } | null;
  error?: string | null;
}

export async function parseExcelHeaders(fileBase64: string): Promise<{ headers: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/custom-crawler/parse-headers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64 }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Parsing excel headers failed' }));
      throw new Error(err.error || 'Parsing excel headers failed');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error('Backend server is offline or unreachable.');
  }
}

export async function startCustomCrawlJob(data: CustomCrawlRequest): Promise<{ jobId: string }> {
  try {
    const res = await fetch(`${API_BASE}/custom-crawler/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Custom crawl job start failed' }));
      throw new Error(err.error || 'Custom crawl job start failed');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error('Backend server is offline or unreachable.');
  }
}

export async function getCustomCrawlJobStatus(jobId: string): Promise<CustomCrawlJobStatus> {
  try {
    const res = await fetch(`${API_BASE}/custom-crawler/jobs/${jobId}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch job status');
    return await res.json();
  } catch (err: any) {
    throw new Error(err.message === 'Failed to fetch' ? 'Backend server is offline' : err.message || 'Failed to fetch job status');
  }
}

export function getCustomCrawlExcelDownloadUrl(jobId: string): string {
  return `${API_BASE}/custom-crawler/jobs/${jobId}/download/excel`;
}

export function getCustomCrawlZipDownloadUrl(jobId: string): string {
  return `${API_BASE}/custom-crawler/jobs/${jobId}/download/zip`;
}




