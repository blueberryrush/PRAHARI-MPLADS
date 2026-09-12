import React from 'react';
import { Database, RefreshCw, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DataFreshnessCard() {
  const { t } = useLanguage();

  const sources = [
    {
      name: t('inv_sync_esakshi'),
      sync: '45 mins ago',
      status: 'recent',
      badge: t('inv_fresh_recent'),
    },
    {
      name: t('inv_sync_pfms'),
      sync: '2 hours ago',
      status: 'recent',
      badge: t('inv_fresh_recent'),
    },
    {
      name: t('inv_sync_gis'),
      sync: '1 day ago',
      status: 'valid',
      badge: 'Validated Baseline',
    },
    {
      name: t('inv_sync_citizen'),
      sync: 'Real-time WebSocket',
      status: 'live',
      badge: 'Live Stream',
    },
  ];

  return (
    <section className="panel data-freshness-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('inv_source_records')}</span>
          <h3>{t('inv_data_freshness_title')}</h3>
        </div>
        <div className="auto-sync-chip">
          <RefreshCw size={13} className="spin-slow" />
          <span>Continuous Sync Active</span>
        </div>
      </div>

      <div className="freshness-grid">
        {sources.map((src, i) => (
          <div key={i} className="freshness-item">
            <div className="freshness-item-left">
              <Database size={15} className="text-brand" />
              <div>
                <b>{src.name}</b>
                <small>Last synced: {src.sync}</small>
              </div>
            </div>
            <span className="freshness-badge">
              <CheckCircle2 size={12} /> {src.badge}
            </span>
          </div>
        ))}
      </div>

      <p className="freshness-footnote">
        Data reflects latest official government synchronization. Records with drift over 48 hours are automatically flagged with warning advisories.
      </p>
    </section>
  );
}
