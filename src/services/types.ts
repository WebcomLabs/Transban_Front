/** قرارداد TypeScript متناظر با swagger.json (نسخه ۱.۱.۰). */

export type DefectStatusType = 'تعمیر شده' | 'تعمیر نشده' | 'در انتظار تایید ناظر عالی';
export type MaintenanceStatusType = 'تعمیر شده' | 'تعمیر نشده' | 'در انتظار تایید';
export type TariffType = 'خانگی' | 'صنعتی' | 'کشاورزی' | 'تجاری' | 'عمومی';

export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface AlertAckResponse {
  message: string;
  alert_id: number;
  status: string;
  acknowledged_at: string;
}

export interface DgaTestCreate {
  /** مثال سواگر: 1405/08/11 */
  test_date: string;
  /** استیلن */
  c2h2: number;
  /** اتیلن */
  c2h4: number;
  /** هیدروژن */
  h2: number;
  /** متان */
  ch4: number;
  /** مونوکسید کربن */
  co: number;
  /** ولتاژ شکست روغن (kV) */
  breakdown_voltage_kv: number;
}

/** رکورد آزمون روغن. بدنهٔ ایجاد در سواگر مشخص است؛ شناسه‌ها در پاسخ خالیِ تاریخچه ممکن است بیایند. */
export interface DgaTestRecord extends DgaTestCreate {
  id?: number;
  transformer_id?: number;
}

export interface DefectResponse {
  id: number;
  region: string;
  asset_name: string;
  defect_status: string;
  issue_type: string;
  date: string;
  repair_team: string;
}

export interface DefectStatusUpdate {
  status: string;
  resolution_note?: string | null;
}

export interface DispatchingAlertResponse {
  id: number;
  region_id: number;
  asset_type: string;
  asset_id: number;
  alert_type: string;
  message: string;
  is_acknowledged: boolean;
  created_at: string;
  acknowledged_at: string | null;
}

export interface ForecastPoint {
  timestamp: string;
  /** بار واقعی برای گذشته؛ برای افق آینده خالی است */
  actual_mw?: number | null;
  predicted_mw: number;
  upper_bound: number;
  lower_bound: number;
}

export interface LoadForecastResponse {
  region_id: number;
  feeder_id: number;
  feeder_name: string;
  horizon_hours: number;
  model_name: string;
  forecast_data: ForecastPoint[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UnbalancedTransformerItem {
  transformer_id: number;
  substation_name: string;
  capacity_kva: number;
  phase_a_amps: number;
  phase_b_amps: number;
  phase_c_amps: number;
  neutral_amps: number;
  unbalance_percentage: number;
  estimated_annual_loss_million_tomans: number;
}

export interface LossesUnbalanceResponse {
  region_id: number;
  region_name: string;
  total_energy_delivered_mwh: number;
  technical_losses_mwh: number;
  loss_percentage: number;
  unbalanced_transformers_count: number;
  top_unbalanced_transformers: UnbalancedTransformerItem[];
}

export interface TelemetryPoint {
  timestamp: string;
  load_kw: number;
  current_amps: number;
  oil_temperature_c: number;
}

export interface TransformerLoadHistoryResponse {
  transformer_id: number;
  capacity_kva: number;
  hours: number;
  data: TelemetryPoint[];
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
  role: string;
  allowed_regions: number[];
}

export interface UserResponse {
  id: number;
  username: string;
  full_name: string;
  job_title: string;
  role: string;
  allowed_regions: number[];
}

export interface WorkOrderCreate {
  transformer_id: number;
  issue_type: string;
  assigned_team: string;
  priority?: string;
  description?: string | null;
}

export interface WorkOrderResponse {
  id: number;
  transformer_id: number;
  priority: string;
  issue_type: string;
  status: string;
  assigned_team: string | null;
  description: string | null;
  resolution_note: string | null;
  reported_at: string;
  repaired_at: string | null;
}

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

/** اسکیمای پاسخ در سواگر خالی است؛ توضیح عملیات خروجی GeoJSON LineString را مشخص کرده. */
export interface FeederNetworkFeature {
  type: 'Feature';
  id?: string | number;
  geometry: GeoJsonLineString;
  properties: {
    feeder_id?: number;
    feeder_name?: string;
    name?: string;
    region_id?: number;
    substation_name?: string;
    [key: string]: unknown;
  };
}

export interface FeederNetworkGeoJson {
  type: 'FeatureCollection';
  features: FeederNetworkFeature[];
}

/**
 * کاندید تعویض. اسکیمای پاسخ در سواگر خالی است؛
 * فیلدها از توضیح عملیات و بقیهٔ مدل‌های ترانس استنباط شده‌اند و همگی اختیاری‌اند.
 */
export interface ReplacementCandidate {
  transformer_id?: number;
  id?: number;
  asset_name?: string;
  name?: string;
  substation_name?: string;
  feeder_name?: string;
  region_id?: number;
  capacity_kva?: number;
  health_index?: number;
  failure_risk?: number;
  risk_score?: number;
  load_percent?: number;
  current_load_percent?: number;
  overload_percentage?: number;
  peak_load_kva?: number;
  age_years?: number;
  failure_count?: number;
  priority_rank?: number;
  priority_level?: string;
  recommended_action?: string;
  reason?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface Paginated<T> {
  items?: T[];
  data?: T[];
  results?: T[];
  total?: number;
  page?: number;
  page_size?: number;
  count?: number;
}

export type ListResponse<T> = T[] | Paginated<T>;

/** تاریخچه DGA در سواگر بدون اسکیما است. */
export type DgaHistoryResponse =
  | DgaTestRecord[]
  | Paginated<DgaTestRecord>
  | { tests?: DgaTestRecord[]; transformer_id?: number };

/** پاسخ ریشهٔ سرویس در سواگر بدون اسکیما است. */
export interface SystemStatusResponse {
  status?: string;
  message?: string;
  version?: string;
  [key: string]: unknown;
}
