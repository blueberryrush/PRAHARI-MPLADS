import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateRiskScore } from '../data/aiEngine';

const INDIA_BOUNDS = { minLat: 8, maxLat: 37, minLng: 68, maxLng: 97.5 };
const W = 600, H = 340;

const COORD_MAP = {
  'Varanasi':         { lat: 25.3176, lng: 82.9739 },
  'Lucknow':          { lat: 26.8467, lng: 80.9462 },
  'Mumbai North':     { lat: 19.2183, lng: 72.9781 },
  'Pune':             { lat: 18.5204, lng: 73.8567 },
  'Patna Sahib':      { lat: 25.5941, lng: 85.1376 },
  'Bhopal':           { lat: 23.2599, lng: 77.4126 },
  'Jaipur':           { lat: 26.9124, lng: 75.7873 },
  'Chennai South':    { lat: 13.0827, lng: 80.2707 },
  'Bangalore South':  { lat: 12.9716, lng: 77.5946 },
  'Ahmedabad East':   { lat: 23.0225, lng: 72.5714 },
  'Kolkata North':    { lat: 22.5726, lng: 88.3639 },
  'Bhubaneswar':      { lat: 20.2961, lng: 85.8245 },
};

function geoToSvg(lat, lng) {
  const pad = 24;
  const x = pad + ((lng - INDIA_BOUNDS.minLng) / (INDIA_BOUNDS.maxLng - INDIA_BOUNDS.minLng)) * (W - pad * 2);
  const y = (H - pad) - ((lat - INDIA_BOUNDS.minLat) / (INDIA_BOUNDS.maxLat - INDIA_BOUNDS.minLat)) * (H - pad * 2);
  return [Math.round(x), Math.round(y)];
}

function getPinMeta(score) {
  if (score >= 70) return { cls: 'hotspot', color: '#b45309', label: 'Priority Hotspot', pulse: true };
  if (score >= 50) return { cls: 'review',  color: '#d97706', label: 'Review Pending',  pulse: false };
  return                  { cls: 'stable',  color: '#059669', label: 'Stable',           pulse: false };
}

export default function SpatialCommandView({ projects = [], onPinClick, focusedId }) {
  const [tooltip, setTooltip] = useState(null);
  const navigate = useNavigate();

  const latLines = [10, 15, 20, 25, 30, 35];
  const lngLines = [70, 75, 80, 85, 90, 95];

  const pinsData = projects.slice(0, 30).map(p => {
    const base = COORD_MAP[p.constituency];
    const coords = base || {
      lat: 14 + ((p.id?.charCodeAt(3) || 0) % 18),
      lng: 72 + ((p.id?.charCodeAt(4) || 0) % 22),
    };
    const risk = calculateRiskScore(p);
    const [cx, cy] = geoToSvg(coords.lat, coords.lng);
    const meta = getPinMeta(risk.score);
    return { ...p, cx, cy, risk, meta };
  });

  const handlePinClick = (p) => {
    setTooltip(null);
    onPinClick?.(p.id);
    navigate(`/official/risk/${p.id}`);
  };

  // Varanasi reference
  const [vx, vy] = geoToSvg(25.3176, 82.9739);

  return (
    <div className="spatial-canvas-wrapper">
      <svg viewBox={`0 0 ${W} ${H}`} className="spatial-svg" aria-label="Spatial risk distribution — India project map">
        <rect width={W} height={H} fill="#1c1917" rx="6" />

        {/* Coordinate grid */}
        {latLines.map(lat => {
          const [, y] = geoToSvg(lat, 70);
          return y >= 0 && y <= H ? (
            <g key={`lat-${lat}`}>
              <line x1={0} y1={y} x2={W} y2={y} stroke="#292524" strokeWidth="0.5" />
              <text x={3} y={y - 2} fill="#57534e" fontSize="7.5" fontFamily="monospace">{lat}°N</text>
            </g>
          ) : null;
        })}
        {lngLines.map(lng => {
          const [x] = geoToSvg(10, lng);
          return x >= 0 && x <= W ? (
            <g key={`lng-${lng}`}>
              <line x1={x} y1={0} x2={x} y2={H} stroke="#292524" strokeWidth="0.5" />
              <text x={x + 2} y={H - 3} fill="#57534e" fontSize="7.5" fontFamily="monospace">{lng}°E</text>
            </g>
          ) : null;
        })}

        {/* Contour arcs */}
        <ellipse cx={300} cy={185} rx={230} ry={125} fill="none" stroke="#292524" strokeWidth="0.8" strokeDasharray="5 7" opacity="0.55" />
        <ellipse cx={295} cy={180} rx={165} ry={88}  fill="none" stroke="#292524" strokeWidth="0.5" strokeDasharray="3 9" opacity="0.35" />

        {/* Varanasi reference crosshair */}
        <g opacity="0.7">
          <line x1={vx - 9} y1={vy} x2={vx + 9} y2={vy} stroke="#92400e" strokeWidth="0.9" />
          <line x1={vx} y1={vy - 9} x2={vx} y2={vy + 9} stroke="#92400e" strokeWidth="0.9" />
          <text x={vx + 11} y={vy - 3} fill="#a16207" fontSize="7" fontFamily="monospace">25.3176°N 82.9739°E</text>
        </g>

        {/* Project pins */}
        {pinsData.map(p => {
          const isFocused = p.id === focusedId;
          return (
            <g
              key={p.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip(p)}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => handlePinClick(p)}
              role="button"
              aria-label={`${p.id}: ${p.name}`}
            >
              {p.meta.pulse && (
                <circle cx={p.cx} cy={p.cy} r={11} fill="rgba(180,83,9,0.25)" className="pin-pulse-ring" />
              )}
              {isFocused && (
                <circle cx={p.cx} cy={p.cy} r={14} fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.2" />
              )}
              <circle
                cx={p.cx}
                cy={p.cy}
                r={p.meta.pulse ? 5.5 : 4.5}
                fill={p.meta.color}
                stroke={isFocused ? '#fbbf24' : 'rgba(255,255,255,0.18)'}
                strokeWidth={isFocused ? 1.5 : 0.8}
              />
            </g>
          );
        })}

        {/* Hover tooltip (SVG group) */}
        {tooltip && (() => {
          const tx = Math.min(tooltip.cx + 14, W - 162);
          const ty = Math.max(tooltip.cy - 54, 8);
          const agency = tooltip.agency || '—';
          return (
            <g pointerEvents="none">
              <rect x={tx} y={ty} width={158} height={72} rx={4} fill="#1c1917" stroke="#44403c" strokeWidth="0.9" />
              <text x={tx+8} y={ty+14} fill="#d6d3d1" fontSize="9.5" fontWeight="600" fontFamily="monospace">{tooltip.id}</text>
              <text x={tx+8} y={ty+26} fill="#a8a29e" fontSize="8" fontFamily="sans-serif">
                {tooltip.name?.length > 22 ? tooltip.name.slice(0, 21) + '…' : tooltip.name}
              </text>
              <line x1={tx+8} y1={ty+31} x2={tx+150} y2={ty+31} stroke="#292524" strokeWidth="0.6" />
              <text x={tx+8} y={ty+42} fill="#78716c" fontSize="8" fontFamily="monospace">Agency: {agency}</text>
              <text x={tx+8} y={ty+54} fill="#78716c" fontSize="8" fontFamily="monospace">Sanction: ₹{(tooltip.sanctionedAmount/100000).toFixed(1)}L</text>
              <text x={tx+8} y={ty+67}
                fill={tooltip.meta.cls === 'hotspot' ? '#f97316' : tooltip.meta.cls === 'review' ? '#fbbf24' : '#34d399'}
                fontSize="8" fontFamily="monospace"
              >
                ▲ {tooltip.meta.label}
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="spatial-legend">
        <span><i className="legend-pin hotspot" />Priority Hotspot</span>
        <span><i className="legend-pin review" />Review Pending</span>
        <span><i className="legend-pin stable" />Stable</span>
        <span className="coord-ref">Ref: 25.3176°N 82.9739°E</span>
      </div>
    </div>
  );
}
