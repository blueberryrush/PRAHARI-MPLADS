import React, { useMemo } from 'react';
import { MapPin, Navigation, Compass, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Layers, Copy } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import CivicMap from '../map/CivicMap';

export default function LocationVerificationPanel({
  project,
  caseData,
  candidateProject,
  onOpenDuplicateModal,
  onStartFieldVerification,
}) {
  const { t } = useLanguage();
  const p = project;

  // Expected coordinates
  const expLat = Number(p?.latitude) || 25.3176;
  const expLng = Number(p?.longitude) || 82.9739;

  // Observed coordinates from captured evidence or demo drift
  const captured = caseData?.capturedEvidence;
  const obsLat = captured?.coordinates?.lat || (expLat + 0.0022);
  const obsLng = captured?.coordinates?.lng || (expLng + 0.0018);
  const driftMeters = captured?.spatialDriftMeters || 274;

  const candidate = useMemo(() => {
    if (candidateProject) return candidateProject;
    return {
      id: 'PRJ001',
      name: 'Construction of 2km Bituminous Road Connecting GT Road',
      state: p.state || 'Uttar Pradesh',
      district: p.district || 'Varanasi',
      constituency: p.constituency || 'Varanasi',
      sector: 'Roads & Bridges',
      latitude: expLat + 0.0016,
      longitude: expLng + 0.0012,
      sanctionedAmount: 4800000,
      spentAmount: 4600000,
      physicalProgress: 95,
      financialProgress: 96,
      riskScore: 35,
      composite_risk_score: 35,
      isAnomaly: false,
    };
  }, [candidateProject, p, expLat, expLng]);

  const mapProjects = useMemo(() => {
    return [p, candidate].filter(Boolean);
  }, [p, candidate]);

  let locStatus = {
    key: 'inv_loc_review',
    badgeCls: 'loc-review',
    icon: AlertTriangle,
    label: t('inv_loc_review'),
  };

  if (driftMeters <= 50) {
    locStatus = {
      key: 'inv_loc_matches',
      badgeCls: 'loc-match',
      icon: CheckCircle2,
      label: t('inv_loc_matches'),
    };
  } else if (driftMeters > 500) {
    locStatus = {
      key: 'inv_loc_mismatch',
      badgeCls: 'loc-mismatch',
      icon: XCircle,
      label: t('inv_loc_mismatch'),
    };
  }

  const StatusIcon = locStatus.icon;

  return (
    <section className="panel location-verification-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('type_geospatial')}</span>
          <h3>{t('inv_loc_verif_title')}</h3>
        </div>

        <span className={`location-status-badge ${locStatus.badgeCls}`}>
          <StatusIcon size={14} />
          <span>{locStatus.label}</span>
        </span>
      </div>

      <div className="location-grid">
        {/* Coordinates Cards */}
        <div className="coords-card">
          <div className="coords-header">
            <MapPin size={15} className="text-brand" />
            <b>{t('inv_expected_coords')}</b>
          </div>
          <div className="coords-body">
            <span className="coord-val">
              {expLat.toFixed(5)}° N, {expLng.toFixed(5)}° E
            </span>
            <small>Approved DPR Baseline (GIS Registry)</small>
          </div>
        </div>

        <div className="coords-card">
          <div className="coords-header">
            <Navigation size={15} className="text-amber" />
            <b>{t('inv_observed_coords')}</b>
          </div>
          <div className="coords-body">
            <span className="coord-val">
              {obsLat.toFixed(5)}° N, {obsLng.toFixed(5)}° E
            </span>
            <small>{captured ? 'Captured via Mobile Device' : 'Estimated from Field Asset Sensor'}</small>
          </div>
        </div>

        <div className="coords-card drift-card">
          <div className="coords-header">
            <Compass size={15} className="text-danger" />
            <b>{t('inv_spatial_drift')}</b>
          </div>
          <div className="coords-body">
            <span className="coord-val text-danger">
              {driftMeters} meters
            </span>
            <small>Approved perimeter tolerance: 50m</small>
          </div>
        </div>
      </div>

      {/* Embedded CivicMap for GIS Verification */}
      <div className="gis-map-embedded-wrapper" style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
        <CivicMap
          projects={mapProjects}
          initialCenter={{ lat: expLat, lng: expLng }}
          initialZoom={15}
          focusedId={p.id}
          height={340}
          showFilters={false}
          title="Physical & GIS Ground Footprint"
          subtitle={`Centered on approved coordinates (${expLat.toFixed(4)}°N, ${expLng.toFixed(4)}°E) · Candidate PRJ001 shown`}
        />
      </div>

      {/* Duplicate Candidate Comparison & Field Actions Bar */}
      <div className="spatial-actions-banner" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 18px', background: '#FAFBF8', border: '1px solid var(--line)', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F8EAE7', display: 'grid', placeItems: 'center', color: '#C85A32', flexShrink: 0 }}>
            <Copy size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
              Duplicate Candidate Detected: <b style={{ color: '#C85A32' }}>PRJ001</b> (180m away)
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              Suspected proximity overlap: 2km bituminous road connector in same revenue village.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {onOpenDuplicateModal && (
            <button
              type="button"
              className="primary-action"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={onOpenDuplicateModal}
            >
              <Copy size={14} />
              <span>Compare Candidate Works Side-by-Side</span>
            </button>
          )}

          {onStartFieldVerification && (
            <button
              type="button"
              className="secondary-action"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={onStartFieldVerification}
            >
              <Navigation size={14} />
              <span>{t('inv_start_field_verif')}</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
