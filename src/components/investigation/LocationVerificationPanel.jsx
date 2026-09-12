import React from 'react';
import { MapPin, Navigation, Compass, AlertTriangle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LocationVerificationPanel({
  project,
  caseData,
  onStartFieldVerification,
}) {
  const { t } = useLanguage();
  const p = project;

  // Expected coordinates
  const expLat = p.latitude || 25.3176;
  const expLng = p.longitude || 82.9739;

  // Observed coordinates from captured evidence or demo drift
  const captured = caseData?.capturedEvidence;
  const obsLat = captured?.coordinates?.lat || (expLat + 0.0022);
  const obsLng = captured?.coordinates?.lng || (expLng + 0.0018);
  const driftMeters = captured?.spatialDriftMeters || 274;

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

      {/* Mini Visual Spatial Preview */}
      <div className="spatial-radar-box">
        <div className="radar-canvas">
          <div className="perimeter-circle ring-outer" />
          <div className="perimeter-circle ring-inner" />
          <div className="center-pin" title="Expected Baseline Location">
            <MapPin size={16} />
            <span>Expected</span>
          </div>
          <div
            className="drift-pin"
            style={{ transform: 'translate(45px, -35px)' }}
            title={`Observed Location (${driftMeters}m drift)`}
          >
            <Navigation size={15} />
            <span>Observed ({driftMeters}m)</span>
          </div>
        </div>

        <div className="radar-info">
          <b>Geospatial Perimeter Analysis</b>
          <p>
            The observed field point is located <b>{driftMeters}m north-east</b> of the approved work coordinates. While within general village boundary, it borders candidate project <b>PRJ001</b>. Ground inspection is advised to confirm perimeter demarcation.
          </p>
          <button
            type="button"
            className="primary-action btn-start-field"
            onClick={onStartFieldVerification}
          >
            {t('inv_start_field_verif')}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
