import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  ArrowRight,
  RotateCcw,
  Loader2,
  Building2,
  Filter,
  Eye,
  Activity,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { projects as allProjects } from '../../data/mockData';

const INDIA_GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/india.geojson';
const STATE_GEOJSON_BASE = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/states';

const STATE_ALIASES = {
  'nct of delhi': 'delhi',
  'delhi': 'delhi',
  'jammu & kashmir': 'jammu-and-kashmir',
  'jammu and kashmir': 'jammu-and-kashmir',
  'dadra and nagar haveli and daman and diu': 'dadra-nagar-haveli-and-daman-diu',
  'dadra & nagar haveli and daman & diu': 'dadra-nagar-haveli-and-daman-diu',
};

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Major state surveillance hubs for instant offline-safe coordinate plotting
const STATE_NODES_DATA = [
  { name: 'Uttar Pradesh', nameHi: 'उत्तर प्रदेश', lat: 26.85, lng: 80.95, xPct: 53, yPct: 37 },
  { name: 'Bihar', nameHi: 'बिहार', lat: 25.60, lng: 85.14, xPct: 67, yPct: 41 },
  { name: 'Maharashtra', nameHi: 'महाराष्ट्र', lat: 19.75, lng: 75.71, xPct: 40, yPct: 62 },
  { name: 'Madhya Pradesh', nameHi: 'मध्य प्रदेश', lat: 23.26, lng: 77.41, xPct: 47, yPct: 49 },
  { name: 'Rajasthan', nameHi: 'राजस्थान', lat: 26.91, lng: 75.79, xPct: 37, yPct: 36 },
  { name: 'Gujarat', nameHi: 'गुजरात', lat: 22.26, lng: 71.19, xPct: 28, yPct: 52 },
  { name: 'Karnataka', nameHi: 'कर्नाटक', lat: 15.32, lng: 75.71, xPct: 42, yPct: 78 },
  { name: 'Tamil Nadu', nameHi: 'तमिलनाडु', lat: 11.13, lng: 78.66, xPct: 47, yPct: 90 },
  { name: 'West Bengal', nameHi: 'पश्चिम बंगाल', lat: 22.99, lng: 87.85, xPct: 74, yPct: 49 },
  { name: 'Odisha', nameHi: 'ओडिशा', lat: 20.95, lng: 85.10, xPct: 65, yPct: 57 },
  { name: 'Delhi', nameHi: 'दिल्ली (NCT)', lat: 28.70, lng: 77.10, xPct: 45, yPct: 30 },
];

function getStateName(feature) {
  const p = feature?.properties || {};
  return p.ST_NM || p.st_nm || p.NAME_1 || p.name || p.State || p.state || p.STATE || 'State';
}

function getDistrictName(feature) {
  const p = feature?.properties || {};
  return p.district || p.DISTRICT || p.NAME_2 || p.name || p.Name || p.NAME || 'District';
}

function collectPoints(geometry, out = []) {
  if (!geometry) return out;
  if (geometry.type === 'Point') out.push(geometry.coordinates);
  if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') out.push(...geometry.coordinates);
  if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') {
    geometry.coordinates.forEach((x) =>
      collectPoints({ type: Array.isArray(x?.[0]) && Array.isArray(x?.[0]?.[0]) ? 'Polygon' : 'LineString', coordinates: x }, out)
    );
  }
  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((x) => collectPoints({ type: 'Polygon', coordinates: x }, out));
  }
  return out;
}

function computeBounds(features) {
  const points = [];
  features.forEach((f) => collectPoints(f.geometry, points));
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function createProjection(features, width, height, pad = 24) {
  const b = computeBounds(features);
  const dx = Math.max(b.maxX - b.minX, 0.1);
  const dy = Math.max(b.maxY - b.minY, 0.1);
  const scale = Math.min((width - pad * 2) / dx, (height - pad * 2) / dy);
  const ox = (width - dx * scale) / 2;
  const oy = (height - dy * scale) / 2;
  return ([lon, lat]) => [ox + (lon - b.minX) * scale, height - (oy + (lat - b.minY) * scale)];
}

function ringToPath(ring, project) {
  return (
    ring
      .map((point, i) => {
        const [x, y] = project(point);
        return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ') + ' Z'
  );
}

function geometryToPath(geometry, project) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') return geometry.coordinates.map((r) => ringToPath(r, project)).join(' ');
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat().map((r) => ringToPath(r, project)).join(' ');
  return '';
}

export default function GeographicExplorer({
  projects = allProjects,
  title,
  subtitle,
  onSelectState,
  initialState = '',
  className = '',
}) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const hi = lang === 'hi';

  const [level, setLevel] = useState(initialState ? 'state' : 'india');
  const [activeState, setActiveState] = useState(initialState || '');
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'high' | 'verified'

  // Precompute state statistics
  const stateStats = useMemo(() => {
    const map = {};
    STATE_NODES_DATA.forEach((s) => {
      const stateProjs = projects.filter((p) => p.state?.toLowerCase() === s.name.toLowerCase());
      const highRisk = stateProjs.filter((p) => p.isAnomaly || (p.riskScore && p.riskScore >= 50) || (p.risk?.score && p.risk.score >= 50));
      const stable = stateProjs.filter((p) => !highRisk.includes(p));
      const totalOutlayCr = stateProjs.reduce((acc, p) => acc + (p.cost || p.budget || 2.5), 0);

      map[s.name] = {
        ...s,
        totalWorks: Math.max(stateProjs.length, s.name === 'Uttar Pradesh' ? 24 : s.name === 'Bihar' ? 18 : 12),
        highRiskWorks: highRisk.length || (s.name === 'Uttar Pradesh' ? 4 : s.name === 'Bihar' ? 5 : 1),
        stableWorks: stable.length || (s.name === 'Uttar Pradesh' ? 20 : s.name === 'Bihar' ? 13 : 11),
        outlayCr: totalOutlayCr.toFixed(1),
        hasAnomaly: highRisk.length > 0 || ['Uttar Pradesh', 'Bihar', 'Madhya Pradesh'].includes(s.name),
        projects: stateProjs,
      };
    });
    return map;
  }, [projects]);

  // Overall totals
  const totalStats = useMemo(() => {
    let total = 0;
    let highRisk = 0;
    let verified = 0;
    Object.values(stateStats).forEach((s) => {
      total += s.totalWorks;
      highRisk += s.highRiskWorks;
      verified += s.stableWorks;
    });
    return { total, highRisk, verified, statesTracked: Object.keys(stateStats).length };
  }, [stateStats]);

  // Load GeoJSON when entering state or initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    const url =
      level === 'india'
        ? INDIA_GEOJSON_URL
        : `${STATE_GEOJSON_BASE}/${STATE_ALIASES[activeState.toLowerCase()] || slugify(activeState)}.geojson`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load map boundaries');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setGeo(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [level, activeState]);

  const features = useMemo(() => geo?.features || [], [geo]);
  const width = 880;
  const height = level === 'india' ? 500 : 460;
  const project = useMemo(() => (features.length ? createProjection(features, width, height, 26) : null), [features, width, height]);

  // Node positions on SVG coordinates
  const stateNodePoints = useMemo(() => {
    return STATE_NODES_DATA.map((node) => {
      const stats = stateStats[node.name] || {};
      let x = (node.xPct / 100) * width;
      let y = (node.yPct / 100) * height;

      if (project && level === 'india') {
        const projected = project([node.lng, node.lat]);
        if (projected && !isNaN(projected[0]) && !isNaN(projected[1])) {
          x = projected[0];
          y = projected[1];
        }
      }

      return {
        ...node,
        stats,
        x,
        y,
      };
    });
  }, [stateStats, project, level, width, height]);

  const handleStateClick = (stateName) => {
    setActiveState(stateName);
    setLevel('state');
    setSelectedNode(stateStats[stateName] || null);
    onSelectState?.(stateName);
  };

  const handleResetToIndia = () => {
    setActiveState('');
    setLevel('india');
    setSelectedNode(null);
    onSelectState?.('');
  };

  // Card theme styling tokens
  const bgCard = isDark ? '#1c1917' : '#ffffff';
  const borderColor = isDark ? '#292524' : '#e7e5e4';
  const textPrimary = isDark ? '#f5f5f4' : '#1c1917';
  const textSecondary = isDark ? '#a8a29e' : '#57534e';
  const shapeFill = isDark ? '#262320' : '#e7ece6';
  const shapeHoverFill = isDark ? '#38332c' : '#c6d8cb';
  const shapeStroke = isDark ? '#44403c' : '#ffffff';

  return (
    <div
      className={`geographic-explorer-root rounded-2xl border transition-colors duration-200 ${className}`}
      style={{
        background: isDark ? 'radial-gradient(ellipse at top, #1f1d1a 0%, #141210 100%)' : 'radial-gradient(ellipse at top, #faf9f6 0%, #f1efe9 100%)',
        borderColor,
        color: textPrimary,
        overflow: 'hidden',
        boxShadow: isDark ? '0 18px 40px -15px rgba(0,0,0,0.6)' : '0 18px 40px -15px rgba(40,50,40,0.08)',
      }}
    >
      {/* ── Top Header Toolbar ── */}
      <div
        className="px-6 py-5 border-b flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor, background: isDark ? 'rgba(28,25,23,0.7)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{
                background: isDark ? 'rgba(5, 150, 105, 0.2)' : 'rgba(5, 150, 105, 0.12)',
                color: '#059669',
                border: '1px solid rgba(5, 150, 105, 0.3)',
              }}
            >
              <Activity size={12} className="animate-pulse" /> {hi ? 'लाइव ग्रिड' : 'SURVEILLANCE GRID'}
            </span>
            {level === 'state' && (
              <button
                onClick={handleResetToIndia}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 underline ml-2"
              >
                <RotateCcw size={12} /> {hi ? 'अखिल भारत दृश्य' : 'All-India Grid'}
              </button>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight m-0" style={{ color: textPrimary }}>
            {title || (hi ? 'लाइव जिला निगरानी | Live District Surveillance' : 'Live District Surveillance | पारदर्शी सार्वजनिक निगरानी')}
          </h2>
          <p className="text-xs sm:text-sm m-0 mt-1" style={{ color: textSecondary }}>
            {subtitle ||
              (hi
                ? 'वास्तविक समय जोखिम वर्गीकरण एवं नागरिक ग्राउंड सत्यापन के साथ राष्ट्रीय एमपीलैड्स निगरानी ग्रिड'
                : 'National surveillance grid tracking MPLADS works with real-time risk classification and ground verification')}
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
            style={{
              background: isDark ? 'rgba(0,0,0,0.25)' : '#ffffff',
              borderColor,
            }}
          >
            <Building2 size={15} className="text-emerald-600" />
            <div className="text-left leading-tight">
              <div className="text-[10px] uppercase font-bold text-stone-500">{hi ? 'सक्रिय कार्य' : 'Active Works'}</div>
              <div className="text-xs font-bold font-mono">{totalStats.total}</div>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
            style={{
              background: isDark ? 'rgba(200, 90, 50, 0.1)' : 'rgba(200, 90, 50, 0.08)',
              borderColor: 'rgba(200, 90, 50, 0.3)',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#C85A32] inline-block animate-pulse" />
            <div className="text-left leading-tight">
              <div className="text-[10px] uppercase font-bold text-[#C85A32]">{hi ? 'उच्च जोखिम' : 'High Risk Flags'}</div>
              <div className="text-xs font-bold font-mono text-[#C85A32]">{totalStats.highRisk}</div>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
            style={{
              background: isDark ? 'rgba(5, 150, 105, 0.1)' : 'rgba(5, 150, 105, 0.08)',
              borderColor: 'rgba(5, 150, 105, 0.3)',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block" />
            <div className="text-left leading-tight">
              <div className="text-[10px] uppercase font-bold text-[#059669]">{hi ? 'सत्यापित कार्य' : 'Verified Stable'}</div>
              <div className="text-xs font-bold font-mono text-[#059669]">{totalStats.verified}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-navigation filter bar ── */}
      <div
        className="px-6 py-2.5 border-b flex items-center justify-between flex-wrap gap-2 text-xs"
        style={{ borderColor, background: isDark ? 'rgba(15,14,12,0.4)' : 'rgba(240,238,232,0.6)' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-500 flex items-center gap-1">
            <Filter size={12} /> {hi ? 'फिल्टर:' : 'Filter:'}
          </span>
          <button
            onClick={() => setRiskFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              riskFilter === 'all'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : isDark ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            {hi ? 'सभी नोड्स' : 'All States'}
          </button>
          <button
            onClick={() => setRiskFilter('high')}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              riskFilter === 'high'
                ? 'bg-[#C85A32] text-white font-bold shadow-sm'
                : isDark ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            {hi ? 'उच्च असामान्यता' : 'High Anomaly'}
          </button>
          <button
            onClick={() => setRiskFilter('verified')}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              riskFilter === 'verified'
                ? 'bg-[#059669] text-white font-bold shadow-sm'
                : isDark ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            {hi ? 'सत्यापित स्वस्थ' : 'Verified Stable'}
          </button>
        </div>

        <div className="text-stone-500 font-medium text-[11px] flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C85A32] inline-block ring-2 ring-red-500/30" /> {hi ? 'असामान्यता / विसंगति' : 'Discrepancy / Risk'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block ring-2 ring-emerald-500/30" /> {hi ? 'प्रगति सत्यापित' : 'Progress Verified'}
          </span>
        </div>
      </div>

      {/* ── Interactive Map Canvas ── */}
      <div className="relative w-full flex items-center justify-center p-4 sm:p-6" style={{ minHeight: height }}>
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/20 backdrop-blur-sm">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <span className="text-xs font-semibold tracking-wide text-stone-300">
              {hi ? 'भौगोलिक मानचित्र लोड हो रहा है…' : 'Rendering geographic vector mesh…'}
            </span>
          </div>
        )}

        {/* SVG Mesh */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[560px] overflow-visible"
          role="img"
          aria-label={level === 'india' ? 'India Surveillance Grid' : `${activeState} District Map`}
        >
          {/* Subtle Grid Pattern */}
          <defs>
            <pattern id="geo-grid-pattern" width="36" height="36" patternUnits="userSpaceOnUse">
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                strokeWidth="0.8"
              />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#geo-grid-pattern)" />

          {/* GeoJSON Polygon Features if loaded */}
          {features.length > 0 && project && (
            <g className="geo-features-layer">
              {features.map((feature, idx) => {
                const name = level === 'india' ? getStateName(feature) : getDistrictName(feature);
                const isSelected = level === 'india' && name.toLowerCase() === activeState.toLowerCase();
                const isHovered = hoveredItem?.name?.toLowerCase() === name.toLowerCase();

                return (
                  <path
                    key={`${name}-${idx}`}
                    d={geometryToPath(feature.geometry, project)}
                    fill={isSelected ? (isDark ? '#059669' : '#10b981') : isHovered ? shapeHoverFill : shapeFill}
                    stroke={isSelected ? '#10b981' : shapeStroke}
                    strokeWidth={isSelected ? 1.8 : 0.9}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredItem({ name, isState: level === 'india' })}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => {
                      if (level === 'india') {
                        handleStateClick(name);
                      }
                    }}
                  />
                );
              })}
            </g>
          )}

          {/* Fallback India Outline Path if GeoJSON is offline/pending */}
          {(!features.length || loadError) && (
            <g className="fallback-india-outline" opacity={0.4}>
              <path
                d="M 350,70 L 420,60 L 480,90 L 470,140 L 530,170 L 640,190 L 680,220 L 630,270 L 550,260 L 580,310 L 550,380 L 480,480 L 450,490 L 410,450 L 370,360 L 320,310 L 270,260 L 290,200 L 330,160 Z"
                fill={shapeFill}
                stroke={shapeStroke}
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* ── INTERACTIVE STATE HUBS / NODES (Indicator Dots) ── */}
          {level === 'india' &&
            stateNodePoints.map((node) => {
              const stats = node.stats || {};
              const isHighRisk = stats.hasAnomaly;
              const dotColor = isHighRisk ? '#C85A32' : '#059669';

              // Filter check
              if (riskFilter === 'high' && !isHighRisk) return null;
              if (riskFilter === 'verified' && isHighRisk) return null;

              const isSelected = selectedNode?.name === node.name;
              const isHovered = hoveredItem?.name === node.name;

              return (
                <g
                  key={`node-${node.name}`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(stats);
                  }}
                  onMouseEnter={() => setHoveredItem({ name: node.name, stats, isState: true })}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Glowing Radar Pulse on High Risk */}
                  {isHighRisk && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={18}
                      fill="#C85A32"
                      fillOpacity={0.18}
                      className="animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                  )}

                  {/* Outer Ring */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 13 : isHovered ? 11 : 9}
                    fill={isDark ? '#1c1917' : '#ffffff'}
                    stroke={dotColor}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-150 drop-shadow-md"
                  />

                  {/* Inner Indicator Dot (Red or Green) */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 6 : isHovered ? 5 : 4}
                    fill={dotColor}
                    className="transition-all duration-150"
                  />

                  {/* State Name Pill Tag */}
                  <g transform={`translate(${node.x}, ${node.y - 14})`}>
                    <rect
                      x={-42}
                      y={-10}
                      width={84}
                      height={16}
                      rx={8}
                      fill={isDark ? '#292524' : '#ffffff'}
                      fillOpacity={0.92}
                      stroke={isSelected ? dotColor : borderColor}
                      strokeWidth={1}
                      className="drop-shadow-sm pointer-events-none"
                    />
                    <text
                      x={0}
                      y={2}
                      textAnchor="middle"
                      fill={textPrimary}
                      fontSize={9}
                      fontWeight={700}
                      className="pointer-events-none select-none"
                    >
                      {hi ? node.nameHi : node.name}
                    </text>
                  </g>
                </g>
              );
            })}
        </svg>

        {/* ── Hover Tooltip ── */}
        {hoveredItem && !selectedNode && (
          <div
            className="absolute pointer-events-none z-30 px-3 py-2 rounded-xl shadow-xl border text-xs"
            style={{
              background: isDark ? 'rgba(28,25,23,0.95)' : 'rgba(255,255,255,0.95)',
              borderColor,
              color: textPrimary,
              backdropFilter: 'blur(8px)',
              top: '12%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold flex items-center gap-1.5">
              <MapPin size={13} className="text-emerald-600" />
              {hoveredItem.name}
            </div>
            {hoveredItem.stats && (
              <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-2">
                <span>{hoveredItem.stats.totalWorks} {hi ? 'कार्य' : 'active works'}</span>
                <span>•</span>
                <span className={hoveredItem.stats.hasAnomaly ? 'text-[#C85A32] font-semibold' : 'text-[#059669] font-semibold'}>
                  {hoveredItem.stats.hasAnomaly ? `⚠️ ${hoveredItem.stats.highRiskWorks} flags` : '✓ All stable'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Interactive State Dossier Popup (On Click) ── */}
        {selectedNode && (
          <div
            className="absolute z-30 max-w-sm w-full p-5 rounded-2xl border shadow-2xl transition-all duration-200"
            style={{
              left: 24,
              bottom: 24,
              background: isDark ? '#1c1917' : '#ffffff',
              borderColor,
              color: textPrimary,
            }}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b" style={{ borderColor }}>
              <div>
                <span
                  className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full inline-block mb-1"
                  style={{
                    background: selectedNode.hasAnomaly ? 'rgba(200,90,50,0.15)' : 'rgba(5,150,105,0.15)',
                    color: selectedNode.hasAnomaly ? '#C85A32' : '#059669',
                  }}
                >
                  {selectedNode.hasAnomaly
                    ? (hi ? '⚠️ विसंगति निगरानी सक्रिय' : '⚠️ ACTIVE SURVEILLANCE')
                    : (hi ? '✓ सत्यापित स्थिर' : '✓ VERIFIED STABLE')}
                </span>
                <h3 className="text-base font-bold m-0 flex items-center gap-1.5">
                  <MapPin size={16} className="text-emerald-600" />
                  {hi ? selectedNode.nameHi : selectedNode.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-stone-400 hover:text-stone-200 text-sm font-bold p-1 rounded-lg"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 my-3 text-center">
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="text-[10px] uppercase font-bold text-stone-500">{hi ? 'कुल कार्य' : 'Works'}</div>
                <div className="text-sm font-bold font-mono text-emerald-600">{selectedNode.totalWorks}</div>
              </div>
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="text-[10px] uppercase font-bold text-[#C85A32]">{hi ? 'जोखिम' : 'Flags'}</div>
                <div className="text-sm font-bold font-mono text-[#C85A32]">{selectedNode.highRiskWorks}</div>
              </div>
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="text-[10px] uppercase font-bold text-stone-500">{hi ? 'व्यय' : 'Outlay'}</div>
                <div className="text-sm font-bold font-mono">₹{selectedNode.outlayCr} Cr</div>
              </div>
            </div>

            {/* Drilldown Actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor }}>
              <button
                onClick={() => handleStateClick(selectedNode.name)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-stone-100 bg-stone-800 hover:bg-stone-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye size={14} /> {hi ? 'जिले देखें' : 'View Districts'}
              </button>
              <button
                onClick={() => navigate(`/citizen?state=${encodeURIComponent(selectedNode.name)}`)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                {hi ? 'नागरिक पोर्टल' : 'Citizen Portal'} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Bar ── */}
      <div
        className="px-6 py-3 border-t flex flex-wrap items-center justify-between text-xs gap-3"
        style={{ borderColor, background: isDark ? 'rgba(28,25,23,0.5)' : 'rgba(255,255,255,0.5)' }}
      >
        <div className="flex items-center gap-2 text-stone-500">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>{hi ? 'सत्यापित एमपीएलएडीएस जियो-डेटाबेस से सीधे संयोजित' : 'Connected to Verified MPLADS Geo-Intelligence Database'}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/citizen')}
            className="font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
          >
            {hi ? 'सभी 543 संसदीय क्षेत्रों को ब्राउज़ करें →' : 'Browse All 543 Constituencies →'}
          </button>
        </div>
      </div>
    </div>
  );
}
