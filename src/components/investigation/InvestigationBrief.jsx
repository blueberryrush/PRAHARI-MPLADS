import React from 'react';
import { AlertCircle, CheckCircle2, Info, ArrowRight, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function InvestigationBrief({ project }) {
  const { t } = useLanguage();
  const p = project;

  // Custom attention items tailored to project signals
  const attentionItems = [
    {
      num: '01',
      title: 'Disproportionate Fund Disbursement',
      desc: `₹${(((p?.spentAmount || 0)) / 100000).toFixed(1)}L disbursed against ${p?.physicalProgress || 0}% verified physical completion. Requires reconciliation with MB book entries.`,
    },
    {
      num: '02',
      title: 'Proximity to Candidate Work PRJ001',
      desc: 'Coordinates lie within 180m of another bituminous road project. Need to verify that separate physical stretches were constructed.',
    },
    {
      num: '03',
      title: 'Agency Milestone Compliance History',
      desc: `Agency ${p?.agency || 'N/A'} has active projects in the district. Cross-verify contractor labor muster rolls and bitumen test reports.`,
    },
  ];

  const recommendedSteps = [
    {
      num: '1',
      action: 'Conduct On-Site Measurement',
      desc: 'Verify the physical length (2km), road width (3.75m), and culvert structural completion on-site with GPS photo capture.',
    },
    {
      num: '2',
      action: 'Audit Measurement Book (MB) & Vouchers',
      desc: 'Inspect Junior Engineer signed MB entries and compare cumulative bill disbursements against PFMS release dates.',
    },
    {
      num: '3',
      action: 'Boundary Demarcation with PRJ001',
      desc: 'Survey start and end chainage points against PRJ001 project boundary to definitively confirm or rule out duplicate execution.',
    },
  ];

  return (
    <section className="panel investigation-brief-section">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('inv_workspace_eyebrow')}</span>
          <h3>{t('inv_brief_title')}</h3>
        </div>
        <div className="brief-guidance-badge">
          <Info size={14} />
          <span>{t('inv_brief_notice')}</span>
        </div>
      </div>

      <div className="brief-grid">
        {/* What Needs Attention? */}
        <div className="brief-card attention-card">
          <div className="card-header">
            <AlertCircle size={16} className="text-amber" />
            <h4>{t('inv_attention_title')}</h4>
          </div>
          <div className="brief-items-list">
            {attentionItems.map((item, idx) => (
              <div key={idx} className="brief-item">
                <span className="item-num">{item.num}</span>
                <div className="item-content">
                  <b>{item.title}</b>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Verification */}
        <div className="brief-card action-card">
          <div className="card-header">
            <CheckCircle2 size={16} className="text-brand" />
            <h4>{t('inv_recommended_title')}</h4>
          </div>
          <div className="brief-items-list">
            {recommendedSteps.map((step, idx) => (
              <div key={idx} className="brief-item step-item">
                <span className="step-badge">{step.num}</span>
                <div className="item-content">
                  <b>{step.action}</b>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
