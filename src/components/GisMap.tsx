/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  Compass, 
  Eye, 
  ExternalLink, 
  Activity, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { TransformerData, calculateHealthIndex, calculateFailureRisk, toPersianDigits } from '../utils/healthIndex';
import { Substation, Feeder } from '../data/qazvinGridData';

interface GisMapProps {
  transformers: TransformerData[];
  substations: Substation[];
  feeders: Feeder[];
  selectedTransformer: TransformerData | null;
  onSelectTransformer: (t: TransformerData) => void;
  onOpenDetailModal: (t: TransformerData) => void;
  centerCoordinates?: [number, number];
}

type MapTheme = 'dark' | 'satellite' | 'streets';

export const GisMap: React.FC<GisMapProps> = ({
  transformers,
  substations,
  feeders,
  selectedTransformer,
  onSelectTransformer,
  onOpenDetailModal,
  centerCoordinates = [36.275, 50.005],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const substationsLayerRef = useRef<L.LayerGroup | null>(null);
  const feedersLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
  const [showSubstations, setShowSubstations] = useState<boolean>(true);
  const [showFeeders, setShowFeeders] = useState<boolean>(true);
  const [activeFilterStatus, setActiveFilterStatus] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');

  // Tile layer URLs - clean free providers without watermark
  const getTileUrl = (theme: MapTheme) => {
    switch (theme) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
      case 'dark':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileAttribution = (theme: MapTheme) => {
    switch (theme) {
      case 'satellite':
        return '&copy; Esri &mdash; World Imagery';
      case 'streets':
      case 'dark':
      default:
        return '&copy; OpenStreetMap contributors';
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: centerCoordinates,
      zoom: 11,
      zoomControl: false, // Custom styled zoom controls
      attributionControl: false,
    });

    const tileLayer = L.tileLayer(getTileUrl(mapTheme), {
      attribution: getTileAttribution(mapTheme),
      maxZoom: 19,
      className: mapTheme === 'dark' ? 'dark-leaflet-tiles' : '',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer groups for markers and overlays
    const markersLayer = L.layerGroup().addTo(map);
    const substationsLayer = L.layerGroup().addTo(map);
    const feedersLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = markersLayer;
    substationsLayerRef.current = substationsLayer;
    feedersLayerRef.current = feedersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Map Theme change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(getTileUrl(mapTheme), {
      attribution: getTileAttribution(mapTheme),
      maxZoom: 19,
      className: mapTheme === 'dark' ? 'dark-leaflet-tiles' : '',
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapTheme]);

  // Center update when centerCoordinates change (e.g. region selector)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(centerCoordinates, 11, { animate: true });
  }, [centerCoordinates[0], centerCoordinates[1]]);

  // Render Substations and Feeder lines
  useEffect(() => {
    if (!mapInstanceRef.current || !substationsLayerRef.current || !feedersLayerRef.current) return;

    substationsLayerRef.current.clearLayers();
    feedersLayerRef.current.clearLayers();

    if (showSubstations) {
      substations.forEach((sub) => {
        const subIcon = L.divIcon({
          className: 'custom-substation-pin',
          html: `
            <div style="position:relative; display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:#0284c7; border:2px solid #ffffff; border-radius:8px; box-shadow:0 0 12px rgba(2,132,199,0.7); cursor:pointer;">
              <span style="font-size:16px; font-weight:bold; color:#fff;">⚡</span>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker(sub.coordinates, { icon: subIcon });
        marker.bindTooltip(`
          <div style="direction:rtl; font-family:Vazirmatn, sans-serif; text-align:right; padding:4px;">
            <div style="font-weight:bold; color:#0284c7;">${sub.name}</div>
            <div style="font-size:11px; color:#cbd5e1;">ظرفیت: ${toPersianDigits(sub.capacityMva)} MVA | ولتاژ: ${sub.voltageKv}</div>
            <div style="font-size:11px; color:#94a3b8;">تعداد فیدر خروجی: ${toPersianDigits(sub.feederCount)}</div>
          </div>
        `, { direction: 'top', className: 'dark-tooltip' });

        substationsLayerRef.current?.addLayer(marker);
      });
    }

    if (showFeeders && showSubstations) {
      // Draw simulated 20kV feeder lines connecting substations to nearby transformers
      transformers.forEach((t) => {
        const sub = substations.find((s) => s.id === t.substationId);
        if (sub) {
          const polyline = L.polyline([sub.coordinates, t.coordinates], {
            color: t.currentLoadPercent > 100 ? '#f43f5e' : '#0ea5e9',
            weight: 2,
            opacity: 0.45,
            dashArray: '4, 6',
          });
          feedersLayerRef.current?.addLayer(polyline);
        }
      });
    }
  }, [substations, transformers, showSubstations, showFeeders]);

  // Render Transformer Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    const filtered = transformers.filter((t) => {
      const { status } = calculateHealthIndex(t);
      if (activeFilterStatus === 'critical') return status === 'critical';
      if (activeFilterStatus === 'warning') return status === 'warning';
      if (activeFilterStatus === 'normal') return status === 'normal';
      return true;
    });

    filtered.forEach((t) => {
      const { healthIndex, status } = calculateHealthIndex(t);
      const { risk30Days, riskLevelText } = calculateFailureRisk(healthIndex, t.currentLoadPercent, t.overloadCount30d);

      let pinColor = '#10b981'; // Green
      let glowColor = 'rgba(16, 185, 129, 0.4)';
      let pulseAnim = '';

      if (status === 'critical') {
        pinColor = '#f43f5e'; // Red
        glowColor = 'rgba(244, 63, 94, 0.6)';
        pulseAnim = 'animation: pulse-ring 1.8s infinite;';
      } else if (status === 'warning') {
        pinColor = '#f59e0b'; // Amber
        glowColor = 'rgba(245, 158, 11, 0.5)';
      }

      const isSelected = selectedTransformer?.id === t.id;
      const markerSize = isSelected ? 38 : 30;

      const iconHtml = `
        <div style="position:relative; width:${markerSize}px; height:${markerSize}px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
          ${status === 'critical' ? `<div style="position:absolute; inset:-4px; border-radius:50%; background:${pinColor}; opacity:0.3; ${pulseAnim}"></div>` : ''}
          <div style="width:${markerSize}px; height:${markerSize}px; border-radius:50%; background:#111827; border:3px solid ${pinColor}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 14px ${glowColor}; transform:${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition:all 0.2s ease;">
            <span style="font-family:JetBrains Mono, monospace; font-size:10px; font-weight:800; color:${pinColor};">
              ${toPersianDigits(healthIndex)}
            </span>
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        className: 'custom-transformer-pin',
        html: iconHtml,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      const marker = L.marker(t.coordinates, { icon: markerIcon });

      // Popover on click
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-3 text-right text-slate-100 min-w-[260px] font-sans';
      popupHtml.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #1e293b; padding-bottom:8px; margin-bottom:8px;">
          <span style="font-size:12px; font-weight:bold; color:#f1f5f9;">${t.name}</span>
          <span style="font-size:10px; font-family:JetBrains Mono, monospace; background:#1e293b; padding:2px 6px; border-radius:4px; color:#38bdf8;">${t.serialNumber}</span>
        </div>
        
        <div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">
          ${t.locationName}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px; font-size:11px;">
          <div style="background:#1e293b; padding:6px; border-radius:6px;">
            <div style="color:#94a3b8; font-size:10px;">شاخص سلامت (HI):</div>
            <div style="font-weight:bold; font-family:JetBrains Mono; color:${pinColor};">${toPersianDigits(healthIndex)}٪ (${status === 'critical' ? 'بحرانی' : status === 'warning' ? 'هشدار' : 'عالی'})</div>
          </div>
          <div style="background:#1e293b; padding:6px; border-radius:6px;">
            <div style="color:#94a3b8; font-size:10px;">درصد بار فعلی:</div>
            <div style="font-weight:bold; font-family:JetBrains Mono; color:${t.currentLoadPercent > 100 ? '#f43f5e' : '#38bdf8'};">${toPersianDigits(t.currentLoadPercent)}٪ (${toPersianDigits(t.capacityKva)} kVA)</div>
          </div>
          <div style="background:#1e293b; padding:6px; border-radius:6px;">
            <div style="color:#94a3b8; font-size:10px;">احتمال خرابی (۳۰ روز):</div>
            <div style="font-weight:bold; font-family:JetBrains Mono; color:${risk30Days > 50 ? '#f43f5e' : '#e2e8f0'};">${toPersianDigits(risk30Days)}٪</div>
          </div>
          <div style="background:#1e293b; padding:6px; border-radius:6px;">
            <div style="color:#94a3b8; font-size:10px;">دمای روغن:</div>
            <div style="font-weight:bold; font-family:JetBrains Mono; color:${t.oilTemperatureC > 85 ? '#f43f5e' : '#e2e8f0'};">${toPersianDigits(t.oilTemperatureC)}°C</div>
          </div>
        </div>

        <button id="btn-open-modal-${t.id}" style="width:100%; display:flex; align-items:center; justify-content:center; gap:6px; padding:6px 12px; background:#059669; color:#ffffff; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:none; transition:background 0.2s;">
          <span>مشاهده شناسنامه فنی و تله‌متری</span>
          <span>&larr;</span>
        </button>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 320 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-open-modal-${t.id}`);
        if (btn) {
          btn.onclick = () => {
            onOpenDetailModal(t);
          };
        }
      });

      marker.on('click', () => {
        onSelectTransformer(t);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [transformers, activeFilterStatus, selectedTransformer]);

  // Zoom handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    mapInstanceRef.current?.setView(centerCoordinates, 11, { animate: true });
  };

  return (
    <div className="relative flex h-[520px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-md dark:border-slate-800/80">
      
      {/* Map Control Overlay Header */}
      <div className="absolute top-3 right-3 left-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Toolbar: Layer & Status Filters */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#111827]/90 p-1.5 backdrop-blur-md shadow-lg">
          <button
            onClick={() => setActiveFilterStatus('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeFilterStatus === 'all'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            همه ({toPersianDigits(transformers.length)})
          </button>
          <button
            onClick={() => setActiveFilterStatus('critical')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
              activeFilterStatus === 'critical'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-rose-400/70 hover:text-rose-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            بحرانی
          </button>
          <button
            onClick={() => setActiveFilterStatus('warning')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
              activeFilterStatus === 'warning'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-amber-400/70 hover:text-amber-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            هشدار
          </button>
          <button
            onClick={() => setActiveFilterStatus('normal')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
              activeFilterStatus === 'normal'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-emerald-400/70 hover:text-emerald-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            مطلوب
          </button>
        </div>

        {/* Right Toolbar: Map Themes and Overlays */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#111827]/90 p-1.5 backdrop-blur-md shadow-lg">
          
          {/* Substation Toggle */}
          <button
            onClick={() => setShowSubstations(!showSubstations)}
            title="نمایش/عدم نمایش پست‌های ۶۳ کیلوولت"
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
              showSubstations
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px]">⚡</span>
            <span>پست‌ها</span>
          </button>

          {/* Feeder Lines Toggle */}
          <button
            onClick={() => setShowFeeders(!showFeeders)}
            title="نمایش خطوط فیدرهای ۲۰ کیلوولت"
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
              showFeeders
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3 w-3" />
            <span>فیدرها</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          {/* Map Layer Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMapTheme('dark')}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                mapTheme === 'dark' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              تاریک
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                mapTheme === 'satellite' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ماهواره
            </button>
            <button
              onClick={() => setMapTheme('streets')}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                mapTheme === 'streets' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              معابر
            </button>
          </div>
        </div>
      </div>

      {/* Map Zoom & Compass Tools */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          aria-label="بزرگ‌نمایی نقشه"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#111827]/90 text-slate-200 shadow-md hover:bg-slate-800"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          aria-label="کوچک‌نمایی نقشه"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#111827]/90 text-slate-200 shadow-md hover:bg-slate-800"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={handleResetView}
          aria-label="بازنشانی موقعیت به مرکز استان قزوین"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#111827]/90 text-slate-200 shadow-md hover:bg-slate-800"
          title="مرکز استان قزوین"
        >
          <Compass className="h-4 w-4 text-emerald-400" />
        </button>
      </div>

      {/* Map Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-[1000] hidden rounded-xl border border-slate-700/80 bg-[#111827]/90 p-2.5 text-right text-xs shadow-lg backdrop-blur-md sm:block">
        <div className="mb-1.5 text-[11px] font-bold text-slate-300">راهنمای علائم GIS</div>
        <div className="space-y-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-400 bg-emerald-500/20 text-[8px] font-bold text-emerald-400">HI</span>
            <span>شاخص سلامت مطلوب (HI &ge; ۸۰)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-amber-400 bg-amber-500/20 text-[8px] font-bold text-amber-400">HI</span>
            <span>نیازمند پایش و هشدار (۵۰ &le; HI &lt; ۸۰)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-rose-400 bg-rose-500/20 text-[8px] font-bold text-rose-400">HI</span>
            <span>بحرانی / اضافه بار شدید (HI &lt; ۵۰)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-sky-600 text-[10px] font-bold text-white">⚡</span>
            <span>پست فوق توزیع ۶۳/۲۰ کیلوولت</span>
          </div>
        </div>
      </div>

      {/* Actual Map Container */}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};
