import React, { useState } from 'react';
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Flag,
  MapPin,
  FileText,
  Clock,
  Calculator,
  ExternalLink,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function WhyFlaggedSection({
  project,
  risk,
  onOpenDuplicateModal,
  onOpenFinancialDetails,
}) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const p = project;

  // Compute specific metrics for calculation details
  const costDiff = (p?.spentAmount || 0) - (p?.sanctionedAmount || 0);
  const costVariancePct = p?.sanctionedAmount ? ((costDiff / p.sanctionedAmount) * 100).toFixed(1) : '0.0';
  const progressGap = ((p?.financialProgress || 0) - (p?.physicalProgress || 0));

  return (
    <section className="panel why-flagged-section">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('inv_evidence_eyebrow')}</span>
          <h3>{t('inv_why_flagged_title')}</h3>
          <p className="panel-sub">{t('inv_why_flagged_sub')}</p>
        </div>

        <button
          type="button"
          className="btn-details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Calculator size={14} />
          <span>{showDetails ? t('inv_hide_details') : t('inv_view_details')}</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Signals List */}
      <div className="signals-list">
        {/* Signal 1: Financial */}
        <div className="signal-card financial">
          <div className="signal-card-icon red">
            <Flag size={16} />
          </div>
          <div className="signal-card-body">
            <div className="signal-head">
              <b>{t('signal_financial_name')}</b>
              <span className="signal-chip severity-high">{t('signal_high')}</span>
            </div>
            <p className="signal-explanation">
              Reported expenditure ₹{(p.spentAmount / 100000).toFixed(1)}L exceeds sanctioned allocation ₹{(p.sanctionedAmount / 100000).toFixed(1)}L by {costVariancePct}%. Financial disbursement ({p.financialProgress}%) outpaces reported physical completion ({p.physicalProgress}%).
            </p>
            <div className="signal-meta">
              <span><b>Source:</b> PFMS Authorized Ledger Feed</span>
              <span><b>Last updated:</b> 2 hours ago</span>
            </div>
          </div>
        </div>

        {/* Signal 2: Spatial / Duplicate (if applicable or for demo PRJ002) */}
        {(p.id === 'PRJ002' || p.id === 'PRJ046' || p.id === 'PRJ047' || p.isAnomaly) && (
          <div className="signal-card spatial">
            <div className="signal-card-icon teal">
              <MapPin size={16} />
            </div>
            <div className="signal-card-body">
              <div className="signal-head">
                <b>{t('signal_spatial_name')}</b>
                <span className="signal-chip severity-high">{t('signal_high')}</span>
              </div>
              <p className="signal-explanation">
                Potential spatial overlap detected: Candidate work <b>PRJ001</b> located within 180m perimeter shares identical specifications (2km bituminous village connector road).
              </p>
              <div className="signal-meta">
                <span><b>Source:</b> eSAKSHI & GIS Coordinate Registry</span>
                <span><b>Last updated:</b> 4 hours ago</span>
                {onOpenDuplicateModal && (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={onOpenDuplicateModal}
                  >
                    Compare Candidate PRJ001 →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Signal 3: Agency Signal */}
        <div className="signal-card agency">
          <div className="signal-card-icon amber">
            <FileText size={16} />
          </div>
          <div className="signal-card-body">
            <div className="signal-head">
              <b>{t('signal_agency_name')}</b>
              <span className="signal-chip severity-medium">{t('signal_medium')}</span>
            </div>
            <p className="signal-explanation">
              Implementing agency ({p.agency}) has 3 active concurrent projects with delay or audit reviews recorded in state repository. Serves as review context, not a finding of wrongdoing.
            </p>
            <div className="signal-meta">
              <span><b>Source:</b> State PWD Contractor Performance Index</span>
              <span><b>Last updated:</b> 1 day ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Calculation Breakdown */}
      {showDetails && (
        <div className="calculation-breakdown-drawer">
          <div className="drawer-header">
            <div className="drawer-title">
              <Calculator size={15} />
              <b>{t('inv_calc_breakdown')}</b>
            </div>
            <span className="math-badge">Deterministic Formula</span>
          </div>

          <div className="breakdown-grid">
            <div className="breakdown-card">
              <span className="calc-label">{t('inv_fin_sanctioned')}</span>
              <b className="calc-value">₹{(p.sanctionedAmount).toLocaleString('en-IN')}</b>
              <small>Approved by District Planning Committee</small>
            </div>

            <div className="breakdown-card">
              <span className="calc-label">{t('inv_fin_released')} / Spent</span>
              <b className="calc-value text-danger">₹{(p.spentAmount).toLocaleString('en-IN')}</b>
              <small>PFMS Tranche 1 & 2 releases</small>
            </div>

            <div className="breakdown-card">
              <span className="calc-label">{t('inv_calc_variance')}</span>
              <b className={`calc-value ${costDiff > 0 ? 'text-danger' : 'text-green'}`}>
                {costDiff > 0 ? `+${costVariancePct}% (+₹${(costDiff / 100000).toFixed(1)}L)` : `${costVariancePct}%`}
              </b>
              <small>Z-Score: +2.84 standard deviations</small>
            </div>

            <div className="breakdown-card">
              <span className="calc-label">{t('inv_calc_progress_gap')}</span>
              <b className="calc-value text-danger">+{progressGap}%</b>
              <small>Financial ({p.financialProgress}%) − Physical ({p.physicalProgress}%)</small>
            </div>
          </div>

          <div className="source-records-strip">
            <span className="records-label">{t('inv_calc_source_records')}:</span>
            <span className="source-pill">eSAKSHI Work Order: <code>WO/UP/VAR/2024/0821</code></span>
            <span className="source-pill">PFMS Sanction ID: <code>PFMS-VAR-2024-TR18</code></span>
            <span className="source-pill">GIS Asset Tag: <code>GIS-RD-8297-2531</code></span>
          </div>
        </div>
      )}

      {/* Governance Notice */}
      <div className="governance-reassurance-notice">
        <ShieldAlert size={16} className="notice-icon" />
        <span>{t('inv_flagged_notice')}</span>
      </div>
    </section>
  );
}
