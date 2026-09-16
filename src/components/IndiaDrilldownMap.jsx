import { useEffect, useMemo, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Loader2, MapPin, RotateCcw, X, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { geoMercator, geoPath } from 'd3-geo';
import { fetchStateSummaries, fetchProjects } from '../api/client';

const INDIA_URL = '/india.geojson';
const INDIA_FALLBACK_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/india.geojson';
const STATE_BASE = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/states';

// Global cache for GeoJSON
let cachedIndiaGeo = null;

const slugify = (name) =>
  String(name || '')
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

function normalizeStateName(str) {
  if (!str) return '';
  let s = String(str).toLowerCase().trim();
  s = s.replace(/&/g, 'and');
  s = s.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.includes('delhi')) return 'delhi';
  if (s.includes('kashmir')) return 'jammu and kashmir';
  if (s.includes('odisha') || s.includes('orissa')) return 'odisha';
  if (s.includes('uttarakhand') || s.includes('uttaranchal')) return 'uttarakhand';
  if (s.includes('pondicherry') || s.includes('puducherry')) return 'puducherry';
  if (s.includes('andaman')) return 'andaman and nicobar islands';
  if (s.includes('daman') || s.includes('diu') || s.includes('dadra')) return 'dadra and nagar haveli and daman and diu';
  return s;
}

function stateName(feature) {
  const p = feature?.properties || {};
  return p.ST_NM || p.st_nm || p.NAME_1 || p.name || p.State || p.state || p.STATE || 'Unknown';
}

function featureName(feature) {
  const p = feature?.properties || {};
  return p.district || p.DISTRICT || p.NAME_2 || p.name || p.Name || p.NAME || 'District';
}

export default function IndiaDrilldownMap({
  projects = [],
  selectedState = '',
  onStateChange,
  onSelectState,
  onDistrictSelect,
  userLocation = null,
  nearbyProjects = [],
  onProjectSelect,
  onProjectHover,
  hidePopup = false,
  borderless = false,
  hideToolbar = false,
  hideSelectionCard = false,
}) {
  const navigate = useNavigate();
  const [level, setLevel] = useState(selectedState ? 'state' : 'india');
  const [activeState, setActiveState] = useState(selectedState || '');
  const [geo, setGeo] = useState(cachedIndiaGeo);
  const [hovered, setHovered] = useState(null);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [loading, setLoading] = useState(!cachedIndiaGeo);
  const [error, setError] = useState('');
  const [selectedPinProject, setSelectedPinProject] = useState(null);
  const [stateSummaries, setStateSummaries] = useState({});
  const [internalProjects, setInternalProjects] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (!projects || projects.length < 50) {
      fetch(`${import.meta.env.VITE_API_URL}/api/projects?limit=5000`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const allWorks = Array.isArray(data) ? data : (data?.projects || data?.works || []);
          if (isMounted && allWorks.length > 0) {
            setInternalProjects(allWorks);
          } else {
            fetchProjects().then((res) => {
              if (isMounted && res?.data?.length > 0) {
                setInternalProjects(res.data);
              }
            });
          }
        })
        .catch(() => {
          fetchProjects().then((res) => {
            if (isMounted && res?.data?.length > 0) {
              setInternalProjects(res.data);
            }
          });
        });
    }
    return () => {
      isMounted = false;
    };
  }, [projects]);

  const allProjects = useMemo(() => {
    if (projects && projects.length >= 50) return projects;
    if (internalProjects && internalProjects.length > 0) return internalProjects;
    return projects || [];
  }, [projects, internalProjects]);

  useEffect(() => {
    let cancelled = false;
    fetchStateSummaries().then((res) => {
      if (!cancelled && res.ok && res.data) {
        setStateSummaries(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const prevPropStateRef = useRef(selectedState);
  useEffect(() => {
    if (prevPropStateRef.current !== selectedState) {
      prevPropStateRef.current = selectedState;
      if (selectedState) {
        setActiveState(selectedState);
        setLevel('state');
      } else {
        setActiveState('');
        setLevel('india');
      }
    }
  }, [selectedState]);

  useEffect(() => {
    let cancelled = false;
    const stateKey = String(activeState).toLowerCase().trim();

    if (level === 'india' && cachedIndiaGeo) {
      setGeo(cachedIndiaGeo);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    if (level === 'state') {
      const stateSlug = aliases[stateKey] || slugify(stateKey);
      fetch(`${STATE_BASE}/${stateSlug}.geojson`)
        .then((r) => {
          if (!r.ok) throw new Error('State GeoJSON unavailable');
          return r.json();
        })
        .then((data) => {
          if (!cancelled) setGeo(data);
        })
        .catch(() => {
          // Graceful fallback: extract state feature from cachedIndiaGeo
          if (!cancelled && cachedIndiaGeo && Array.isArray(cachedIndiaGeo.features)) {
            const stateFeature = cachedIndiaGeo.features.find((f) => {
              const name = String(stateName(f)).toLowerCase();
              return name === stateKey || name.includes(stateKey) || stateKey.includes(name);
            });
            if (stateFeature) {
              setGeo({ type: 'FeatureCollection', features: [stateFeature] });
              return;
            }
            setGeo(cachedIndiaGeo);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return;
    }

    // Level === 'india'
    fetch(INDIA_URL)
      .then((r) => {
        if (!r.ok) {
          return fetch(INDIA_FALLBACK_URL).then((res) => {
            if (!res.ok) throw new Error('Map data unavailable');
            return res.json();
          });
        }
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          cachedIndiaGeo = data;
          setGeo(data);
        }
      })
      .catch(() => {
        fetch(INDIA_FALLBACK_URL)
          .then((res) => {
            if (!res.ok) throw new Error('Fallback failed');
            return res.json();
          })
          .then((data) => {
            if (!cancelled) {
              cachedIndiaGeo = data;
              setGeo(data);
            }
          })
          .catch(() => {
            if (!cancelled && !cachedIndiaGeo) {
              setError('Map data could not be loaded.');
            }
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [level, activeState]);

  const features = useMemo(() => geo?.features || [], [geo]);
  const width = 900;
  const height = level === 'india' ? 430 : 410;

  // Strict D3 Geo Projection with Exact Bounding-Box Fitting
  const projection = useMemo(() => {
    if (!geo || !geo.features || geo.features.length === 0) return null;

    const proj = geoMercator();
    const canvasWidth = width;
    const canvasHeight = height;
    const geoJsonData = geo;

    try {
      if (selectedState || (level === 'state' && activeState)) {
        const targetName = String(selectedState || activeState || '').toLowerCase().trim();
        const stateFeature = geoJsonData.features.find(
          (f) =>
            (f.properties.st_nm || f.properties.ST_NM || f.properties.NAME_1 || f.properties.name || '')
              .toLowerCase()
              .trim() === targetName
        ) || geoJsonData.features.find((f) => {
          const name = normalizeStateName(stateName(f));
          const stateKey = normalizeStateName(selectedState || activeState);
          return name === stateKey || name.includes(stateKey) || stateKey.includes(name);
        }) || (cachedIndiaGeo?.features || []).find((f) => {
          const name = normalizeStateName(stateName(f));
          const stateKey = normalizeStateName(selectedState || activeState);
          return name === stateKey || name.includes(stateKey) || stateKey.includes(name);
        });

        // CRITICAL FIX: never call fitExtent on missing geometry (SVG crash / white screen)
        if (!stateFeature) {
          console.warn('Geometry not found for:', selectedState || activeState);
          if (!geoJsonData.features.length) return null;
          proj.fitExtent([[40, 40], [canvasWidth - 40, canvasHeight - 40]], geoJsonData);
        } else {
          proj.fitExtent([[40, 40], [canvasWidth - 40, canvasHeight - 40]], stateFeature);
        }
      } else {
        proj.fitExtent([[40, 40], [canvasWidth - 40, canvasHeight - 40]], geoJsonData);
      }
    } catch (err) {
      console.warn('Projection fit failed for:', selectedState || activeState, err);
      return null;
    }

    return proj;
  }, [geo, level, activeState, selectedState, width, height]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return geoPath().projection(projection);
  }, [projection]);

  // Aggregate stats per state calculated directly from the live dataset
  const getStateMetrics = (name) => {
    if (!name) return null;
    const norm = normalizeStateName(name);

    // Filter projects matching state name
    const matchingProjects = (allProjects || []).filter((p) => {
      const pNorm = normalizeStateName(p.state);
      return pNorm === norm || pNorm.includes(norm) || norm.includes(pNorm);
    });

    const count = matchingProjects.length;
    if (count > 0) {
      let totalLakhs = 0;
      let totalScore = 0;
      let anomalies = 0;

      matchingProjects.forEach((p) => {
        const sLakhs =
          p.sanctioned_amount_lakhs != null
            ? Number(p.sanctioned_amount_lakhs)
            : Number(p.sanctionedAmount || 0) / 100000;
        totalLakhs += isNaN(sLakhs) ? 0 : sLakhs;
        const score = Number(
          p.composite_risk_score ?? p.risk_score ?? p.riskScore ?? (p.isAnomaly ? 80 : 25)
        );
        totalScore += isNaN(score) ? 25 : score;
        if (score >= 60 || p.isAnomaly || String(p.review_priority || '').includes('HIGH')) {
          anomalies += 1;
        }
      });

      const avgRisk = Math.round(totalScore / count);
      const totalCr = (totalLakhs / 100).toFixed(1);
      const sanctionedFormatted = totalLakhs >= 100 ? `₹${totalCr} Cr` : `₹${totalLakhs.toFixed(1)} L`;
      const riskTier = avgRisk >= 60 ? 'HIGH RISK' : avgRisk >= 35 ? 'MEDIUM RISK' : 'LOW RISK';
      const riskLevel = avgRisk >= 60 ? 'high' : avgRisk >= 35 ? 'medium' : 'low';

      return {
        state: name,
        project_count: count,
        average_risk_score: avgRisk,
        risk_tier: riskTier,
        risk_level: riskLevel,
        sanctioned_formatted: sanctionedFormatted,
        anomaly_count: anomalies,
      };
    }

    // Try stateSummaries from API if present
    const apiMatch = Object.entries(stateSummaries || {}).find(([k]) => {
      const kNorm = normalizeStateName(k);
      return kNorm === norm || kNorm.includes(norm) || norm.includes(kNorm);
    });
    if (apiMatch && apiMatch[1]) {
      return {
        state: name,
        ...apiMatch[1],
      };
    }

    // Default fallback baseline
    return {
      state: name,
      project_count: 0,
      average_risk_score: 0,
      risk_tier: 'LOW RISK',
      risk_level: 'low',
      sanctioned_formatted: '₹0.0 Cr',
      anomaly_count: 0,
    };
  };

  const districtCount = (name) => {
    const dNorm = normalizeStateName(name);
    return (allProjects || []).filter((p) => {
      const pDist = normalizeStateName(p.district || p.constituency || p.block_constituency);
      return pDist === dNorm || pDist.includes(dNorm) || dNorm.includes(pDist);
    }).length;
  };

  const enterState = (name) => {
    if (!name) return;
    try {
      setActiveState(name);
      setLevel('state');
      setHovered(null);
      setHoveredPin(null);
      onStateChange?.(name);
      onSelectState?.(name);
    } catch (err) {
      console.warn('State drilldown failed for:', name, err);
    }
  };

  const reset = () => {
    setActiveState('');
    setLevel('india');
    setHovered(null);
    setHoveredPin(null);
    setSelectedPinProject(null);
    onStateChange?.('');
    onSelectState?.('');
  };

  const handleExploreWorks = () => {
    if (activeState) {
      setLevel('state');
      onStateChange?.(activeState);
      onSelectState?.(activeState);
      window.dispatchEvent(new CustomEvent('prahari:select-state', { detail: { state: activeState } }));
      const worksSection = document.getElementById('works') || document.querySelector('.citizen-works-sidebar') || document.querySelector('.citizen-explorer-layout');
      worksSection?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculate User Location Coordinates on current projection
  const userPoint = useMemo(() => {
    if (!userLocation || !projection || !features.length) return null;
    const uLat = Number(userLocation.lat);
    const uLng = Number(userLocation.lng);
    if (isNaN(uLat) || isNaN(uLng)) return null;

    const pt = projection([uLng, uLat]);
    if (!pt || !isFinite(pt[0]) || !isFinite(pt[1])) return null;
    return { x: pt[0], y: pt[1] };
  }, [userLocation, projection, features]);

  // Project Nearby & Standard Projects with risk classification
  const renderedNearby = useMemo(() => {
    const list = nearbyProjects.length > 0 ? nearbyProjects : allProjects;
    if (!list || !list.length || !projection || !features.length) return [];

    return list
      .map((p) => {
        const lat = Number(p.latitude || p.official_record?.latitude);
        const lng = Number(p.longitude || p.official_record?.longitude);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

        const pt = projection([lng, lat]);
        if (!pt || !isFinite(pt[0]) || !isFinite(pt[1])) return null;

        const score = p.composite_risk_score != null ? Number(p.composite_risk_score) : (p.risk_score != null ? Number(p.risk_score) : (p.riskScore != null ? Number(p.riskScore) : (p.isAnomaly ? 80 : 25)));
        const isHigh = p.isAnomaly || score >= 60 || String(p.review_priority || '').includes('HIGH');
        const isMed = !isHigh && (score >= 30 || p.status === 'delayed');
        const riskLevel = isHigh ? 'high' : isMed ? 'medium' : 'low';
        const riskColor = isHigh ? '#EF4444' : isMed ? '#F59E0B' : '#10B981';

        return {
          ...p,
          id: p.id || p.work_id || 'PRJ-UNK',
          name: p.name || p.work_name || 'Project Work',
          sanctionedAmount: p.sanctionedAmount || (p.sanctioned_amount_lakhs ? p.sanctioned_amount_lakhs * 100000 : 0),
          physicalProgress: p.physicalProgress ?? p.reported_progress_pct ?? 0,
          composite_risk_score: score,
          x: isFinite(pt[0]) ? pt[0] : width / 2,
          y: isFinite(pt[1]) ? pt[1] : height / 2,
          riskLevel,
          riskColor,
        };
      })
      .filter(Boolean);
  }, [nearbyProjects, allProjects, projection, features, width, height]);

  // Filter projects for active state
  const stateProjects = useMemo(() => {
    if (level !== 'state' || !activeState) return [];
    const actNorm = normalizeStateName(activeState);
    return (allProjects || []).filter((p) => {
      const pNorm = normalizeStateName(p.state);
      return pNorm === actNorm || pNorm.includes(actNorm) || actNorm.includes(pNorm);
    });
  }, [level, activeState, allProjects]);

  return (
    <div
      className={`real-map-shell h-full w-full ${borderless ? 'borderless' : ''}`}
      style={
        borderless
          ? {
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
            }
          : undefined
      }
    >
      {!hideToolbar && (
        <div className="real-map-toolbar">
          <div>
            <span className="eyebrow">GEOGRAPHIC PROJECT EXPLORER</span>
            <div className="real-map-title-row">
              {level === 'state' && (
                <button className="map-back" onClick={reset} aria-label="Back to India">
                  <ArrowLeft size={15} />
                </button>
              )}
              <strong>{level === 'india' ? 'India' : activeState}</strong>
            </div>
            <small>
              {level === 'india'
                ? 'Select a state to explore public works'
                : 'Select a district to explore works in this state'}
            </small>
          </div>
          {level === 'state' && (
            <button className="map-reset" onClick={reset}>
              <RotateCcw size={13} /> India
            </button>
          )}
        </div>
      )}

      <div
        className="real-map-canvas"
        style={{
          position: 'relative',
          background: borderless ? 'transparent' : undefined,
          border: borderless ? 'none' : undefined,
          minHeight: height,
        }}
      >
        {/* Top Left Controls: Back to India Map */}
        {(level === 'state' || activeState) && (
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 50 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#FFFFFF',
                color: '#065F46',
                border: '1px solid #D1D5DB',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>←</span> Back to India Map
            </button>
          </div>
        )}

        {loading && (
          <div className="map-loading" style={{ color: '#059669' }}>
            <Loader2 size={22} className="spin" /> Loading geographic boundaries…
          </div>
        )}
        {error && <div className="map-loading map-error">{error}</div>}
        {!loading && !error && projection && pathGenerator && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="india-svg"
            role="img"
            aria-label={`${level === 'india' ? 'India states' : activeState + ' districts'} map`}
          >
            {features.map((feature, index) => {
              const name = level === 'india' ? stateName(feature) : featureName(feature);
              const selected = level === 'india' && normalizeStateName(name) === normalizeStateName(activeState);
              const hoveredHere = hovered?.index === index;
              const pathD = (() => {
                try {
                  return pathGenerator(feature);
                } catch (err) {
                  console.warn('Path generation failed for', name, err);
                  return null;
                }
              })();
              if (!pathD) return null;

              return (
                <g key={`${name}-${index}`}>
                  <path
                    d={pathD}
                    className={`geo-shape ${selected ? 'selected' : ''} ${hoveredHere ? 'hovered' : ''}`}
                    onMouseEnter={() => setHovered({ index, name })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => (level === 'state' ? onDistrictSelect?.(name) : enterState(name))}
                    role="button"
                    style={{
                      cursor: 'pointer',
                      fill:
                        level === 'india'
                          ? getStateMetrics(name)?.risk_level === 'high'
                            ? '#FECACA'
                            : getStateMetrics(name)?.risk_level === 'medium'
                            ? '#FDE68A'
                            : '#A7F3D0'
                          : undefined,
                    }}
                  />
                </g>
              );
            })}

            {/* Project coordinate pins intentionally omitted for a clean executive choropleth. */}
            {false &&
              level === 'state' &&
              features.length > 0 &&
              stateProjects.slice(0, 1500).map((p, idx) => {
                const lat = Number(p.latitude || p.official_record?.latitude);
                const lng = Number(p.longitude || p.official_record?.longitude);

                let px = null;
                let py = null;

                if (!isNaN(lat) && !isNaN(lng) && lat >= 6.0 && lat <= 38.0 && lng >= 66.0 && lng <= 99.0) {
                  const pt = projection([lng, lat]);
                  if (pt && isFinite(pt[0]) && isFinite(pt[1])) {
                    if (pt[0] >= 10 && pt[0] <= width - 10 && pt[1] >= 10 && pt[1] <= height - 10) {
                      px = pt[0];
                      py = pt[1];
                    }
                  }
                }

                // Fallback: district center if coords outside bounds or missing
                if (px === null || py === null) {
                  const pDist = normalizeStateName(p.district || p.constituency || p.block_constituency);
                  const districtFeature = features.find((f) => {
                    const fName = normalizeStateName(featureName(f));
                    return fName === pDist || fName.includes(pDist) || pDist.includes(fName);
                  });

                  if (districtFeature && pathGenerator) {
                    const centroid = pathGenerator.centroid(districtFeature);
                    if (centroid && isFinite(centroid[0]) && isFinite(centroid[1])) {
                      const angle = (idx * 137.5077 * Math.PI) / 180;
                      const r = ((idx % 20) + 1) * 2.5;
                      px = centroid[0] + Math.cos(angle) * r;
                      py = centroid[1] + Math.sin(angle) * r;
                    }
                  } else if (geo && pathGenerator) {
                    const centroid = pathGenerator.centroid(geo);
                    if (centroid && isFinite(centroid[0]) && isFinite(centroid[1])) {
                      const angle = (idx * 137.5077 * Math.PI) / 180;
                      const r = ((idx % 35) + 1) * 3.2;
                      px = centroid[0] + Math.cos(angle) * r;
                      py = centroid[1] + Math.sin(angle) * r;
                    }
                  }
                }

                if (px === null || py === null) return null;

                // Clamp within canvas boundaries with safety padding
                px = Math.max(25, Math.min(width - 25, px));
                py = Math.max(25, Math.min(height - 25, py));

                const score = Number(
                  p.composite_risk_score ?? p.risk_score ?? p.riskScore ?? (p.isAnomaly ? 80 : 25)
                );
                const isHigh = p.isAnomaly || score >= 60 || String(p.review_priority || '').includes('HIGH');
                const isMed = !isHigh && (score >= 30 || p.status === 'delayed');
                const pinColor = isHigh ? '#EF4444' : isMed ? '#F59E0B' : '#10B981';
                const isSelected =
                  (selectedPinProject?.id || selectedPinProject?.work_id) === (p.id || p.work_id);

                return (
                  <g
                    key={`state-pin-${p.id || p.work_id || idx}`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPinProject(p);
                      onProjectSelect?.(p);
                    }}
                    onMouseEnter={() => {
                      setHoveredPin({
                        project: p,
                        x: px,
                        y: py,
                        score,
                        isHigh,
                        isMed,
                        pinColor,
                      });
                      onProjectHover?.(p);
                    }}
                    onMouseLeave={() => {
                      setHoveredPin(null);
                      onProjectHover?.(null);
                    }}
                  >
                    {isSelected && (
                      <circle cx={px} cy={py} r={12} fill={pinColor} fillOpacity={0.25} stroke={pinColor} strokeWidth={1.5} />
                    )}
                    <circle
                      cx={px}
                      cy={py}
                      r={isHigh ? 5.5 : 4}
                      fill={pinColor}
                      stroke="#ffffff"
                      strokeWidth={1.2}
                      opacity={0.92}
                    />
                    <circle cx={px} cy={py} r={1.2} fill="#ffffff" />
                  </g>
                );
              })}

            {/* Nearby project pins omitted on the homepage / explorer choropleth. */}
            {false &&
              level === 'india' &&
              nearbyProjects?.length > 0 &&
              renderedNearby.map((p) => {
                const isSelected =
                  (selectedPinProject?.id || selectedPinProject?.work_id) === (p.id || p.work_id);
                return (
                  <g
                    key={`nearby-pin-${p.id || p.work_id}`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPinProject(p);
                      onProjectSelect?.(p);
                    }}
                    onMouseEnter={() => {
                      setHoveredPin({
                        project: p,
                        x: p.x,
                        y: p.y,
                        score: p.composite_risk_score,
                        isHigh: p.riskLevel === 'high',
                        isMed: p.riskLevel === 'medium',
                        pinColor: p.riskColor,
                      });
                      onProjectHover?.(p);
                    }}
                    onMouseLeave={() => {
                      setHoveredPin(null);
                      onProjectHover?.(null);
                    }}
                  >
                    {isSelected && (
                      <circle cx={p.x} cy={p.y} r={12} fill={p.riskColor} fillOpacity={0.25} stroke={p.riskColor} strokeWidth={1.5} />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={p.riskLevel === 'high' ? 5.5 : 4}
                      fill={p.riskColor}
                      stroke="#ffffff"
                      strokeWidth={1.2}
                      opacity={0.92}
                    />
                    <circle cx={p.x} cy={p.y} r={1.2} fill="#ffffff" />
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
                <circle cx={userPoint.x} cy={userPoint.y} r={16} fill="#2563eb" fillOpacity={0.25} className="user-loc-pulse" />
                <circle cx={userPoint.x} cy={userPoint.y} r={6.5} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />
                <circle cx={userPoint.x} cy={userPoint.y} r={2} fill="#ffffff" />
                <rect x={userPoint.x - 34} y={userPoint.y - 23} width={68} height={15} rx={4} fill="#1e3a8a" fillOpacity={0.92} />
                <text x={userPoint.x} y={userPoint.y - 12} textAnchor="middle" fill="#ffffff" fontSize={8.5} fontWeight="700">
                  {userLocation?.isDemo ? '📍 Demo' : '📍 You'}
                </text>
              </g>
            )}
          </svg>
        )}

        {/* Floating State Hover Card (Level === 'india') */}
        {level === 'india' && hovered?.name && (() => {
          const info = getStateMetrics(hovered.name);
          if (!info) return null;
          const riskScore = info.average_risk_score;
          const isHigh = riskScore >= 60 || info.risk_level === 'high';
          const isMed = !isHigh && (riskScore >= 35 || info.risk_level === 'medium');

          return (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 40,
                width: '270px',
                backgroundColor: '#FFFFFF',
                color: '#111827',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                border: '1px solid #E5E7EB',
                pointerEvents: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                  {info.state || hovered.name}
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: isHigh ? '#FEE2E2' : isMed ? '#FEF3C7' : '#D1FAE5',
                    color: isHigh ? '#991B1B' : isMed ? '#92400E' : '#065F46',
                    border: isHigh ? '1px solid #FCA5A5' : isMed ? '1px solid #FCD34D' : '1px solid #A7F3D0',
                  }}
                >
                  ● {isHigh ? 'High Risk' : isMed ? 'Medium Risk' : 'Low Risk'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #E5E7EB',
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', display: 'block' }}>
                    PROJECTS
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                    {Number(info.project_count || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', display: 'block' }}>
                    RISK SCORE
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: isHigh ? '#EF4444' : isMed ? '#D97706' : '#10B981' }}>
                    {Number.isFinite(Number(riskScore)) ? Number(riskScore) : 0}%
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', display: 'block' }}>
                    SANCTIONED
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                    {info.sanctioned_formatted || '₹0.0 Cr'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', display: 'block' }}>
                    ANOMALIES
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#DC2626' }}>
                    {Number(info.anomaly_count || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                Click state to inspect parliamentary works →
              </div>
            </div>
          );
        })()}

        {/* Pin Tooltip on State View */}
        {hoveredPin && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(Math.max((hoveredPin.x / width) * 100, 18), 82)}%`,
              top: `${Math.max((hoveredPin.y / height) * 100 - 12, 6)}%`,
              transform: 'translate(-50%, -100%)',
              backgroundColor: '#FFFFFF',
              color: '#111827',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              padding: '10px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              pointerEvents: 'none',
              zIndex: 50,
              minWidth: '220px',
              maxWidth: '300px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>
                {hoveredPin.project.district || hoveredPin.project.constituency || activeState}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: hoveredPin.isHigh ? '#FEE2E2' : hoveredPin.isMed ? '#FEF3C7' : '#ECFDF5',
                  color: hoveredPin.isHigh ? '#991B1B' : hoveredPin.isMed ? '#92400E' : '#065F46',
                }}
              >
                {hoveredPin.score}% Risk
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827', lineHeight: '1.3', marginBottom: '6px' }}>
              {hoveredPin.project.work_name || hoveredPin.project.name || 'Public Work'}
            </div>
            <div style={{ fontSize: '11px', color: '#4B5563', display: 'flex', justifyContent: 'space-between' }}>
              <span>
                Cost: ₹
                {(
                  (hoveredPin.project.sanctioned_amount_lakhs != null
                    ? Number(hoveredPin.project.sanctioned_amount_lakhs)
                    : Number(hoveredPin.project.sanctionedAmount || 0) / 100000)
                ).toFixed(1)}{' '}
                Lakhs
              </span>
              <span>
                Progress: {hoveredPin.project.reported_progress_pct ?? hoveredPin.project.physicalProgress ?? 0}%
              </span>
            </div>
          </div>
        )}

        {/* Standard District Tooltip in State view when no pin is hovered */}
        {level === 'state' && hovered && !hoveredPin && (
          <div
            className="map-tooltip"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: '#FFFFFF',
              color: '#111827',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              zIndex: 20,
              fontSize: '12px',
            }}
          >
            <b style={{ display: 'block', color: '#111827' }}>{hovered.name}</b>
            <span style={{ color: '#6B7280', fontSize: '11px' }}>{districtCount(hovered.name)} works in this district</span>
          </div>
        )}

        {/* Interactive Popup Card for Selected Pin (Only if hidePopup is false) */}
        {!hidePopup && selectedPinProject && (
          <div
            className="nearby-map-popup"
            style={{
              position: 'absolute',
              left: 20,
              bottom: 20,
              zIndex: 25,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 12,
              padding: '14px 16px',
              width: 270,
              boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
              color: '#1c1917',
            }}
          >
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
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background:
                        selectedPinProject.riskLevel === 'high'
                          ? '#fee2e2'
                          : selectedPinProject.riskLevel === 'medium'
                          ? '#fef3c7'
                          : '#dcfce7',
                      color:
                        selectedPinProject.riskLevel === 'high'
                          ? '#991b1b'
                          : selectedPinProject.riskLevel === 'medium'
                          ? '#92400e'
                          : '#166534',
                    }}
                  >
                    {selectedPinProject.riskLevel === 'high'
                      ? '🔴 High Risk'
                      : selectedPinProject.riskLevel === 'medium'
                      ? '🟡 Medium Risk'
                      : '🟢 Low Risk'}
                  </span>
                  <button onClick={() => setSelectedPinProject(null)} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2 }} aria-label="Close">
                    <X size={14} />
                  </button>
                </div>
                <div style={{ fontSize: 9, color: '#78716c', fontWeight: 700, marginBottom: 2 }}>
                  {selectedPinProject.id || selectedPinProject.work_id} · {selectedPinProject.sector || selectedPinProject.category}
                </div>
                <strong style={{ fontSize: 12, display: 'block', lineHeight: 1.35, marginBottom: 6, color: '#0c0a09' }}>
                  {selectedPinProject.name || selectedPinProject.work_name}
                </strong>
                <div style={{ fontSize: 10, color: '#57534e', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                  <span>📍 {selectedPinProject.district || selectedPinProject.constituency}, {selectedPinProject.state}</span>
                  {selectedPinProject.distanceFormatted && (
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>📏 {selectedPinProject.distanceFormatted}</span>
                  )}
                  <span>
                    Progress: {selectedPinProject.physicalProgress ?? 0}% · ₹
                    {(
                      (selectedPinProject.sanctionedAmount
                        ? selectedPinProject.sanctionedAmount / 100000
                        : selectedPinProject.sanctioned_amount_lakhs || 0)
                    ).toFixed(1)}
                    L
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      onProjectSelect?.(selectedPinProject);
                    }}
                    style={{
                      flex: 1,
                      background: '#059669',
                      color: '#fff',
                      border: 0,
                      borderRadius: 7,
                      padding: '7px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Select Work <ArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => navigate(`/official/risk/${selectedPinProject.id || selectedPinProject.work_id}`)}
                    style={{
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
                      cursor: 'pointer',
                    }}
                    title="View Official Dossier"
                  >
                    Dossier
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clean Bottom Left Fixed Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '6px 14px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            fontSize: '11px',
            fontWeight: '600',
            color: '#4B5563',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} /> High Risk
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} /> Medium Risk
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} /> Low Risk
          </span>
          {userLocation && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB', marginLeft: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'inline-block' }} /> {userLocation.isDemo ? 'Demo Location' : 'Your Location'}
            </span>
          )}
        </div>
      </div>

      {level === 'state' && !hideSelectionCard && !borderless && !hidePopup && (
        <div className="map-selection-card">
          <div>
            <span className="eyebrow">SELECTED STATE</span>
            <b>{activeState}</b>
            <small>
              {stateProjects.length} works in current data
            </small>
          </div>
          <button onClick={handleExploreWorks} aria-label={`Explore works in ${activeState}`}>
            Explore works <MapPin size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
