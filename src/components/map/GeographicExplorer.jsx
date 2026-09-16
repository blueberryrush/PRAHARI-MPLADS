import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowRight,
  RotateCcw,
  Loader2,
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
  if (!ring || ring.length < 2) return '';
  return ring.reduce((path, pt, idx) => {
    const [x, y] = project(pt);
    return `${path}${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }, '') + 'Z';
}

function geometryToPath(geometry, project) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) => ringToPath(ring, project)).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .map((polygon) => polygon.map((ring) => ringToPath(ring, project)).join(' '))
      .join(' ');
  }
  return '';
}

export default function GeographicExplorer({
  title,
  subtitle,
  initialState,
  onSelectState,
  onSelectDistrict,
  projects = allProjects,
  height = 540,
  width = 620,
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
  const projectPoint = useMemo(() => {
    if (!features.length) return () => [0, 0];
    return createProjection(features, width, height, 20);
  }, [features, width, height]);

  // Projected node coordinates for state nodes
  const stateNodePoints = useMemo(() => {
    return STATE_NODES_DATA.map((node) => {
      let x, y;
      if (features.length) {
        [x, y] = projectPoint([node.lng, node.lat]);
      } else {
        x = (node.xPct / 100) * width;
        y = (node.yPct / 100) * height;
      }
      return {
        ...node,
        x,
        y,
        stats: stateStats[node.name] || null,
      };
    });
  }, [features, projectPoint, width, height, stateStats]);

  const handleStateClick = (stateName) => {
    setActiveState(stateName);
    setLevel('state');
    setSelectedNode(null);
    onSelectState?.(stateName);
  };

  const handleDistrictClick = (districtName) => {
    onSelectDistrict?.(districtName, activeState);
    navigate(`/citizen?state=${encodeURIComponent(activeState)}&district=${encodeURIComponent(districtName)}`);
  };

  const handleResetToIndia = () => {
    setActiveState('');
    setLevel('india');
    setSelectedNode(null);
    onSelectState?.('');
  };

  // Theme styling tokens
  const borderColor = isDark ? '#292524' : '#e7e5e4';
  const textPrimary = isDark ? '#f5f5f4' : '#1c1917';
  const textSecondary = isDark ? '#a8a29e' : '#57534e';
  const shapeFill = isDark ? '#1E352B' : '#E7EFE9';
  const shapeHoverFill = isDark ? '#2E4A3D' : '#D1E7DD';
  const shapeStroke = isDark ? '#2D4F40' : '#CBD5E1';

  return (
    <div
      className={`geographic-explorer-root w-full ${className}`}
      style={{
        color: textPrimary,
      }}
    >
      {/* ── Clean Title Header ── */}
      <div className="mb-4 pb-4 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{
                background: 'rgba(5, 150, 105, 0.2)',
                color: '#059669',
                border: '1px solid rgba(5, 150, 105, 0.3)',
              }}
            >
              <Activity size={12} className="animate-pulse" /> {hi ? 'लाइव ग्रिड' : 'SURVEILLANCE GRID'}
            </span>
            {level === 'state' && (
              <button
                onClick={handleResetToIndia}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 underline ml-2 cursor-pointer"
              >
                <RotateCcw size={12} /> {hi ? 'अखिल भारत दृश्य' : 'All-India Grid'}
              </button>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight m-0 text-stone-100">
            {title || (hi ? 'लाइव जिला निगरानी | Live District Surveillance' : 'Live District Surveillance | पारदर्शी सार्वजनिक निगरानी')}
          </h2>
          <p className="text-xs sm:text-sm m-0 mt-1 text-stone-400">
            {subtitle ||
              (hi
                ? 'वास्तविक समय जोखिम वर्गीकरण एवं नागरिक ग्राउंड सत्यापन के साथ राष्ट्रीय एमपीलैड्स निगरानी ग्रिड'
                : 'National surveillance grid tracking MPLADS works with real-time risk classification and ground verification')}
          </p>
        </div>
      </div>

      {/* ── Interactive Map Canvas ── */}
      <div className="relative w-full flex items-center justify-center p-2 sm:p-4" style={{ minHeight: height }}>
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/20 backdrop-blur-sm rounded-xl">
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
          aria-label="Interactive India Geographic Explorer"
        >
          {/* Base Map Polygons */}
          {features.map((feature, idx) => {
            const name = level === 'india' ? getStateName(feature) : getDistrictName(feature);
            const pathData = geometryToPath(feature.geometry, projectPoint);
            const isHovered = hoveredItem?.name === name;

            return (
              <path
                key={`feature-${idx}-${name}`}
                d={pathData}
                fill={isHovered ? shapeHoverFill : shapeFill}
                stroke={shapeStroke}
                strokeWidth={level === 'india' ? 0.75 : 0.6}
                strokeLinejoin="round"
                className="transition-colors duration-150 cursor-pointer"
                onMouseEnter={() =>
                  setHoveredItem({
                    name,
                    isState: level === 'india',
                    stats: level === 'india' ? stateStats[name] : null,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => (level === 'india' ? handleStateClick(name) : handleDistrictClick(name))}
              />
            );
          })}

          {/* Fallback Outline if Vector fails to load */}
          {(!features.length || loadError) && !loading && (
            <g className="opacity-30">
              <rect
                x={width * 0.15}
                y={height * 0.12}
                width={width * 0.7}
                height={height * 0.76}
                rx={18}
                fill="none"
                stroke={borderColor}
                strokeDasharray="6 6"
              />
              <text x={width / 2} y={height / 2} textAnchor="middle" fill={textSecondary} fontSize={12} fontWeight={600}>
                {hi ? 'मानचित्र नोड्स सक्रिय हैं' : 'Interactive Mesh Active'}
              </text>
            </g>
          )}

          {/* ── INTERACTIVE STATE HUBS / NODES (Indicator Dots) ── */}
          {level === 'india' &&
            stateNodePoints.map((node) => {
              const stats = node.stats || {};
              const isHighRisk = stats.hasAnomaly;
              const dotColor = isHighRisk ? '#C85A32' : '#059669';

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
              background: isDark ? 'rgba(28,25,23,0.95)' : 'rgba(255,255,255,0.96)',
              borderColor,
              color: textPrimary,
              backdropFilter: 'blur(12px)',
              top: '16px',
              right: '16px',
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">
                  {hi ? 'राज्य निगरानी प्रोफाइल' : 'STATE SURVEILLANCE PROFILE'}
                </span>
                <h3 className="text-lg font-bold m-0 mt-0.5">{selectedNode.name}</h3>
                <div className="text-xs text-stone-400">{selectedNode.nameHi}</div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-stone-400 hover:text-stone-200 p-1 text-sm font-bold"
                aria-label="Close popup"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center my-3">
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="text-[10px] uppercase font-bold text-stone-500">{hi ? 'कार्य' : 'Works'}</div>
                <div className="text-sm font-bold font-mono">{selectedNode.totalWorks}</div>
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
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-stone-100 bg-stone-800 hover:bg-stone-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye size={14} /> {hi ? 'जिले देखें' : 'View Districts'}
              </button>
              <button
                onClick={() => navigate(`/citizen?state=${encodeURIComponent(selectedNode.name)}`)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {hi ? 'नागरिक पोर्टल' : 'Citizen Portal'} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
