import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, MapPin, RotateCcw, X, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function IndiaDrilldownMap({
  projects = [],
  selectedState = '',
  onStateChange,
  onDistrictSelect,
  userLocation = null,
  nearbyProjects = [],
  onProjectSelect,
}) {
  const navigate = useNavigate();
  const [level, setLevel] = useState(selectedState ? 'state' : 'india');
  const [activeState, setActiveState] = useState(selectedState || '');
  const [geo, setGeo] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPinProject, setSelectedPinProject] = useState(null);

  useEffect(() => {
    if (selectedState && selectedState !== activeState) {
      setActiveState(selectedState);
      setLevel('state');
    }
  }, [selectedState]);

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

  // Calculate User Location Coordinates on current projection
  const userPoint = useMemo(() => {
    if (!userLocation || !project || !features.length) return null;
    const b = bounds(features);
    if (
      userLocation.lng < b.minX - 0.5 || userLocation.lng > b.maxX + 0.5 ||
      userLocation.lat < b.minY - 0.5 || userLocation.lat > b.maxY + 0.5
    ) {
      return null;
    }
    const [ux, uy] = project([userLocation.lng, userLocation.lat]);
    return { x: ux, y: uy };
  }, [userLocation, project, features]);

  // Project Nearby Projects with risk classification
  const renderedNearby = useMemo(() => {
    const list = nearbyProjects.length > 0 ? nearbyProjects : projects;
    if (!list.length || !project || !features.length) return [];
    const b = bounds(features);

    return list
      .filter((p) => p.latitude != null && p.longitude != null &&
        p.longitude >= b.minX - 0.4 && p.longitude <= b.maxX + 0.4 &&
        p.latitude >= b.minY - 0.4 && p.latitude <= b.maxY + 0.4
      )
      .map((p) => {
        const [px, py] = project([p.longitude, p.latitude]);
        const isHigh = p.isAnomaly || (p.riskScore && p.riskScore >= 50);
        const isMed = !isHigh && (p.riskScore && p.riskScore >= 30);
        const riskLevel = isHigh ? 'high' : isMed ? 'medium' : 'low';
        const riskColor = isHigh ? '#C85A32' : isMed ? '#D97706' : '#059669';
        return {
          ...p,
          x: px,
          y: py,
          riskLevel,
          riskColor,
        };
      });
  }, [nearbyProjects, projects, project, features]);

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

      <div className="real-map-canvas" style={{ position: 'relative' }}>
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
                    role="button"
                    style={level === 'state' ? { cursor: 'pointer' } : {}}
                  />
                </g>
              );
            })}

            {/* Render Standard Projects when no explicit nearby list */}
            {level === 'state' && features.length > 0 && renderedNearby.length === 0 && projects.filter(p => p.state?.toLowerCase() === activeState.toLowerCase()).map((p, idx) => {
              const districtFeature = features.find(f => featureName(f).toLowerCase() === p.district?.toLowerCase());
              if (!districtFeature || !project) return null;
              const pts = collectPoints(districtFeature.geometry);
              if (!pts.length) return null;
              const cx = pts.reduce((s, c) => s + c[0], 0) / pts.length;
              const cy = pts.reduce((s, c) => s + c[1], 0) / pts.length;
              const [sx, sy] = project([cx, cy]);
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
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHovered({ index: -idx - 1, name: `${p.id}: ${p.name}` })}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {/* Nearby Projects Markers (Color-coded by Risk) */}
            {renderedNearby.map((p) => {
              const isSelected = selectedPinProject?.id === p.id;
              return (
                <g
                  key={`nearby-pin-${p.id}`}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPinProject(p);
                    onProjectSelect?.(p);
                  }}
                  onMouseEnter={() => setHovered({ name: `${p.name} · ${p.distanceFormatted || p.sector}`, id: p.id })}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Selected halo */}
                  {isSelected && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={14}
                      fill={p.riskColor}
                      fillOpacity={0.25}
                      stroke={p.riskColor}
                      strokeWidth={1.5}
                    />
                  )}
                  {/* Outer circle */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={7}
                    fill={p.riskColor}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  {/* Center dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={2.5}
                    fill="#ffffff"
                  />
                </g>
              );
            })}

            {/* User Location Pulsing Marker */}
            {userPoint && (
              <g
                className="user-location-marker"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPinProject({ isUser: true });
                }}
              >
                {/* Pulsing ring */}
                <circle
                  cx={userPoint.x}
                  cy={userPoint.y}
                  r={16}
                  fill="#2563eb"
                  fillOpacity={0.25}
                  className="user-loc-pulse"
                />
                {/* Main pin body */}
                <circle
                  cx={userPoint.x}
                  cy={userPoint.y}
                  r={6.5}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <circle
                  cx={userPoint.x}
                  cy={userPoint.y}
                  r={2}
                  fill="#ffffff"
                />
                {/* Location label tag */}
                <rect
                  x={userPoint.x - 34}
                  y={userPoint.y - 23}
                  width={68}
                  height={15}
                  rx={4}
                  fill="#1e3a8a"
                  fillOpacity={0.92}
                />
                <text
                  x={userPoint.x}
                  y={userPoint.y - 12}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={8.5}
                  fontWeight="700"
                >
                  {userLocation?.isDemo ? '📍 Demo' : '📍 You'}
                </text>
              </g>
            )}
          </svg>
        )}

        {/* Hover Tooltip */}
        {hovered && (
          <div className="map-tooltip" style={{ left: `${Math.min(Math.max((hovered.x || 0) + 18, 12), 78)}%`, top: '16%' }}>
            <b>{hovered.name}</b>
            <span>{level === 'india' ? `${projectCount(hovered.name)} public works` : `${districtCount(hovered.name)} works in current data`}</span>
          </div>
        )}

        {/* Interactive Popup Card for Selected Pin */}
        {selectedPinProject && (
          <div className="nearby-map-popup" style={{
            position: 'absolute',
            left: 20,
            bottom: 20,
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 12,
            padding: '14px 16px',
            width: 270,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            color: '#1c1917',
          }}>
            {selectedPinProject.isUser ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Navigation size={12} /> {userLocation?.isDemo ? 'Demo Location' : 'Current Location'}
                  </span>
                  <button onClick={() => setSelectedPinProject(null)} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2 }} aria-label="Close">
                    <X size={14} />
                  </button>
                </div>
                <strong style={{ fontSize: 13, display: 'block', color: '#1c1917' }}>{userLocation?.name || 'Your Location'}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: '#78716c', lineHeight: 1.4 }}>
                  {userLocation?.isDemo
                    ? 'Demonstration coordinates set to Ghaziabad, Uttar Pradesh.'
                    : 'Coordinates acquired via browser geolocation.'}
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: selectedPinProject.riskLevel === 'high' ? '#fee2e2' : selectedPinProject.riskLevel === 'medium' ? '#fef3c7' : '#dcfce7',
                    color: selectedPinProject.riskLevel === 'high' ? '#991b1b' : selectedPinProject.riskLevel === 'medium' ? '#92400e' : '#166534',
                  }}>
                    {selectedPinProject.riskLevel === 'high' ? '🔴 High Risk' :
                     selectedPinProject.riskLevel === 'medium' ? '🟡 Medium Risk' : '🟢 Low Risk'}
                  </span>
                  <button onClick={() => setSelectedPinProject(null)} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2 }} aria-label="Close">
                    <X size={14} />
                  </button>
                </div>
                <div style={{ fontSize: 9, color: '#78716c', fontWeight: 700, marginBottom: 2 }}>{selectedPinProject.id} · {selectedPinProject.sector}</div>
                <strong style={{ fontSize: 12, display: 'block', lineHeight: 1.35, marginBottom: 6, color: '#0c0a09' }}>{selectedPinProject.name}</strong>
                <div style={{ fontSize: 10, color: '#57534e', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                  <span>📍 {selectedPinProject.district || selectedPinProject.constituency}, {selectedPinProject.state}</span>
                  {selectedPinProject.distanceFormatted && (
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>📏 {selectedPinProject.distanceFormatted}</span>
                  )}
                  <span>Progress: {selectedPinProject.physicalProgress}% · ₹{(selectedPinProject.sanctionedAmount / 100000).toFixed(1)}L</span>
                </div>
                <button
                  onClick={() => navigate(`/official/risk/${selectedPinProject.id}`)}
                  style={{
                    width: '100%',
                    background: '#314D3F',
                    color: '#fff',
                    border: 0,
                    borderRadius: 7,
                    padding: '7px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  View Details <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="map-legend">
          {renderedNearby.length > 0 || userLocation ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 10 }}>
              <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#C85A32', marginRight: 4 }} /> High Risk</span>
              <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#D97706', marginRight: 4 }} /> Medium Risk</span>
              <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#059669', marginRight: 4 }} /> Low Risk</span>
              {userLocation && (
                <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2563eb', marginRight: 4 }} /> {userLocation.isDemo ? 'Demo Location' : 'Your Location'}</span>
              )}
            </div>
          ) : (
            <>
              <span><i className="legend-dot" /> Public works</span>
              <span>Click a state to drill down</span>
            </>
          )}
        </div>
      </div>

      {level === 'state' && (
        <div className="map-selection-card">
          <div>
            <span className="eyebrow">SELECTED STATE</span>
            <b>{activeState}</b>
            <small>{projects.filter((p) => p.state?.toLowerCase() === activeState.toLowerCase()).length} works in current data</small>
          </div>
          <button onClick={() => window.location.hash = '#works'}>Explore works <MapPin size={14} /></button>
        </div>
      )}
    </div>
  );
}
