import type {
  AlertAckResponse,
  DefectResponse,
  DefectStatusType,
  DefectStatusUpdate,
  DgaHistoryResponse,
  DgaTestCreate,
  DgaTestRecord,
  DispatchingAlertResponse,
  FeederNetworkGeoJson,
  ListResponse,
  CustomerSchema,
  FeederLoadSchema,
  FeederSchema,
  LoadForecastResponse,
  LoginRequest,
  LossesUnbalanceResponse,
  MaintenanceRecordSchema,
  MaintenanceStatusType,
  MeterReadingSchema,
  PaginatedResponse,
  RegionSchema,
  ReplacementCandidate,
  SubstationSchema,
  TransformerSchema,
  SystemStatusResponse,
  TariffType,
  TokenResponse,
  TransformerLoadHistoryResponse,
  UserResponse,
  WorkOrderCreate,
  WorkOrderResponse,
} from './types';

export type {
  AlertAckResponse,
  DefectResponse,
  DefectStatusType,
  DefectStatusUpdate,
  DgaHistoryResponse,
  DgaTestCreate,
  DgaTestRecord,
  DispatchingAlertResponse,
  FeederNetworkGeoJson,
  HTTPValidationError,
  ListResponse,
  CustomerSchema,
  FeederLoadSchema,
  FeederSchema,
  LoadForecastResponse,
  LoginRequest,
  LossesUnbalanceResponse,
  MaintenanceRecordSchema,
  MaintenanceStatusType,
  MeterReadingSchema,
  Paginated,
  PaginatedResponse,
  RegionSchema,
  SubstationSchema,
  TransformerSchema,
  ReplacementCandidate,
  SystemStatusResponse,
  TariffType,
  TokenResponse,
  TransformerLoadHistoryResponse,
  UnbalancedTransformerItem,
  UserResponse,
  ValidationError,
  WorkOrderCreate,
  WorkOrderResponse,
} from './types';

export interface ApiQueryOptions {
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined | null>;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /**
   * true: خطای HTTP یا شبکه را پرتاب می‌کند.
   * پیش‌فرض برای GETهای قدیمی false است تا صفحات فعلی با آرایهٔ خالی ادامه دهند.
   * نوشتن‌ها و متدهای جدید پیش‌فرض strict دارند.
   */
  strict?: boolean;
  fallback?: unknown;
  /** اگر false باشد هدر Authorization فرستاده نمی‌شود. پیش‌فرض: true وقتی توکن موجود است. */
  auth?: boolean;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'transban_access_token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ذخیرهٔ توکن در این محیط در دسترس نیست */
  }
}

function resolveUrl(endpoint: string): URL {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (/^https?:\/\//i.test(BASE_URL)) {
    return new URL(`${BASE_URL.replace(/\/$/, '')}${path}`);
  }
  const prefix = BASE_URL
    ? (BASE_URL.startsWith('/') ? BASE_URL : `/${BASE_URL}`).replace(/\/$/, '')
    : '';
  return new URL(`${prefix}${path}`, window.location.origin);
}

function errorMessage(status: number, endpoint: string, body: unknown): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail)) {
      const first = detail.find((item) => item && typeof item === 'object' && 'msg' in item) as
        | { msg?: string }
        | undefined;
      if (first?.msg) return first.msg;
    }
  }
  return `خطای بک‌اند (${status}) در فراخوانی: ${endpoint}`;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

async function request<T>(endpoint: string, options: ApiQueryOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const strict = options.strict ?? method !== 'GET';
  const url = resolveUrl(endpoint);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    Accept: endpoint.includes('gis-map') ? 'text/html, application/json' : 'application/json',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const fail = (status: number, body?: unknown): T => {
    const message = errorMessage(status, endpoint, body);
    if (strict) throw new ApiError(status, message, body);
    console.warn(message);
    return (options.fallback ?? []) as T;
  };

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });

    if (!response.ok) {
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      return fail(response.status, body);
    }

    if (response.status === 204) return undefined as T;
    if (endpoint.includes('gis-map')) return (await response.text()) as T;

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (err) {
    if (isAbortError(err) || err instanceof ApiError) throw err;
    if (strict) {
      throw err instanceof Error ? err : new ApiError(0, `عدم دسترسی به سرور در مسیر: ${endpoint}`);
    }
    console.warn(`عدم دسترسی به سرور در مسیر: ${endpoint}`);
    return (options.fallback ?? []) as T;
  }
}

function asId(id: number | string, label: string): number {
  const value = Number(id);
  if (!Number.isInteger(value)) {
    throw new ApiError(0, `${label} باید عدد صحیح باشد`);
  }
  return value;
}

const getGisMapHtml = (signal?: AbortSignal) =>
  request<string>('/api/v1/gis-map', { signal, fallback: '' });

export const transbanApi = {
  // ——— متدهای قبلی (خواندنی) ———

  getGisMap: getGisMapHtml,
  getGisMapHtml,

  getDefectsByStatus: (status: DefectStatusType = 'تعمیر نشده', limit = 50, signal?: AbortSignal) =>
    request<DefectResponse[]>('/api/v1/defects/filter', {
      params: { status, limit },
      signal,
    }),

  getRegions: (signal?: AbortSignal) =>
    request<RegionSchema[]>('/api/v1/regional/regions', { signal, strict: true }),

  /** page از ۱؛ page_size حداکثر ۱۰۰. */
  getSubstations: (regionId = 1, signal?: AbortSignal, page = 1, pageSize = 20) =>
    request<PaginatedResponse<SubstationSchema>>('/api/v1/regional/substations', {
      params: { region_id: regionId, page, page_size: pageSize },
      signal,
      strict: true,
    }),

  /** page از ۱؛ page_size حداکثر ۱۰۰. */
  getFeeders: (regionId = 1, pageSize = 50, signal?: AbortSignal, page = 1) =>
    request<PaginatedResponse<FeederSchema>>('/api/v1/regional/feeders', {
      params: { region_id: regionId, page, page_size: pageSize },
      signal,
      strict: true,
    }),

  /** page از ۱؛ page_size حداکثر ۲۰۰. */
  getTransformers: (regionId = 1, pageSize = 50, signal?: AbortSignal, page = 1) =>
    request<PaginatedResponse<TransformerSchema>>('/api/v1/regional/transformers', {
      params: { region_id: regionId, page, page_size: pageSize },
      signal,
      strict: true,
    }),

  /** tariff_type اختیاری است. page از ۱؛ page_size حداکثر ۲۰۰. */
  getCustomers: (
    regionId = 1,
    tariffType?: TariffType,
    pageSize = 50,
    signal?: AbortSignal,
    page = 1,
  ) =>
    request<PaginatedResponse<CustomerSchema>>('/api/v1/regional/customers', {
      params: { region_id: regionId, tariff_type: tariffType, page, page_size: pageSize },
      signal,
      strict: true,
    }),

  /** status اختیاری: تعمیر شده / تعمیر نشده / در انتظار تایید. page_size حداکثر ۱۰۰. */
  getMaintenance: (
    regionId = 1,
    status?: MaintenanceStatusType,
    pageSize = 50,
    signal?: AbortSignal,
    page = 1,
  ) =>
    request<PaginatedResponse<MaintenanceRecordSchema>>('/api/v1/regional/maintenance', {
      params: { region_id: regionId, status, page, page_size: pageSize },
      signal,
      strict: true,
    }),

  /** page از ۱؛ page_size حداکثر ۲۰۰. */
  getMeterReadings: (regionId = 1, pageSize = 50, signal?: AbortSignal, page = 1) =>
    request<PaginatedResponse<MeterReadingSchema>>('/api/v1/regional/meter-readings', {
      params: { region_id: regionId, page, page_size: pageSize },
      signal,
      strict: true,
    }),

  /** page از ۱؛ page_size حداکثر ۲۰۰. */
  getFeederLoads: (regionId = 1, pageSize = 50, signal?: AbortSignal, page = 1) =>
    request<PaginatedResponse<FeederLoadSchema>>('/api/v1/regional/feeder-loads', {
      params: { region_id: regionId, page, page_size: pageSize },
      signal,
      strict: true,
    }),

  // ——— متدهای جدید سواگر ———

  /** لایهٔ GeoJSON خطوط فیدر. region_id اجباری است. */
  getFeedersNetwork: (regionId: number, signal?: AbortSignal) =>
    request<FeederNetworkGeoJson>('/api/v1/feeders-network', {
      params: { region_id: regionId },
      signal,
      strict: true,
    }),

  /** صدور دستور کار اضطراری نت. پاسخ 201. */
  createWorkOrder: (body: WorkOrderCreate, signal?: AbortSignal) =>
    request<WorkOrderResponse>('/api/v1/work-orders', {
      method: 'POST',
      body,
      signal,
    }),

  /** تغییر وضعیت عیب و ثبت یادداشت رفع نقص. */
  updateDefectStatus: (defectId: number | string, body: DefectStatusUpdate, signal?: AbortSignal) =>
    request<WorkOrderResponse>(`/api/v1/defects/${asId(defectId, 'شناسه عیب')}/status`, {
      method: 'PATCH',
      body,
      signal,
    }),

  /** نمودار بار، جریان و دمای روغن. hours پیش‌فرض ۲۴. */
  getTransformerLoadHistory: (transformerId: number | string, hours = 24, signal?: AbortSignal) =>
    request<TransformerLoadHistoryResponse>(
      `/api/v1/transformers/${asId(transformerId, 'شناسه ترانس')}/load-history`,
      { params: { hours }, signal, strict: true },
    ),

  /** روند تاریخی آزمون گازهای محلول. */
  getDgaHistory: (transformerId: number | string, signal?: AbortSignal) =>
    request<DgaHistoryResponse>(
      `/api/v1/transformers/${asId(transformerId, 'شناسه ترانس')}/dga-history`,
      { signal, strict: true },
    ),

  /** ثبت آزمون جدید آزمایشگاه روغن. پاسخ 201 و اسکیمای سواگر خالی است. */
  createDgaTest: (transformerId: number | string, body: DgaTestCreate, signal?: AbortSignal) =>
    request<DgaTestRecord>(
      `/api/v1/transformers/${asId(transformerId, 'شناسه ترانس')}/dga-tests`,
      { method: 'POST', body, signal },
    ),

  /** پیش‌بینی بار فیدر. region_id و feeder_id اجباری‌اند. */
  getLoadForecast: (regionId: number, feederId: number, horizonHours = 24, signal?: AbortSignal) =>
    request<LoadForecastResponse>('/api/v1/analytics/load-forecast', {
      params: { region_id: regionId, feeder_id: feederId, horizon_hours: horizonHours },
      signal,
      strict: true,
    }),

  /** ترانس‌های در آستانهٔ تعویض، صفحه‌بندی‌شده. اسکیمای آیتم در سواگر خالی است. */
  getReplacementCandidates: (regionId: number, page = 1, pageSize = 20, signal?: AbortSignal) =>
    request<ListResponse<ReplacementCandidate>>('/api/v1/analytics/replacement-candidates', {
      params: { region_id: regionId, page, page_size: pageSize },
      signal,
      strict: true,
    }),

  /** تلفات ژول و عدم تعادل فاز. */
  getLossesUnbalance: (regionId: number, signal?: AbortSignal) =>
    request<LossesUnbalanceResponse>('/api/v1/analytics/losses-unbalance', {
      params: { region_id: regionId },
      signal,
      strict: true,
    }),

  /** هشدارهای تاییدنشدهٔ دیسپاچینگ. */
  getActiveAlerts: (regionId: number, signal?: AbortSignal) =>
    request<DispatchingAlertResponse[]>('/api/v1/alerts/active', {
      params: { region_id: regionId },
      signal,
      strict: true,
    }),

  /** تایید و رویت هشدار. بدنه ندارد. */
  acknowledgeAlert: (alertId: number | string, signal?: AbortSignal) =>
    request<AlertAckResponse>(`/api/v1/alerts/${asId(alertId, 'شناسه هشدار')}/ack`, {
      method: 'POST',
      signal,
    }),

  /** ورود و ذخیرهٔ access_token برای فراخوانی‌های بعدی. */
  login: async (body: LoginRequest, signal?: AbortSignal) => {
    const session = await request<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body,
      signal,
      auth: false,
    });
    if (session?.access_token) setAccessToken(session.access_token);
    return session;
  },

  logout: () => {
    setAccessToken(null);
  },

  /** مشخصات کاربر جاری. این مسیر در سواگر نیاز به Bearer دارد. */
  getCurrentUser: (signal?: AbortSignal) =>
    request<UserResponse>('/api/v1/auth/me', { signal, strict: true }),

  /** وضعیت ریشهٔ سرویس. */
  getSystemStatus: (signal?: AbortSignal) =>
    request<SystemStatusResponse>('/', { signal, strict: true }),
};
