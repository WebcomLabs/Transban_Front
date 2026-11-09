import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TransformerData, calculateHealthIndex } from '../utils/healthIndex';
import { Substation, Feeder } from '../data/qazvinGridData';
import { Zap, Layers } from 'lucide-react';
import { ApiError, transbanApi } from '../services/api';
import type { FeederNetworkFeature, FeederNetworkGeoJson } from '../services/types';

interface GisMapProps {
  transformers: TransformerData[];
  substations: Substation[];
  feeders: Feeder[];
  regionId: number;
  selectedTransformer: TransformerData | null;
  onSelectTransformer: (t: TransformerData) => void;
  onOpenDetailModal: (t: TransformerData) => void;
  centerCoordinates?: [number, number];
  caption?: string;
}

const DEFAULT_CENTER: [number, number] = [36.2797, 50.0049];

function isValidCoord(lat: any, lng: any): boolean {
  return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
}

export const GisMap: React.FC<GisMapProps> = ({
  transformers,
  substations,
  feeders: _feeders,
  regionId,
  selectedTransformer,
  onSelectTransformer,
  onOpenDetailModal,
  centerCoordinates = DEFAULT_CENTER,
  caption,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const feedersLayerRef = useRef<L.LayerGroup | null>(null);
  const substationsLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapTheme, setMapTheme] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [showSubstations, setShowSubstations] = useState(true);
  const [showFeeders, setShowFeeders] = useState(false);
  const [activeFeederKey, setActiveFeederKey] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all');
  const [feederNetwork, setFeederNetwork] = useState<FeederNetworkGeoJson | null>(null);
  const [feederStatus, setFeederStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [feederError, setFeederError] = useState('');

  const tileUrls = {
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  const safeCenter = isValidCoord(centerCoordinates?.[0], centerCoordinates?.[1])
    ? centerCoordinates
    : DEFAULT_CENTER;

  // ۱. راه‌اندازی نقشه با رویداد زوم زنده
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: safeCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const tile = L.tileLayer(tileUrls[mapTheme], {
      attribution: '&copy; OpenStreetMap & Esri',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tile;
    feedersLayerRef.current = L.layerGroup().addTo(map);
    substationsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    // ثبت تغییرات زوم در لحظه
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ۲. تغییر تم نقشه
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrls[mapTheme]);
    }
  }, [mapTheme]);

  // ۳. حرکت روان نقشه
  useEffect(() => {
    if (mapInstanceRef.current && isValidCoord(centerCoordinates?.[0], centerCoordinates?.[1])) {
      mapInstanceRef.current.flyTo(centerCoordinates, 13, { duration: 1.2 });
    }
  }, [centerCoordinates]);

  // ۴. رسم پست‌های فوق توزیع ۶۳/۲۰ کیلوولت (با آیکون رعد و برق برجسته)
  useEffect(() => {
    if (!substationsLayerRef.current) return;
    substationsLayerRef.current.clearLayers();

    if (!showSubstations) return;

    // پست‌های اصلی استان قزوین با مختصات دقیق
    const primarySubs = [
      { name: 'پست فوق توزیع ولیعصر قزوین', kv: '63/20 kV', lat: 36.2890, lng: 50.0150 },
      { name: 'پست فوق توزیع مینودر', kv: '63/20 kV', lat: 36.3020, lng: 50.0450 },
      { name: 'پست فوق توزیع البرز', kv: '63/20 kV', lat: 36.2650, lng: 49.9850 },
      { name: 'پست فوق توزیع بلوار انصارالحسین', kv: '63/20 kV', lat: 36.2820, lng: 50.0010 }
    ];

    primarySubs.forEach((sub) => {
      const subIcon = L.divIcon({
        className: 'sub-icon',
        html: `
          <div class="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/40 bg-white dark:bg-[#090a0f] text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.45)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([sub.lat, sub.lng], { icon: subIcon });
      marker.bindTooltip(
        `<div class="p-1.5 text-xs font-sans text-slate-800 dark:text-slate-100 font-bold bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700" dir="rtl">${sub.name}<br/><span class="text-cyan-400 font-mono text-[10px] font-normal">${sub.kv}</span></div>`,
        { sticky: true }
      );
      marker.addTo(substationsLayerRef.current!);
    });
  }, [showSubstations]);

  useEffect(() => {
    const controller = new AbortController();
    setFeederStatus('loading');
    setFeederError('');
    transbanApi.getFeedersNetwork(regionId, controller.signal)
      .then((geo) => {
        if (controller.signal.aborted) return;
        setFeederNetwork(geo);
        setFeederStatus('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setFeederNetwork(null);
        setFeederStatus('error');
        setFeederError(err instanceof ApiError && err.message ? err.message : 'خطوط فیدر از سرور دریافت نشد');
      });
    return () => controller.abort();
  }, [regionId]);

  useEffect(() => {
    setActiveFeederKey(null);
  }, [regionId]);

  const activeFeederName = useMemo(() => {
    if (!activeFeederKey || !feederNetwork) return '';
    const match = feederNetwork.features.find((feature, index) => feederFeatureKey(feature, index) === activeFeederKey);
    if (!match) return '';
    return String(match.properties?.feeder_name || match.properties?.name || 'فیدر');
  }, [activeFeederKey, feederNetwork]);

  // ۵. خطوط فیدر: پیش‌فرض خاموش. با فعال شدن لایه، شفافیت ۲۰٪ و کلیک فقط همان خط را درخشان می‌کند.
  useEffect(() => {
    const layer = feedersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showFeeders) return;

    (feederNetwork?.features ?? []).forEach((feature, index) => {
      if (feature.geometry?.type !== 'LineString' || !Array.isArray(feature.geometry.coordinates)) return;
      const latlngs = feature.geometry.coordinates
        .filter((pair) => Array.isArray(pair) && pair.length >= 2)
        .map(([lng, lat]) => [Number(lat), Number(lng)] as [number, number])
        .filter(([lat, lng]) => isValidCoord(lat, lng));
      if (latlngs.length < 2) return;

      const key = feederFeatureKey(feature, index);
      const name = String(feature.properties?.feeder_name || feature.properties?.name || 'فیدر ۲۰ کیلوولت');
      const color = softenFeederColor(feature.properties?.stroke_color);
      const selected = activeFeederKey === key;
      const faded = activeFeederKey != null && !selected;

      if (selected) {
        ignorePointer(L.polyline(latlngs, { color, weight: 8, opacity: 0.28, interactive: false }).addTo(layer));
      }

      ignorePointer(L.polyline(latlngs, {
        color,
        weight: selected ? 2.4 : 1.15,
        opacity: selected ? 0.95 : faded ? 0.08 : 0.2,
        interactive: false,
      }).addTo(layer));

      const hit = L.polyline(latlngs, { color, weight: 12, opacity: 0.01 });
      hit.bindTooltip(`<div class="text-[11px] font-bold" dir="rtl">${name}</div>`, { sticky: true });
      hit.on('click', (event) => {
        if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
        setActiveFeederKey((current) => (current === key ? null : key));
      });
      hit.addTo(layer);
    });
  }, [showFeeders, feederNetwork, activeFeederKey]);

  // ۶. رسم پین‌های ترانس‌ها با واکنش پویا به سطح زوم (Zoom Level)
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    transformers.forEach((t) => {
      if (!isValidCoord(t?.lat, t?.lng)) return;

      const { status, healthIndex } = calculateHealthIndex(t);

      if (filterStatus === 'critical' && status !== 'critical') return;
      if (filterStatus === 'warning' && status !== 'warning') return;
      if (filterStatus === 'healthy' && status !== 'healthy') return;

      const colors = {
        healthy: { bg: '#10b981', ring: 'rgba(16, 185, 129, 0.4)' },
        warning: { bg: '#f59e0b', ring: 'rgba(245, 158, 11, 0.4)' },
        critical: { bg: '#f43f5e', ring: 'rgba(244, 63, 94, 0.6)' },
      }[status];

      const isSelected = selectedTransformer?.id === t.id;
      const isDeepZoom = currentZoom >= 15; // زوم نزدیک، مثل عکس ارسالی شما

      const trIcon = L.divIcon({
        className: 'custom-tr-marker',
        html: `
          <div class="flex flex-col items-center">
            <div style="background:${colors.bg}; box-shadow: 0 0 0 ${isSelected ? '4px' : '2px'} ${colors.ring}, 0 0 12px ${colors.ring};"
                 class="flex h-5 w-5 items-center justify-center rounded-full font-mono text-[8px] font-semibold text-[#090a0f]">
              ${Math.round(healthIndex)}
            </div>
            ${isDeepZoom ? `
              <div class="mt-1 whitespace-nowrap rounded-full border border-slate-200 dark:border-[#1e2230] bg-white/95 dark:bg-[#11131a]/95 px-2 py-0.5 text-[9px] font-medium text-slate-700 dark:text-slate-200">
                ${t.name}
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [20, isDeepZoom ? 40 : 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([t.lat, t.lng], { icon: trIcon });

      const popupContent = document.createElement('div');
      popupContent.dir = 'rtl';
      popupContent.className = 'font-sans text-xs space-y-2 p-1 text-slate-100 min-w-[210px]';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-300 dark:border-slate-700 pb-1.5">
          <span class="font-bold text-sm text-cyan-400">${t.name}</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${status === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}">
            HI: ${Math.round(healthIndex)}%
          </span>
        </div>
        <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
          <div>ظرفیت: <b class="font-mono text-slate-800 dark:text-white">${t.capacityKva} kVA</b></div>
          <div>بار لحظه‌ای: <b class="font-mono ${t.currentLoadPercent > 100 ? 'text-rose-400 font-bold' : 'text-emerald-400'}">${t.currentLoadPercent}%</b></div>
          <div>سریال: <span class="font-mono text-[10px] text-slate-500 dark:text-slate-400">${t.serialNumber}</span></div>
          <div>ریسک خرابی: <b class="font-mono text-amber-400">${t.failureRisk30d}%</b></div>
        </div>
        <button id="btn-modal-${t.id}" class="mt-2 w-full rounded-full bg-cyan-500/15 py-1.5 text-center text-xs font-semibold text-cyan-300">
          مشاهده شناسنامه فنی و DGA
        </button>
      `;

      marker.bindPopup(popupContent, { className: 'custom-leaflet-popup' });
      marker.on('click', () => onSelectTransformer(t));
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-modal-${t.id}`);
        if (btn) btn.onclick = () => onOpenDetailModal(t);
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [transformers, showSubstations, filterStatus, selectedTransformer, currentZoom]);

  return (
    <div className="relative h-full min-h-[560px] w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-[#1e2230] bg-white dark:bg-[#090a0f]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {caption && (
        <div className="pointer-events-none absolute right-3 top-3 z-[400] rounded-full border border-slate-200 dark:border-[#1e2230] bg-white/80 dark:bg-[#090a0f]/80 px-3 py-1 text-[11px] text-slate-600 dark:text-slate-300 backdrop-blur-md">
          <span className="ml-2 font-mono text-[10px] tracking-widest text-emerald-400">GIS</span>
          {caption}
        </div>
      )}

      {showFeeders && feederStatus === 'loading' && (
        <div className="absolute bottom-4 left-4 z-[400] rounded-full border border-slate-200 dark:border-[#1e2230] bg-white/85 dark:bg-[#090a0f]/85 px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-300">
          در حال بارگذاری خطوط فیدر...
        </div>
      )}
      {showFeeders && feederStatus === 'error' && (
        <div className="absolute bottom-4 left-4 z-[400] max-w-xs rounded-full border border-rose-400/30 bg-white/90 dark:bg-[#090a0f]/90 px-3 py-1.5 text-[11px] text-rose-300">
          {feederError}
        </div>
      )}
      {feederStatus === 'ready' && showFeeders && (feederNetwork?.features?.length ?? 0) === 0 && (
        <div className="absolute bottom-4 left-4 z-[400] rounded-full border border-slate-200 dark:border-[#1e2230] bg-white/85 dark:bg-[#090a0f]/85 px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-300">
          خطی برای این امور در شبکه فیدر ثبت نشده است.
        </div>
      )}
      {activeFeederName && (
        <button
          type="button"
          onClick={() => setActiveFeederKey(null)}
          className="absolute bottom-4 right-3 z-[400] max-w-[70%] truncate rounded-full border border-cyan-400/30 bg-white/90 dark:bg-[#090a0f]/90 px-3 py-1.5 text-[11px] text-cyan-200"
        >
          {activeFeederName} · برداشتن درخشش
        </button>
      )}

      <div className="absolute inset-x-3 top-3 z-[400] flex flex-col items-start gap-1.5">
        <div className="flex max-w-full flex-wrap items-center gap-0.5 rounded-2xl border border-slate-200 dark:border-[#1e2230] bg-white/88 dark:bg-[#090a0f]/88 p-1 shadow-lg backdrop-blur-md">
          <MapChip active={filterStatus === 'all'} onClick={() => setFilterStatus('all')}>همه {transformers.length}</MapChip>
          <MapChip active={filterStatus === 'critical'} tone="rose" onClick={() => setFilterStatus('critical')}>بحرانی</MapChip>
          <MapChip active={filterStatus === 'warning'} tone="amber" onClick={() => setFilterStatus('warning')}>هشدار</MapChip>
          <MapChip active={filterStatus === 'healthy'} tone="emerald" onClick={() => setFilterStatus('healthy')}>مطلوب</MapChip>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-0.5 rounded-2xl border border-slate-200 dark:border-[#1e2230] bg-white/88 dark:bg-[#090a0f]/88 p-1 shadow-lg backdrop-blur-md">
          <MapChip active={showSubstations} onClick={() => setShowSubstations(!showSubstations)}>
            <Zap size={12} strokeWidth={1.75} /> پست
          </MapChip>
          <MapChip
            active={showFeeders}
            onClick={() => {
              setShowFeeders((current) => {
                if (current) setActiveFeederKey(null);
                return !current;
              });
            }}
          >
            <Layers size={12} strokeWidth={1.75} /> فیدر
          </MapChip>
          <span className="mx-0.5 h-3 w-px bg-[#1e2230]" />
          <MapChip active={mapTheme === 'dark'} onClick={() => setMapTheme('dark')}>تاریک</MapChip>
          <MapChip active={mapTheme === 'satellite'} onClick={() => setMapTheme('satellite')}>ماهواره</MapChip>
          <MapChip active={mapTheme === 'streets'} onClick={() => setMapTheme('streets')}>معابر</MapChip>
        </div>
      </div>
    </div>
  );
};

function ignorePointer(line: L.Polyline) {
  const element = line.getElement();
  if (element) element.style.pointerEvents = 'none';
  return line;
}

function feederFeatureKey(feature: FeederNetworkFeature, index: number) {
  const id = feature.properties?.feeder_id ?? feature.id;
  return id != null && id !== '' ? String(id) : `line-${index}`;
}

function softenFeederColor(stroke: unknown) {
  if (stroke === '#0000ff' || stroke === '#00f' || stroke === 'blue') return '#22d3ee';
  if (stroke === '#ff0000' || stroke === '#f00' || stroke === 'red') return '#fb7185';
  return typeof stroke === 'string' && stroke ? stroke : '#22d3ee';
}

function MapChip({
  active,
  tone = 'cyan',
  onClick,
  children,
}: {
  active: boolean;
  tone?: 'cyan' | 'rose' | 'amber' | 'emerald';
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeTone = {
    cyan: 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)]',
    rose: 'border-rose-300/30 bg-rose-400/15 text-rose-100',
    amber: 'border-amber-300/30 bg-amber-400/15 text-amber-100',
    emerald: 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 ${
        active ? activeTone : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
