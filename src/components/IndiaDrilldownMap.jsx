import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, MapPin, RotateCcw } from 'lucide-react';

const INDIA_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/india.geojson';
const STATE_BASE = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/states';

const slugify = (name) => name
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const aliases = {
  'nct of delhi': 'delhi',
  'delhi': 'delhi',
  'jammu & kashmir': 'jammu-and-kashmir',
  'jammu and kashmir': 'jammu-and-kashmir',
  'dadra and nagar haveli and daman and diu': 'dadra-nagar-haveli-and-daman-diu',
  'dadra & nagar haveli and daman & diu': 'dadra-nagar-haveli-and-daman-diu',
};

function stateName(feature) {
  const p = feature?.properties || {};
  return p.ST_NM || p.st_nm || p.NAME_1 || p.name || p.State || p.state || p.STATE || 'Unknown';
}

function featureName(feature) {
  const p = feature?.properties || {};
  return p.district || p.DISTRICT || p.NAME_2 || p.name || p.Name || p.NAME || 'District';
}

function collectPoints(geometry, out = []) {
  if (!geometry) return out;
  if (geometry.type === 'Point') out.push(geometry.coordinates);
  if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') out.push(...geometry.coordinates);
  if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') geometry.coordinates.forEach((x) => collectPoints({ type: Array.isArray(x?.[0]) && Array.isArray(x?.[0]?.[0]) ? 'Polygon' : 'LineString', coordinates: x }, out));
  if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach((x) => collectPoints({ type: 'Polygon', coordinates: x }, out));
  return out;
}

function bounds(features) {
  const points = [];
  features.forEach((f) => collectPoints(f.geometry, points));
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function projectFactory(features, width, height, pad = 22) {
  const b = bounds(features);
  const dx = Math.max(b.maxX - b.minX, 0.1);
  const dy = Math.max(b.maxY - b.minY, 0.1);
  const scale = Math.min((width - pad * 2) / dx, (height - pad * 2) / dy);
  const ox = (width - dx * scale) / 2;
  const oy = (height - dy * scale) / 2;
  return ([lon, lat]) => [ox + (lon - b.minX) * scale, height - (oy + (lat - b.minY) * scale)];
}

function ringPath(ring, project) {
  return ring.map((point, i) => {
    const [x, y] = project(point);
    return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ') + ' Z';
}

function geometryPath(geometry, project) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') return geometry.coordinates.map((r) => ringPath(r, project)).join(' ');
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat().map((r) => ringPath(r, project)).join(' ');
  return '';
}

export default function IndiaDrilldownMap({ projects = [], selectedState = '', onStateChange, onDistrictSelect }) {
  const [level, setLevel] = useState(selectedState ? 'state' : 'india');
  const [activeState, setActiveState] = useState(selectedState || '');
  const [geo, setGeo] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const url = level === 'india'
      ? INDIA_URL
      : `${STATE_BASE}/${aliases[activeState.toLowerCase()] || slugify(activeState)}.geojson`;
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error('Map data unavailable'); return r.json(); })
      .then((data) => { if (!cancelled) setGeo(data); })
      .catch(() => { if (!cancelled) setError('Map data could not be loaded.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [level, activeState]);

  const features = useMemo(() => geo?.features || [], [geo]);
  const width = 900;
  const height = level === 'india' ? 430 : 410;
  const project = useMemo(() => features.length ? projectFactory(features, width, height, 28) : null, [features]);

  const projectCount = (name) => projects.filter((p) => p.state?.toLowerCase() === name?.toLowerCase()).length;
  const districtCount = (name) => projects.filter((p) => p.district?.toLowerCase() === name?.toLowerCase()).length;

  const enterState = (name) => {
    setActiveState(name);
    setLevel('state');
    setHovered(null);
    onStateChange?.(name);
  };

  const reset = () => {
    setActiveState('');
    setLevel('india');
    setHovered(null);
    onStateChange?.('');
  };

  return (
    <div className="real-map-shell">
      <div className="real-map-toolbar">
        <div>
          <span className="eyebrow">GEOGRAPHIC PROJECT EXPLORER</span>
          <div className="real-map-title-row">
            {level === 'state' && <button className="map-back" onClick={reset} aria-label="Back to India"><ArrowLeft size={15} /></button>}
            <strong>{level === 'india' ? 'India' : activeState}</strong>
          </div>
          <small>{level === 'india' ? 'Select a state to explore public works' : 'Select a district to explore works in this state'}</small>
        </div>
        {level === 'state' && <button className="map-reset" onClick={reset}><RotateCcw size={13} /> India</button>}
      </div>

      <div className="real-map-canvas">
        {loading && <div className="map-loading"><Loader2 size={22} className="spin" /> Loading geographic boundaries…</div>}
        {error && <div className="map-loading map-error">{error}</div>}
        {!loading && !error && project && (
          <svg viewBox={`0 0 ${width} ${height}`} className="india-svg" role="img" aria-label={`${level === 'india' ? 'India states' : activeState + ' districts'} map`}>
            {features.map((feature, index) => {
              const name = level === 'india' ? stateName(feature) : featureName(feature);
              const selected = level === 'india' && name.toLowerCase() === activeState.toLowerCase();
              const hoveredHere = hovered?.index === index;
              return (
                <g key={`${name}-${index}`}>
                  <path
                    d={geometryPath(feature.geometry, project)}
                    className={`geo-shape ${selected ? 'selected' : ''} ${hoveredHere ? 'hovered' : ''}`}
                    onMouseEnter={() => setHovered({ index, name })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => level === 'state' ? onDistrictSelect?.(name) : enterState(name)}
                    role={level === 'india' ? 'button' : 'button'}
                    style={level === 'state' ? {cursor:'pointer'} : {}}
                  />
                </g>
              );
            })}
            
            {level === 'state' && features.length > 0 && project && projects.filter(p => p.state?.toLowerCase() === activeState.toLowerCase()).map((p, idx) => {
              // Find a rough center of the district feature
              const districtFeature = features.find(f => featureName(f).toLowerCase() === p.district?.toLowerCase());
              if (!districtFeature || !project) return null;
              // Get center point by averaging bounds
              const pts = collectPoints(districtFeature.geometry);
              if (!pts.length) return null;
              const cx = pts.reduce((s,c) => s+c[0], 0) / pts.length;
              const cy = pts.reduce((s,c) => s+c[1], 0) / pts.length;
              const [sx, sy] = project([cx, cy]);
              // Offset slightly by index to avoid overlap
              const ox = (idx % 3 - 1) * 6;
              const oy = Math.floor(idx / 3) % 3 * 6 - 6;
              const sectorColor = p.sector?.includes('Water') ? '#06b6d4' : p.sector?.includes('Road') ? '#f97316' : p.sector?.includes('Health') ? '#ec4899' : p.sector?.includes('Education') ? '#8b5cf6' : '#10b981';
              return (
                <circle
                  key={`gm-${p.id}`}
                  cx={sx + ox}
                  cy={sy + oy}
                  r={5}
                  fill={sectorColor}
                  opacity={0.75}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={0.8}
                  style={{cursor:'pointer'}}
                  onMouseEnter={() => setHovered({ index: -idx-1, name: `${p.id}: ${p.name}` })}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

          </svg>
        )}

        {hovered && (
          <div className="map-tooltip" style={{ left: `${Math.min(Math.max((hovered.x || 0) + 18, 12), 78)}%`, top: '16%' }}>
            <b>{hovered.name}</b>
            <span>{level === 'india' ? `${projectCount(hovered.name)} public works` : `${districtCount(hovered.name)} works in current data`}</span>
          </div>
        )}

        {level === 'india' && features.length > 0 && (
          <div className="map-legend"><span><i className="legend-dot" /> Public works</span><span>Click a state to drill down</span></div>
        )}
      </div>

      {level === 'state' && (
        <div className="map-selection-card">
          <div><span className="eyebrow">SELECTED STATE</span><b>{activeState}</b><small>{projects.filter((p) => p.state?.toLowerCase() === activeState.toLowerCase()).length} works in current data</small></div>
          <button onClick={() => window.location.hash = '#works'}>Explore works <MapPin size={14} /></button>
        </div>
      )}
    </div>
  );
}
