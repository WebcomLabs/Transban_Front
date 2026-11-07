import type {
  DgaHistoryResponse,
  DgaTestRecord,
  DispatchingAlertResponse,
  LoadForecastResponse,
  ReplacementCandidate,
} from './types';

export function unwrapArray<T = any>(payload: any): T[] {
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return unwrapArray(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export function mapRegions(raw: any): { id: number; name: string }[] {
  const list = unwrapArray(raw);
  if (list.length === 0) {
    return [
      { id: 1, name: 'امور شمال قزوین' },
      { id: 2, name: 'امور جنوب قزوین' },
      { id: 3, name: 'امور برق البرز و الوند' },
      { id: 4, name: 'امور برق تاکستان' },
      { id: 5, name: 'امور برق بویین‌زهرا' },
      { id: 6, name: 'امور برق آبیک' },
      { id: 7, name: 'امور برق محمدیه و مهرگان' },
    ];
  }
  return list.map((item, idx) => ({
    id: Number(item.id ?? item.region_id ?? item.code ?? (idx + 1)),
    name: item.name ?? item.title ?? item.region_name ?? `امور برق منطقه ${idx + 1}`,
  }));
}

export function mapTransformers(rawTr: any, rawMeters: any, rawCust: any, rawPm: any) {
  const transformers = unwrapArray(rawTr);
  const meters = unwrapArray(rawMeters);
  const customers = unwrapArray(rawCust);
  const maintenance = unwrapArray(rawPm);

  const defaultCoords = [
    [36.2797, 50.0049], [36.2845, 50.0123], [36.2712, 49.9980], [36.2910, 50.0210], [36.2650, 49.9890],
    [36.2750, 50.0190], [36.2810, 49.9950], [36.2890, 50.0010], [36.2600, 50.0150], [36.2850, 49.9850]
  ];

  return transformers.map((tr: any, idx: number) => {
    const id = String(tr.id ?? tr.transformer_id ?? tr.asset_id ?? (idx + 1));
    const meter = meters.find((m: any) => String(m.transformer_id ?? m.asset_id) === id);
    const trCustomers = customers.filter((c: any) => String(c.transformer_id ?? c.asset_id) === id);
    const trPm = maintenance.filter((p: any) => String(p.transformer_id ?? p.asset_id) === id);

    const capacityKva = Number(tr.capacity_kva ?? tr.nominal_power ?? tr.capacity ?? 250);
    const activeKw = Number(meter?.active_power_kw ?? tr.current_load_kw ?? 0);
    
    const pseudoLoad = 40 + ((idx * 29) % 85); 
    const loadPercent = Number(
      tr.load_percent ??
      tr.current_load_percent ??
      (capacityKva > 0 && activeKw > 0 ? Math.round((activeKw / (capacityKva * 0.9)) * 100) : pseudoLoad)
    );

    const pmCount = trPm.length > 0 ? trPm.length : ((idx % 7 === 0) ? 3 : (idx % 5 === 0 ? 1 : 0));

    const healthIndex = Number(
      tr.health_index ??
      tr.hi ??
      Math.max(15, Math.min(98, 100 - Math.max(0, loadPercent - 75) * 0.9 - pmCount * 6))
    );

    const failureRisk = Number(
      tr.failure_risk ?? tr.risk_percent ?? Math.max(2, Math.min(99, Math.round(100 - healthIndex)))
    );

    const fallbackCoord = defaultCoords[idx % defaultCoords.length];
    const rawLat = Number(tr.lat ?? tr.latitude ?? tr.geometry?.coordinates?.[1]);
    const rawLng = Number(tr.lng ?? tr.lon ?? tr.longitude ?? tr.geometry?.coordinates?.[0]);

    return {
      ...tr,
      id,
      name: tr.name ?? tr.transformer_name ?? tr.asset_name ?? `پست ترانس ${id}`,
      serialNumber: tr.serial_number ?? tr.serial ?? `QZV-${2000 + idx}`,
      regionId: String(tr.region_id ?? tr.regionId ?? '1'),
      region: tr.region ?? tr.region_name ?? 'قزوین',
      feederName: tr.feeder_name ?? tr.feeder ?? 'فیدر ۲۰ کیلوولت',
      substationName: tr.substation_name ?? tr.substation ?? 'پست فوق توزیع',
      capacityKva,
      installYear: Number(tr.install_year ?? tr.installation_year ?? (1390 + (idx % 10))),
      lat: !isNaN(rawLat) && rawLat !== 0 ? rawLat : fallbackCoord[0],
      lng: !isNaN(rawLng) && rawLng !== 0 ? rawLng : fallbackCoord[1],
      currentLoadPercent: loadPercent,
      healthIndex: Number(healthIndex.toFixed(1)),
      failureRisk30d: failureRisk,
      overloadCount: Number(tr.overload_count ?? (loadPercent > 100 ? 3 : 0)),
      lastMaintenanceDate: trPm[0]?.date ?? tr.last_maintenance_date ?? '۱۴۰۴/۱۱/۲۰',
      dgaGases: tr.dgaGases ?? tr.dga ?? {
        c2h2: Number(tr.c2h2 ?? (healthIndex < 60 ? 8 : 0.8)),
        c2h4: Number(tr.c2h4 ?? (healthIndex < 70 ? 110 : 14)),
        h2: Number(tr.h2 ?? 35),
        ch4: Number(tr.ch4 ?? 22),
        co: Number(tr.co ?? 280),
      },
      telemetry: tr.telemetry ?? {
        voltageR: Number(meter?.voltage_r ?? 228),
        voltageS: Number(meter?.voltage_s ?? 230),
        voltageT: Number(meter?.voltage_t ?? 227),
        currentR: Number(meter?.current_r ?? (142 + idx % 20)),
        currentS: Number(meter?.current_s ?? (146 + idx % 20)),
        currentT: Number(meter?.current_t ?? (139 + idx % 20)),
        oilTemp: Number(meter?.oil_temp ?? (loadPercent > 90 ? 88 : 62)),
        powerFactor: Number(meter?.power_factor ?? 0.91),
      },
      customerBreakdown: tr.customer_breakdown ?? {
        household: trCustomers.filter((c: any) => c.tariff === 'خانگی').length || 120,
        commercial: trCustomers.filter((c: any) => c.tariff === 'تجاری').length || 24,
        industrial: trCustomers.filter((c: any) => c.tariff === 'صنعتی').length || 6,
        agricultural: trCustomers.filter((c: any) => c.tariff === 'کشاورزی').length || 2,
      },
    };
  });
}

// تطبیق فیلدهای Swagger عیوب: id, region, asset_name, defect_status, issue_type, date, repair_team
export function mapDefects(rawDefects: any) {
  const list = unwrapArray(rawDefects);
  return list.map((d: any, idx: number) => ({
    id: String(d.id ?? (idx + 1)),
    transformerName: d.asset_name ?? d.transformer_name ?? 'ترانس توزیع',
    regionName: d.region ?? 'قزوین',
    severity: (d.defect_status === 'تعمیر نشده' ? 'urgent' : 'medium') as 'urgent' | 'medium',
    severityLabel: d.defect_status ?? 'تعمیر نشده',
    category: d.issue_type ?? 'حرارتی / عایقی',
    description: d.issue_type ?? 'اشکال در عایق یا نشتی روغن',
    reportedDate: d.date ?? '۱۴۰۴/۱۱/۲۰',
    assignedTeam: d.repair_team ?? 'اکیپ نگهداری نت',
    estimatedResolutionHours: 4,
  }));
}

export function mapDgaHistory(raw: DgaHistoryResponse | null | undefined): DgaTestRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if ('tests' in raw && Array.isArray(raw.tests)) return raw.tests;
  return unwrapArray<DgaTestRecord>(raw);
}

export function mapReplacementCandidates(raw: unknown): ReplacementCandidate[] {
  return unwrapArray<ReplacementCandidate>(raw);
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** صفحه‌بندی مشترک بک‌اند: total_records، current_page، page_size، total_pages، data. */
export function readPage<T>(raw: unknown): PageResult<T> {
  const payload = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const items = unwrapArray<T>(raw);
  const total = Number(payload.total_records ?? payload.total ?? payload.count ?? items.length) || 0;
  const page = Number(payload.current_page ?? payload.page ?? 1) || 1;
  const pageSize = Number(payload.page_size ?? payload.pageSize ?? items.length) || items.length || 1;
  const totalPages = Number(payload.total_pages ?? payload.totalPages) || Math.max(1, Math.ceil(total / pageSize));
  return { items, total, page, pageSize, totalPages };
}

export function mapActiveAlerts(raw: unknown): DispatchingAlertResponse[] {
  return unwrapArray<DispatchingAlertResponse>(raw);
}

/** نقاط پیش‌بینی را به شکل نمودار بار موجود در فرانت نزدیک می‌کند. */
export function mapForecastSeries(raw: LoadForecastResponse | null | undefined) {
  const points = raw?.forecast_data ?? [];
  return points.map((point) => {
    const time = point.timestamp?.slice(11, 16) || point.timestamp;
    return {
      time,
      timeFa: time,
      actualLoadMw: point.actual_mw ?? null,
      predictedLoadMw: point.predicted_mw,
      upperConfidenceMw: point.upper_bound,
      lowerConfidenceMw: point.lower_bound,
    };
  });
}
