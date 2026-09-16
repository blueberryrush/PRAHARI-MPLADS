import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Plus,
  Minus,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  X,
  AlertTriangle,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { projects as allMockProjects } from '../../data/mockData';

// Strict India Geographic Bounds (Southwest: Kanyakumari/Lakshadweep, Northeast: Kashmir/Arunachal Pradesh)
const INDIA_BOUNDS = [
  [6.4627, 68.1097],
  [37.0841, 97.3956],
];

const DEFAULT_CENTER = [22.9734, 78.6569]; // Center of India
const DEFAULT_ZOOM = 5;

// World outer boundary for inverted polygon mask
const WORLD_MASK_RING = [
  [-85.0511, -180],
  [-85.0511, 180],
  [85.0511, 180],
  [85.0511, -180],
  [-85.0511, -180],
];

// Global in-memory cache for India GeoJSON to eliminate redundant network fetches and parsing
let globalIndiaGeoJSON = null;
let geoFetchPromise = null;

function fetchIndiaGeoJSON() {
  if (globalIndiaGeoJSON) {
    return Promise.resolve(globalIndiaGeoJSON);
  }
  if (!geoFetchPromise) {
    geoFetchPromise = fetch('/india.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Local india.geojson unavailable');
        return res.json();
      })
      .catch(() => {
        // Fallback CDN if local static asset fails
        return fetch('https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/india.geojson').then(
          (r) => r.json()
        );
      })
      .then((data) => {
        globalIndiaGeoJSON = data;
        return data;
      })
      .catch((err) => {
        console.warn('Failed to load India GeoJSON boundaries:', err);
        return null;
      });
  }
  return geoFetchPromise;
}

function extractPolygonRings(geojson) {
  const rings = [];
  if (!geojson || !geojson.features) return rings;
  for (const feature of geojson.features) {
    const geometry = feature.geometry;
    if (!geometry) continue;
    if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
      geometry.coordinates.forEach((ring) => {
        if (Array.isArray(ring) && ring.length >= 3) {
          rings.push(ring.map(([lng, lat]) => [lat, lng]));
        }
      });
    } else if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
      geometry.coordinates.forEach((polygon) => {
        if (Array.isArray(polygon)) {
          polygon.forEach((ring) => {
            if (Array.isArray(ring) && ring.length >= 3) {
              rings.push(ring.map(([lng, lat]) => [lat, lng]));
            }
          });
        }
      });
    }
  }
  return rings;
}

export default function CivicMap({
  projects = allMockProjects,
  initialCenter = { lat: 22.9734, lng: 78.6569 },
  initialZoom = 5,
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

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const maskLayerRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'high' | 'water' | 'road' | 'education'
  const [selectedPin, setSelectedPin] = useState(null);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [geoData, setGeoData] = useState(globalIndiaGeoJSON);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(initialZoom || DEFAULT_ZOOM);

  // Load GeoJSON
  useEffect(() => {
    if (!geoData) {
      fetchIndiaGeoJSON().then((data) => {
        if (data) setGeoData(data);
      });
    }
  }, [geoData]);

  // Defensive Filter calculation
  const filteredProjects = useMemo(() => {
    return (projects || []).filter((p) => {
      const lat = Number(p.latitude || p.official_record?.latitude);
      const lng = Number(p.longitude || p.official_record?.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return false;

      const score =
        p.composite_risk_score != null
          ? Number(p.composite_risk_score)
          : p.riskScore != null
          ? Number(p.riskScore)
          : p.risk?.score || 0;
      const isHigh = p.isAnomaly || score >= 70 || p.review_priority === 'HIGH_PRIORITY' || p.review_priority === 'HIGH';
      const sector = String(p.sector || p.category || '').toLowerCase();

      if (activeFilter === 'high') return isHigh;
      if (activeFilter === 'water') return sector.includes('water') || sector.includes('drinking');
      if (activeFilter === 'road') return sector.includes('road') || sector.includes('bridge');
      if (activeFilter === 'education') return sector.includes('education') || sector.includes('school');
      return true;
    });
  }, [projects, activeFilter]);

  // High-performance LOD displayed pins calculation
  const displayedProjects = useMemo(() => {
    if (filteredProjects.length <= 350 || currentZoom >= 7 || activeFilter !== 'all' || focusedId) {
      return filteredProjects;
    }
    // At national overview zoom, sort high priority first and take representative sample
    const highPriority = filteredProjects.filter((p) => {
      const score = Number(p.composite_risk_score ?? p.riskScore ?? 0);
      return score >= 60 || p.isAnomaly || String(p.review_priority || '').includes('HIGH');
    });
    const regular = filteredProjects.filter((p) => {
      const score = Number(p.composite_risk_score ?? p.riskScore ?? 0);
      return score < 60 && !p.isAnomaly && !String(p.review_priority || '').includes('HIGH');
    });
    const step = Math.max(1, Math.floor(regular.length / 200));
    const sampledRegular = regular.filter((_, idx) => idx % step === 0);
    return [...highPriority, ...sampledRegular];
  }, [filteredProjects, currentZoom, activeFilter, focusedId]);

  // Color helper
  const getPinColor = useCallback((p) => {
    const score =
      p.composite_risk_score != null
        ? Number(p.composite_risk_score)
        : p.riskScore != null
        ? Number(p.riskScore)
        : p.risk?.score || 0;
    if (p.isAnomaly || score >= 70 || p.review_priority === 'HIGH_PRIORITY' || p.review_priority === 'HIGH') {
      return '#C85A32'; // Terracotta Red (High)
    }
    if (score >= 40 || p.status === 'delayed') {
      return '#D97706'; // Amber (Moderate)
    }
    return '#059669'; // Emerald Green (Stable)
  }, []);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const centerLat = Number(initialCenter?.lat) || DEFAULT_CENTER[0];
    const centerLng = Number(initialCenter?.lng) || DEFAULT_CENTER[1];
    const startZoom = Number(initialZoom) || DEFAULT_ZOOM;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: startZoom,
      minZoom: 4.5,
      maxZoom: 18,
      maxBounds: INDIA_BOUNDS,
      maxBoundsViscosity: 1.0, // Strictly prevent dragging outside India
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Initial resize trigger
    setTimeout(() => {
      map.invalidateSize();
      setIsMapReady(true);
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setIsMapReady(false);
    };
  }, []); // Run once on mount

  // 2. Manage Base Tile Layer (CartoDB no-labels)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Clean, sleek CartoDB Positron / Dark no-labels basemap (Zero foreign text labels, zero watermarks)
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
      noWrap: true,
      bounds: INDIA_BOUNDS,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
  }, [isDark]);

  // 3. Manage Inverted Polygon World Mask & India Boundary Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoData) return;

    // Clean up existing mask and boundary layers
    if (maskLayerRef.current) {
      map.removeLayer(maskLayerRef.current);
      maskLayerRef.current = null;
    }
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    try {
      const rings = extractPolygonRings(geoData);
      const maskColor = isDark ? '#0c0a09' : '#EDEBE6';

      // Inverted World Mask Layer (Blanks out external world outside India)
      if (rings.length > 0) {
        const maskPolygon = L.polygon([WORLD_MASK_RING, ...rings], {
          stroke: false,
          fillColor: maskColor,
          fillOpacity: 0.95,
          interactive: false,
        }).addTo(map);
        maskLayerRef.current = maskPolygon;
      }

      // Sharp State & National Boundaries Overlay
      const boundaryLayer = L.geoJSON(geoData, {
        style: {
          color: isDark ? '#334155' : '#047857',
          weight: 1.0,
          fillColor: isDark ? '#14211a' : '#f0fdf4',
          fillOpacity: 0.08,
        },
        interactive: false,
      }).addTo(map);

      geojsonLayerRef.current = boundaryLayer;
    } catch (err) {
      console.warn('Error applying India boundary mask:', err);
    }
  }, [geoData, isDark]);

  // 4. Update Map Center when initialCenter/focusedId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    if (focusedId) {
      const match = (projects || []).find((p) => p.id === focusedId || p.work_id === focusedId);
      if (match) {
        const lat = Number(match.latitude || match.official_record?.latitude);
        const lng = Number(match.longitude || match.official_record?.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          map.flyTo([lat, lng], 13, { duration: 1.2 });
          setSelectedPin(match);
          return;
        }
      }
    }

    if (initialCenter?.lat != null && initialCenter?.lng != null) {
      const lat = Number(initialCenter.lat);
      const lng = Number(initialCenter.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        map.setView([lat, lng], initialZoom || DEFAULT_ZOOM);
      }
    }
  }, [initialCenter?.lat, initialCenter?.lng, initialZoom, focusedId, projects, isMapReady]);

  // 5. Render Interactive Project Markers & User Location Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !isMapReady) return;

    layer.clearLayers();

    // Render Project Pins
    displayedProjects.forEach((p) => {
      const lat = Number(p.latitude || p.official_record?.latitude);
      const lng = Number(p.longitude || p.official_record?.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const pId = p.id || p.work_id;
      const score =
        p.composite_risk_score != null
          ? Number(p.composite_risk_score)
          : p.riskScore != null
          ? Number(p.riskScore)
          : p.risk?.score || 0;
      const isHigh = p.isAnomaly || score >= 70 || p.review_priority === 'HIGH_PRIORITY' || p.review_priority === 'HIGH';
      const isSelected = (selectedPin?.id || selectedPin?.work_id) === pId;
      const isHovered = (hoveredPin?.id || hoveredPin?.work_id) === pId;
      const color = getPinColor(p);

      // Create Custom HTML Pin Marker
      const iconHtml = `
        <div class="custom-leaflet-pin" style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transform: ${isSelected || isHovered ? 'scale(1.2)' : 'scale(1)'};
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
        ">
          ${
            isHigh
              ? `<div style="
                  position: absolute;
                  left: 50%;
                  top: 50%;
                  width: 34px;
                  height: 34px;
                  transform: translate(-50%, -50%);
                  border-radius: 50%;
                  background: rgba(200, 90, 50, 0.35);
                  animation: pulseGlow 2s infinite;
                  pointer-events: none;
                "></div>`
              : ''
          }
          <svg width="28" height="34" viewBox="0 0 28 34" fill="none" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));">
            <path
              d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 20 14 20s14-9.5 14-20c0-7.732-6.268-14-14-14z"
              fill="${color}"
              stroke="${isSelected ? '#FFFFFF' : isDark ? '#1c1917' : '#FFFFFF'}"
              stroke-width="2"
            />
            <circle cx="14" cy="13" r="4.5" fill="#FFFFFF" />
          </svg>
          ${
            isSelected || isHovered || isHigh
              ? `<span style="
                  position: absolute;
                  top: -18px;
                  background: ${isDark ? 'rgba(12, 10, 9, 0.9)' : 'rgba(255, 255, 255, 0.95)'};
                  color: ${isDark ? '#EDEBE6' : '#1C1917'};
                  border: 1px solid ${isDark ? '#44403c' : '#E7E5E4'};
                  padding: 1px 5px;
                  border-radius: 4px;
                  font-size: 9px;
                  font-weight: 800;
                  font-family: monospace;
                  white-space: nowrap;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                  pointer-events: none;
                ">${pId}</span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'civic-marker-wrapper',
        html: iconHtml,
        iconSize: [28, 34],
        iconAnchor: [14, 34],
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : isHigh ? 500 : 100,
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedPin(p);
        onPinClick?.(pId, p);
      });

      marker.on('mouseover', () => {
        setHoveredPin(p);
        onPinClick?.(pId, p);
      });

      marker.on('mouseout', () => {
        setHoveredPin(null);
      });

      marker.addTo(layer);
    });

    // Render User Location Pin if provided
    if (userLocation && userLocation.lat != null && userLocation.lng != null) {
      const uLat = Number(userLocation.lat);
      const uLng = Number(userLocation.lng);
      if (!isNaN(uLat) && !isNaN(uLng)) {
        const userIconHtml = `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: rgba(37, 99, 235, 0.25);
              animation: pulseGlow 2s infinite;
            "></div>
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: #2563EB;
              border: 2.5px solid #FFFFFF;
              box-shadow: 0 0 10px rgba(37, 99, 235, 0.8);
            "></div>
            <span style="
              position: absolute;
              top: 22px;
              background: #2563EB;
              color: #FFFFFF;
              font-size: 8.5px;
              font-weight: 800;
              padding: 2px 5px;
              border-radius: 4px;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">${userLocation.isDemo ? '📍 Demo' : '📍 You'}</span>
          </div>
        `;

        const userIcon = L.divIcon({
          className: 'user-loc-pin',
          html: userIconHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const userMarker = L.marker([uLat, uLng], {
          icon: userIcon,
          zIndexOffset: 2000,
        }).addTo(layer);

        userMarkerRef.current = userMarker;
      }
    }
  }, [displayedProjects, selectedPin, hoveredPin, userLocation, isDark, isMapReady, onPinClick, getPinColor]);

  // Zoom Controls
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const centerLat = Number(initialCenter?.lat) || DEFAULT_CENTER[0];
    const centerLng = Number(initialCenter?.lng) || DEFAULT_CENTER[1];
    map.flyTo([centerLat, centerLng], initialZoom || DEFAULT_ZOOM, { duration: 0.8 });
    setSelectedPin(null);
    setHoveredPin(null);
  };

  const activeDossierPin = selectedPin || hoveredPin;

  return (
    <div className="civic-interactive-map-wrapper" style={{ width: '100%', position: 'relative' }}>
      {/* Header bar if provided */}
      {(title || subtitle) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669' }}>
              <span className="pulse-dot" style={{ background: '#059669' }} />
              {hi ? 'पारदर्शी सार्वजनिक निगरानी' : 'LIVE DISTRICT SURVEILLANCE'}
            </span>
            <h3 style={{ margin: '4px 0 2px', fontSize: 20, letterSpacing: '-0.02em' }}>
              {title || (hi ? 'अखिल भारत जिला स्थानिक निगरानी' : 'Pan-India Geographic Surveillance')}
            </h3>
            {subtitle && <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{subtitle}</p>}
          </div>

          {/* Masking Status Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--muted)' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 9px',
                borderRadius: 6,
                background: isDark ? 'rgba(5, 150, 105, 0.15)' : 'rgba(5, 150, 105, 0.1)',
                color: '#059669',
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={13} /> {hi ? 'राष्ट्रीय सीमा प्रतिबंधित' : 'India Boundary Masked · No Clutter'}
            </span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {showFilters && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
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
                  border:
                    activeFilter === chip.key
                      ? '1px solid #059669'
                      : isDark
                      ? '1px solid #292524'
                      : '1px solid #E7E5E4',
                  background:
                    activeFilter === chip.key ? '#059669' : isDark ? '#1c1917' : '#FFFFFF',
                  color: activeFilter === chip.key ? '#FFFFFF' : isDark ? '#d6d3d1' : '#1c1917',
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

      {/* Main Map Canvas Shell */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: 14,
          overflow: 'hidden',
          border: isDark ? '1px solid #292524' : '1px solid #E7E5E4',
          background: isDark ? '#0c0a09' : '#EDEBE6',
          boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.5)' : '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Leaflet DOM Mounting Container */}
        <div
          ref={mapContainerRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        />

        {/* Floating Back to India Map Navigation Button */}
        {(currentZoom > 5.5 || selectedPin) && (
          <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 1000 }}>
            <button
              type="button"
              onClick={handleResetView}
              className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-4 py-2 rounded-full border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex items-center gap-2 z-[1000] cursor-pointer"
              title={hi ? 'अखिल भारतीय मानचित्र पर वापस जाएं' : 'Return to National India Map'}
            >
              <ArrowLeft size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>{hi ? '← भारत मानचित्र' : '← Back to India Map'}</span>
            </button>
          </div>
        )}

        {/* Floating Dossier Card */}
        {activeDossierPin && (() => {
          const pId = activeDossierPin.id || activeDossierPin.work_id;
          const pName = activeDossierPin.name || activeDossierPin.work_name || 'Project Work';
          const sanctionedLakhs =
            activeDossierPin.sanctioned_amount_lakhs != null
              ? Number(activeDossierPin.sanctioned_amount_lakhs)
              : Number(((activeDossierPin.sanctionedAmount || 0) / 100000).toFixed(1));
          const spentLakhs =
            activeDossierPin.expenditure_lakhs != null
              ? Number(activeDossierPin.expenditure_lakhs)
              : Number(((activeDossierPin.spentAmount || 0) / 100000).toFixed(1));
          const score =
            activeDossierPin.composite_risk_score != null
              ? Number(activeDossierPin.composite_risk_score)
              : activeDossierPin.riskScore != null
              ? Number(activeDossierPin.riskScore)
              : activeDossierPin.risk?.score || (activeDossierPin.isAnomaly ? 86 : 24);
          const auditStatus =
            activeDossierPin.audit_status || activeDossierPin.auditStatus || 'MONITORED_AUTO';

          return (
            <div
              className="map-floating-dossier-card"
              style={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                width: 290,
                background: isDark ? 'rgba(28, 25, 23, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                color: isDark ? '#EDEBE6' : '#1C1917',
                border: isDark ? '1px solid #44403c' : '1px solid #E7E5E4',
                borderRadius: 12,
                padding: 14,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
                zIndex: 1000,
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
                    {pId}
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
                  aria-label="Close dossier"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Title & Sector */}
              <strong style={{ fontSize: 13, display: 'block', lineHeight: 1.35, marginBottom: 4 }}>
                {pName}
              </strong>

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  fontSize: 10,
                  color: 'var(--muted)',
                  marginBottom: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={11} /> {activeDossierPin.district || activeDossierPin.constituency},{' '}
                  {activeDossierPin.state}
                </span>
                <span>• {activeDossierPin.sector || activeDossierPin.category}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    color: 'var(--muted)',
                  }}
                >
                  {auditStatus}
                </span>
              </div>

              {/* Financials & Risk Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  marginBottom: 8,
                  fontSize: 10,
                }}
              >
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>{hi ? 'स्वीकृत' : 'Sanctioned'}</span>
                  <b style={{ fontSize: 11 }}>₹{sanctionedLakhs.toFixed(1)}L</b>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>{hi ? 'व्यय' : 'Spent'}</span>
                  <b style={{ fontSize: 11 }}>₹{spentLakhs.toFixed(1)}L</b>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>{hi ? 'जोखिम' : 'Risk'}</span>
                  <b style={{ fontSize: 11, color: getPinColor(activeDossierPin) }}>
                    {score}/100
                  </b>
                </div>
              </div>

              {/* Discrepancy or Anomaly Note */}
              {activeDossierPin.isAnomaly && (
                <div
                  style={{
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
                  }}
                >
                  <AlertTriangle size={13} flexShrink={0} />
                  <span>{hi ? 'लागत या प्रगति में विसंगति पाई गई' : 'Audit anomaly / progress drift flagged'}</span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => {
                    onPinClick?.(pId, activeDossierPin);
                  }}
                  style={{
                    flex: 1,
                    height: 32,
                    fontSize: 11,
                    background: '#059669',
                    borderColor: '#059669',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    borderRadius: 6,
                  }}
                >
                  <span>{hi ? 'साक्ष्य दर्ज करें' : 'Select Project'}</span>
                  <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => navigate(`/official/risk/${pId}`)}
                  style={{
                    height: 32,
                    fontSize: 11,
                    padding: '0 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                  }}
                  title="Open Official Dossier"
                >
                  Dossier
                </button>
              </div>
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
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            onClick={handleZoomIn}
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
            onClick={handleZoomOut}
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
            onClick={handleResetView}
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

        {/* Legend strip at bottom right */}
        <div
          style={{
            position: 'absolute',
            right: 14,
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
            zIndex: 900,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C85A32' }} />
            <span>{hi ? 'उच्च प्राथमिकता / विसंगति' : 'High Priority'}</span>
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
