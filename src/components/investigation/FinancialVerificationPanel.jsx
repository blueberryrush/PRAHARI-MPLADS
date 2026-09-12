import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function FinancialVerificationPanel({ project }) {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const p = project;

  const sanctioned = p?.sanctionedAmount || 0;
  const released = p?.spentAmount || 0; // released to agency
  const utilized = p?.spentAmount || 0;
  const balance = sanctioned - utilized;
  const isOverrun = balance < 0;

  // Mock PFMS payment schedule
  const paymentVouchers = [
    {
      no: 'PFMS/2024/00142',
      date: '2024-02-05',
      amount: 400000,
      cumulative: 400000,
      milestone: 'Mobilization Advance & Site Layout',
      status: 'Paid',
    },
    {
      no: 'PFMS/2024/00389',
      date: '2024-03-18',
      amount: 400000,
      cumulative: 800000,
      milestone: 'Sub-base Earthwork & Grading (25%)',
      status: 'Paid',
    },
    {
      no: 'PFMS/2024/00712',
      date: '2024-05-12',
      amount: 600000,
      cumulative: 1400000,
      milestone: 'Culvert Box Concrete & WBM Layer (40%)',
      status: 'Paid',
    },
    {
      no: 'PFMS/2024/01150',
      date: '2024-07-29',
      amount: 800000,
      cumulative: 2200000,
      milestone: 'Bituminous Macadam Binder Course (55%)',
      status: 'Paid',
    },
  ];

  return (
    <section className="panel financial-verification-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('type_financial')}</span>
          <h3>{t('inv_fin_verif_title')}</h3>
        </div>

        <button
          type="button"
          className="secondary-action btn-view-pfms"
          onClick={() => setShowModal(true)}
        >
          <FileSpreadsheet size={14} />
          <span>{t('inv_view_fin_details')}</span>
        </button>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="fin-metrics-grid">
        <div className="fin-card">
          <span className="fin-label">{t('inv_fin_sanctioned')}</span>
          <b className="fin-amount">₹{(sanctioned / 100000).toFixed(2)} Lakh</b>
          <small className="fin-sub">Administrative Approval</small>
        </div>

        <div className="fin-card">
          <span className="fin-label">{t('inv_fin_released')}</span>
          <b className="fin-amount text-danger">₹{(released / 100000).toFixed(2)} Lakh</b>
          <small className="fin-sub">Treasury Releases</small>
        </div>

        <div className="fin-card">
          <span className="fin-label">{t('inv_fin_utilized')}</span>
          <b className="fin-amount text-danger">₹{(utilized / 100000).toFixed(2)} Lakh</b>
          <small className="fin-sub">Billed by Agency {p?.agency || 'N/A'}</small>
        </div>

        <div className="fin-card">
          <span className="fin-label">{t('inv_fin_balance')}</span>
          <b className={`fin-amount ${isOverrun ? 'text-danger' : 'text-green'}`}>
            {isOverrun ? `-₹${(Math.abs(balance) / 100000).toFixed(2)} Lakh (Overrun)` : `₹${(balance / 100000).toFixed(2)} Lakh`}
          </b>
          <small className="fin-sub">{isOverrun ? 'Exceeds Sanction Cap' : 'Unspent Balance'}</small>
        </div>
      </div>

      {/* Visual Mismatch Comparison Bar */}
      <div className="progress-mismatch-box">
        <div className="mismatch-header">
          <b>{t('inv_fin_comparison_title')}</b>
          {(p?.financialProgress || 0) > (p?.physicalProgress || 0) && (
            <span className="mismatch-alert-chip">
              <AlertTriangle size={13} />
              +{(p?.financialProgress || 0) - (p?.physicalProgress || 0)}% Discrepancy
            </span>
          )}
        </div>

        <div className="bar-comparison-row">
          <div className="bar-label-group">
            <span>{t('inv_physical_prog')}</span>
            <b>{p?.physicalProgress || 0}%</b>
          </div>
          <div className="track-bar">
            <div
              className="fill-bar physical-fill"
              style={{ width: `${Math.min(p?.physicalProgress || 0, 100)}%` }}
            />
          </div>
        </div>

        <div className="bar-comparison-row">
          <div className="bar-label-group">
            <span>{t('inv_financial_prog')}</span>
            <b className={(p?.financialProgress || 0) > 100 ? 'text-danger' : ''}>
              {p?.financialProgress || 0}%
            </b>
          </div>
          <div className="track-bar">
            <div
              className={`fill-bar financial-fill ${(p?.financialProgress || 0) > 100 ? 'danger-fill' : ''}`}
              style={{ width: `${Math.min(p?.financialProgress || 0, 100)}%` }}
            />
          </div>
        </div>

        <p className="mismatch-explanation">
          {(p?.financialProgress || 0) > (p?.physicalProgress || 0)
            ? `Disbursement of funds (${p?.financialProgress || 0}%) significantly leads physical progress (${p?.physicalProgress || 0}%). Official guidelines require physical measurement certification before release of tranches exceeding 100%.`
            : `Financial disbursement is aligned with reported physical milestones.`}
        </p>
      </div>

      {/* Financial Details Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-window wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">PFMS FINANCIAL LEDGER</span>
                <h3>{t('inv_pfms_schedule_title')}</h3>
                <p className="sub-text">Case {p?.id} · {p?.name}</p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="ledger-summary-banner">
                <div>
                  <span>Total Sanction:</span>
                  <b>₹{(sanctioned).toLocaleString('en-IN')}</b>
                </div>
                <div>
                  <span>Total Released:</span>
                  <b className="text-danger">₹{(released).toLocaleString('en-IN')}</b>
                </div>
                <div>
                  <span>Ledger Status:</span>
                  <b className="text-danger">Over-disbursed (+{((released - sanctioned) / sanctioned * 100).toFixed(0)}%)</b>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('inv_voucher_no')}</th>
                      <th>{t('inv_voucher_date')}</th>
                      <th>{t('inv_voucher_amount')}</th>
                      <th>{t('inv_voucher_cum')}</th>
                      <th>{t('inv_voucher_milestone')}</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentVouchers.map((v, i) => (
                      <tr key={i}>
                        <td><code>{v.no}</code></td>
                        <td>{v.date}</td>
                        <td><b>₹{v.amount.toLocaleString('en-IN')}</b></td>
                        <td>₹{v.cumulative.toLocaleString('en-IN')}</td>
                        <td>{v.milestone}</td>
                        <td><span className="badge-paid">✓ {v.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pfms-source-note">
                <ShieldCheck size={14} className="text-brand" />
                <span>Authorized PFMS API Synchronization feed · Verified via Central Treasury Server</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="primary-action"
                onClick={() => setShowModal(false)}
              >
                {t('btn_close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
