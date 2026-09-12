import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Plus, Minus, RotateCcw, ArrowRight, X, 
  AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { projects as allMockProjects } from '../../data/mockData';

// Web Mercator coordinate projection helpers
function latLngToTileXY(lat, lng, zoom) {
  const n = 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x, y };
}

function latLngToWorldPixel(lat, lng, zoom) {
  const { x, y } = latLngToTileXY(lat, lng, zoom);
  return { px: x * 256, py: y * 256 };
}

export default function CivicMap({
  projects = allMockProjects,
  initialCenter = { lat: 25.3176, lng: 82.9739 }, // Varanasi by default
  initialZoom = 12,
  userLocation = null,
  focusedId = null,
  onPinClick = null,
  height = 480,
  showFilters = true,
  title = null,
  subtitle = null,
}) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const hi = lang === 'hi';

  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [center, setCenter] = useState(initialCenter);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (initialCenter?.lat && initialCenter?.lng) {
      setCenter(initialCenter);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [initialCenter?.lat, initialCenter?.lng]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'high' | 'water' | 'road' | 'education'
  const [selectedPin, setSelectedPin] = useState(null);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);

  // Check for Google Maps API Key
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (googleApiKey && typeof window !== 'undefined') {
      // Dynamic Google Maps script loader if key is present
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setUseGoogleMaps(true);
        script.onerror = () => setUseGoogleMaps(false);
        document.head.appendChild(script);
      } else if (window.google?.maps) {
        setUseGoogleMaps(true);
      }
    }
  }, [googleApiKey]);

  // Handle focused ID update
  useEffect(() => {
    if (focusedId) {
      const match = projects.find((p) => p.id === focusedId);
      if (match && match.latitude != null && match.longitude != null) {
        setCenter({ lat: match.latitude, lng: match.longitude });
        setSelectedPin(match);
        setPanOffset({ x: 0, y: 0 });
      }
    }
  }, [focusedId, projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.latitude == null || p.longitude == null) return false;
      if (activeFilter === 'high') {
        return p.isAnomaly || (p.risk?.score || 0) >= 70;
      }
      if (activeFilter === 'water') {
        return p.sector?.toLowerCase().includes('water') || p.sector?.toLowerCase().includes('drinking');
      }
      if (activeFilter === 'road') {
        return p.sector?.toLowerCase().includes('road') || p.sector?.toLowerCase().includes('bridge');
      }
      if (activeFilter === 'education') {
        return p.sector?.toLowerCase().includes('education') || p.sector?.toLowerCase().includes('school');
      }
      return true;
    });
  }, [projects, activeFilter]);

  // Pan & Drag Handlers
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Left button only
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Zoom controls with bounds [8, 17]
  const zoomIn = () => setZoom((z) => Math.min(z + 1, 17));
  const zoomOut = () => setZoom((z) => Math.max(z - 1, 8));
  const resetView = () => {
    setZoom(initialZoom);
    setCenter(initialCenter);
    setPanOffset({ x: 0, y: 0 });
    setSelectedPin(null);
  };

  // Handle Wheel Zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 1, 17));
    } else {
      setZoom((z) => Math.max(z - 1, 8));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Tile Calculations for interactive canvas
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 480 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setViewportSize({ width: rect.width || 800, height: rect.height || 480 });
    }
  }, []);

  const centerPixel = useMemo(() => {
    return latLngToWorldPixel(center.lat, center.lng, zoom);
  }, [center, zoom]);

  // Determine tiles to render around center + panOffset
  const tilesToRender = useMemo(() => {
    const halfW = viewportSize.width / 2;
    const halfH = viewportSize.height / 2;

    const currentCenterX = centerPixel.px - panOffset.x;
    const currentCenterY = centerPixel.py - panOffset.y;

    const minX = Math.floor((currentCenterX - halfW) / 256);
    const maxX = Math.floor((currentCenterX + halfW) / 256);
    const minY = Math.floor((currentCenterY - halfH) / 256);
    const maxY = Math.floor((currentCenterY + halfH) / 256);

    const tiles = [];
    const maxTile = 2 ** zoom;

    for (let tx = minX; tx <= maxX; tx++) {
      for (let ty = minY; ty <= maxY; ty++) {
        if (ty >= 0 && ty < maxTile) {
          const wrappedX = ((tx % maxTile) + maxTile) % maxTile;
          const posX = tx * 256 - (currentCenterX - halfW);
          const posY = ty * 256 - (currentCenterY - halfH);

          // Tile URL: 100% free OpenStreetMap zero-watermark tiles
          const tileUrl = `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`;

          tiles.push({
            key: `${zoom}-${wrappedX}-${ty}`,
            url: tileUrl,
            x: posX,
            y: posY,
          });
        }
      }
    }
    return tiles;
  }, [centerPixel, panOffset, zoom, viewportSize, isDark]);

  // Project pin coordinate to viewport screen position
  const getPinPosition = useCallback(
    (lat, lng) => {
      const pinPixel = latLngToWorldPixel(lat, lng, zoom);
      const halfW = viewportSize.width / 2;
      const halfH = viewportSize.height / 2;
      const currentCenterX = centerPixel.px - panOffset.x;
      const currentCenterY = centerPixel.py - panOffset.y;

      const screenX = pinPixel.px - (currentCenterX - halfW);
      const screenY = pinPixel.py - (currentCenterY - halfH);

      return { x: screenX, y: screenY };
    },
    [centerPixel, panOffset, zoom, viewportSize]
  );

  const getPinColor = (p) => {
    if (p.isAnomaly || (p.risk?.score || 0) >= 70) return '#C85A32'; // Terracotta Red (High)
    if ((p.risk?.score || 0) >= 45 || p.status === 'delayed') return '#D97706'; // Amber (Moderate)
    return '#059669'; // Emerald Green (Stable)
  };

  const handleSelectPin = (p) => {
    setSelectedPin(p);
    onPinClick?.(p.id);
  };

  const activeDossierPin = selectedPin || hoveredPin;

  return (
    <div className="civic-interactive-map-wrapper" style={{ width: '100%', position: 'relative' }}>
      {/* Header bar if provided */}
      {(title || subtitle) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669' }}>
              <span className="pulse-dot" style={{ background: '#059669' }} />
              {hi ? 'पारदर्शी सार्वजनिक निगरानी' : 'LIVE DISTRICT SURVEILLANCE'}
            </span>
            <h3 style={{ margin: '4px 0 2px', fontSize: 20, letterSpacing: '-0.02em' }}>
              {title || (hi ? 'वाराणसी जिला परियोजना स्थानिक मानचित्र' : 'Varanasi District Geographic Project Surveillance')}
            </h3>
            {subtitle && <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{subtitle}</p>}
          </div>

          {/* Map Mode Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--muted)' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              borderRadius: 6,
              background: isDark ? 'rgba(5, 150, 105, 0.15)' : 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              fontWeight: 700,
            }}>
              <ShieldCheck size={13} /> {useGoogleMaps ? 'Google Maps Hybrid' : 'OpenStreetMap Real Tiles'}
            </span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {showFilters && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <div className="map-filter-chips" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: hi ? 'सभी कार्य' : 'All Works', count: projects.length },
              { key: 'high', label: hi ? 'उच्च जोखिम' : 'High Priority', dot: '#C85A32' },
              { key: 'water', label: hi ? 'पेयजल' : 'Drinking Water', dot: '#0284c7' },
              { key: 'road', label: hi ? 'सड़क निर्माण' : 'Roadways', dot: '#D97706' },
              { key: 'education', label: hi ? 'शिक्षा' : 'Education', dot: '#059669' },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={`filter-chip ${activeFilter === chip.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter(chip.key);
                  setSelectedPin(null);
                }}
                style={{
                  fontSize: 11,
                  padding: '5px 12px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  border: activeFilter === chip.key 
                    ? '1px solid #059669' 
                    : isDark ? '1px solid #292524' : '1px solid #E7E5E4',
                  background: activeFilter === chip.key 
                    ? '#059669' 
                    : isDark ? '#1c1917' : '#FFFFFF',
                  color: activeFilter === chip.key 
                    ? '#FFFFFF' 
                    : isDark ? '#d6d3d1' : '#1c1917',
                  fontWeight: activeFilter === chip.key ? 700 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.dot && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: chip.dot }} />
                )}
                {chip.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
            {filteredProjects.length} {hi ? 'परियोजनाएं चिह्नित' : 'Geotagged Projects'}
          </div>
        </div>
      )}

      {/* Main Map Viewport */}
      <div
        ref={containerRef}
        className="civic-map-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: 14,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          border: isDark ? '1px solid #292524' : '1px solid #E7E5E4',
          background: isDark ? '#141210' : '#EDEBE6',
          userSelect: 'none',
          boxShadow: isDark 
            ? '0 10px 30px rgba(0, 0, 0, 0.5)' 
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Real Tile Background Canvas */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {tilesToRender.map((tile) => (
            <img
              key={tile.key}
              src={tile.url}
              alt=""
              loading="lazy"
              style={{
                position: 'absolute',
                left: `${tile.x}px`,
                top: `${tile.y}px`,
                width: 256,
                height: 256,
                pointerEvents: 'none',
                filter: isDark
                  ? 'invert(100%) hue-rotate(180deg) brightness(0.85) contrast(1.2)'
                  : 'brightness(0.98) contrast(1.02)',
              }}
            />
          ))}
        </div>

        {/* Ganges River Water Overlay Glow for Varanasi */}
        {Math.abs(center.lat - 25.3176) < 0.2 && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            right: 14,
            padding: '4px 9px',
            borderRadius: 6,
            background: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.2)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: isDark ? '#22d3ee' : '#0891b2',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            ≈ {hi ? 'गंगा नदी बेसिन · वाराणसी' : 'Ganges River Corridor · Varanasi'}
          </div>
        )}

        {/* Project Markers Layer */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {filteredProjects.map((p) => {
            const pos = getPinPosition(p.latitude, p.longitude);
            // Cull off-screen pins
            if (
              pos.x < -40 ||
              pos.x > viewportSize.width + 40 ||
              pos.y < -40 ||
              pos.y > viewportSize.height + 40
            ) {
              return null;
            }

            const isHigh = p.isAnomaly || (p.risk?.score || 0) >= 70;
            const isSelected = selectedPin?.id === p.id || focusedId === p.id;
            const isHovered = hoveredPin?.id === p.id;
            const color = getPinColor(p);

            return (
              <div
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPin(p);
                }}
                onMouseEnter={() => setHoveredPin(p)}
                onMouseLeave={() => setHoveredPin(null)}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -100%)',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  zIndex: isSelected ? 40 : isHigh ? 30 : 20,
                  transition: 'transform 0.15s ease',
                }}
                role="button"
                aria-label={`${p.id}: ${p.name}`}
              >
                {/* High Priority Pulsing Halo */}
                {isHigh && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 32,
                      height: 32,
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      background: 'rgba(200, 90, 50, 0.35)',
                      animation: 'pulseGlow 2s infinite',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Pin Icon Marker */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transform: isSelected || isHovered ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
                    <path
                      d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 20 14 20s14-9.5 14-20c0-7.732-6.268-14-14-14z"
                      fill={color}
                      stroke={isSelected ? '#FFFFFF' : isDark ? '#1c1917' : '#FFFFFF'}
                      strokeWidth="2"
                    />
                    <circle cx="14" cy="13" r="4.5" fill="#FFFFFF" />
                  </svg>

                  {/* Micro label badge */}
                  {(isSelected || isHovered || isHigh) && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -18,
                        background: isDark ? 'rgba(12, 10, 9, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                        color: isDark ? '#EDEBE6' : '#1C1917',
                        border: isDark ? '1px solid #44403c' : '1px solid #E7E5E4',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    >
                      {p.id}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* User Location "You Are Here" Pin */}
          {userLocation && userLocation.lat != null && userLocation.lng != null && (() => {
            const uPos = getPinPosition(userLocation.lat, userLocation.lng);
            return (
              <div
                style={{
                  position: 'absolute',
                  left: `${uPos.x}px`,
                  top: `${uPos.y}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 50,
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(37, 99, 235, 0.25)',
                  animation: 'pulseGlow 2s infinite',
                }} />
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#2563EB',
                  border: '2.5px solid #FFFFFF',
                  boxShadow: '0 0 10px rgba(37, 99, 235, 0.8)',
                }} />
                <span style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}>
                  {hi ? 'आप यहाँ हैं' : 'You Are Here'}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Interactive Dossier Tooltip Card */}
        {activeDossierPin && (() => {
          const pinPos = getPinPosition(activeDossierPin.latitude, activeDossierPin.longitude);
          const cardLeft = Math.min(Math.max(pinPos.x - 140, 16), viewportSize.width - 320);
          const cardTop = pinPos.y > 220 ? Math.max(pinPos.y - 230, 16) : pinPos.y + 20;

          return (
            <div
              className="map-floating-dossier-card"
              style={{
                position: 'absolute',
                left: `${cardLeft}px`,
                top: `${cardTop}px`,
                width: 300,
                background: isDark ? 'rgba(28, 25, 23, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                color: isDark ? '#EDEBE6' : '#1C1917',
                border: isDark ? '1px solid #44403c' : '1px solid #E7E5E4',
                borderRadius: 12,
                padding: 14,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
                zIndex: 60,
                pointerEvents: 'auto',
                animation: 'fadeIn 0.2s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: getPinColor(activeDossierPin),
                    }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace' }}>
                    {activeDossierPin.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPin(null);
                    setHoveredPin(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Title & Sector */}
              <strong style={{ fontSize: 13, display: 'block', lineHeight: 1.35, marginBottom: 6 }}>
                {activeDossierPin.name}
              </strong>

              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--muted)', marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {activeDossierPin.district || activeDossierPin.constituency}
                </span>
                <span>• {activeDossierPin.sector}</span>
              </div>

              {/* Financials & Risk Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 8,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                marginBottom: 8,
                fontSize: 10,
              }}>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>{hi ? 'स्वीकृत' : 'Sanctioned'}</span>
                  <b style={{ fontSize: 11 }}>₹{((activeDossierPin.sanctionedAmount || 0) / 100000).toFixed(1)}L</b>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>{hi ? 'जारी व्यय' : 'Spent'}</span>
                  <b style={{ fontSize: 11 }}>₹{((activeDossierPin.spentAmount || 0) / 100000).toFixed(1)}L</b>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>{hi ? 'जोखिम स्कोर' : 'Risk'}</span>
                  <b style={{ fontSize: 11, color: getPinColor(activeDossierPin) }}>
                    {activeDossierPin.risk?.score || (activeDossierPin.isAnomaly ? 86 : 24)}/100
                  </b>
                </div>
              </div>

              {/* Discrepancy or Anomaly Note */}
              {activeDossierPin.isAnomaly && (
                <div style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: 'rgba(200, 90, 50, 0.12)',
                  border: '1px solid rgba(200, 90, 50, 0.25)',
                  fontSize: 10,
                  color: '#C85A32',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <AlertTriangle size={13} flexShrink={0} />
                  <span>{hi ? 'लागत या प्रगति में विसंगति पाई गई' : 'Audit anomaly / progress drift flagged'}</span>
                </div>
              )}

              {/* Open Dossier Action Button */}
              <button
                type="button"
                className="primary-action"
                onClick={() => navigate(`/official/risk/${activeDossierPin.id}`)}
                style={{
                  width: '100%',
                  height: 32,
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRadius: 6,
                }}
              >
                <span>{hi ? 'केस डॉसियर खोलें' : 'Open Case Dossier'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          );
        })()}

        {/* Floating Map Controls (+ / - / Reset) */}
        <div
          style={{
            position: 'absolute',
            right: 14,
            top: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 30,
          }}
        >
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Zoom in"
            title={hi ? 'ज़ूम इन करें' : 'Zoom In'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: isDark ? '1px solid #44403c' : '1px solid #E7E5E4',
              background: isDark ? 'rgba(28, 25, 23, 0.9)' : '#FFFFFF',
              color: isDark ? '#EDEBE6' : '#1C1917',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Zoom out"
            title={hi ? 'ज़ूम आउट करें' : 'Zoom Out'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: isDark ? '1px solid #44403c' : '1px solid #E7E5E4',
              background: isDark ? 'rgba(28, 25, 23, 0.9)' : '#FFFFFF',
              color: isDark ? '#EDEBE6' : '#1C1917',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset Map View"
            title={hi ? 'दृश्य रीसेट करें' : 'Reset View'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: isDark ? '1px solid #44403c' : '1px solid #E7E5E4',
              background: isDark ? 'rgba(28, 25, 23, 0.9)' : '#FFFFFF',
              color: isDark ? '#EDEBE6' : '#1C1917',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Legend strip at bottom */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            bottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '5px 12px',
            borderRadius: 8,
            background: isDark ? 'rgba(18, 16, 14, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            border: isDark ? '1px solid #292524' : '1px solid #E7E5E4',
            fontSize: 10,
            color: 'var(--muted)',
            backdropFilter: 'blur(8px)',
            zIndex: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C85A32' }} />
            <span>{hi ? 'उच्च प्राथमिकता / विसंगति' : 'High Priority (Anomalous)'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706' }} />
            <span>{hi ? 'सत्यापन आवश्यक' : 'Review Required'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
            <span>{hi ? 'स्थिर एवं सत्यापित' : 'Verified Stable'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
