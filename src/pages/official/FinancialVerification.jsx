import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCaseContext } from '../../contexts/CaseContext';
import { projects as fallbackProjects } from '../../data/mockData';
import { detectAnomalies } from '../../data/aiEngine';
import { RiskBadge } from '../../components/RiskBadge';
import AnimatedCounter from '../../components/AnimatedCounter';
import { ScatterChart, BarChart } from '../../components/Charts';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  IndianRupee,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function FinancialVerification() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { projects: cloudProjects } = useCaseContext();
  const activeProjects = useMemo(() => {
    return (cloudProjects && cloudProjects.length > 0) ? cloudProjects : fallbackProjects;
  }, [cloudProjects]);

  const navigate = useNavigate();

  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const analyzed = useMemo(
    () => detectAnomalies(activeProjects),
    [activeProjects]
  );

  /* -----------------------------
     JURISDICTION
  ----------------------------- */

  const scoped = useMemo(() => {
    return analyzed.filter((p) => {
      if (user?.role === 'ministry') return true;

      if (user?.role === 'state_nodal') {
        return p.state === (user.state || 'Uttar Pradesh');
      }

      if (user?.role === 'mp') {
        return (
          p.constituency ===
          (user.constituency || 'Varanasi')
        );
      }

      return (
        p.district ===
        (user?.district || 'Varanasi')
      );
    });
  }, [analyzed, user]);

  /* -----------------------------
     FINANCIAL SIGNALS
  ----------------------------- */

  const flagged = scoped.filter(
    (p) => p.isDetectedAnomaly
  );

  const verified = scoped.filter(
    (p) =>
      p.status === 'completed' &&
      !p.isDetectedAnomaly
  );

  const pending = scoped.filter(
    (p) =>
      p.status === 'in_progress' &&
      !p.isDetectedAnomaly
  );

  const totalSanctioned = scoped.reduce(
    (sum, p) => sum + p.sanctionedAmount,
    0
  );

  const totalSpent = scoped.reduce(
    (sum, p) => sum + p.spentAmount,
    0
  );

  const flaggedAmount = flagged.reduce(
    (sum, p) => sum + p.spentAmount,
    0
  );

  const financialMismatch = scoped.filter(
    (p) =>
      p.financialProgress > 100 ||
      p.financialProgress - p.physicalProgress >= 25
  );

  const visibleProjects =
    filter === 'flagged'
      ? flagged
      : filter === 'mismatch'
        ? financialMismatch
        : scoped;

  const selectedProject =
    scoped.find((p) => p.id === selectedId) ||
    null;

  const jurisdictionLabel =
    user?.role === 'ministry'
      ? 'India'
      : user?.role === 'state_nodal'
        ? user.state || 'Uttar Pradesh'
        : user?.role === 'mp'
          ? user.constituency || 'Varanasi'
          : user?.district || 'Varanasi';

  return (
    <div className="page-content financial-intelligence">

      {/* HEADER */}
      <div className="page-header financial-header">

        <div>
          <div className="eyebrow">
            {t('nav_financial').toUpperCase()} · {jurisdictionLabel}
          </div>

          <h1>{t('fin_title')}</h1>

          <p>
            {t('fin_subtitle')}
          </p>
        </div>

        <div className="scope-lock">
          <ShieldAlert size={15} />
          <span>{t('dash_scoped')}</span>
        </div>

      </div>

      {/* =====================================================
          KPI STRIP
      ====================================================== */}

      <div className="financial-kpis">

        <div className="financial-kpi">

          <div className="financial-kpi-icon">
            <IndianRupee size={19} />
          </div>

          <div>
            <span>{t('risk_sanctioned')}</span>

            <strong>
              ₹
              <AnimatedCounter
                end={Math.round(totalSanctioned / 100000)}
                suffix="L"
              />
            </strong>
          </div>

        </div>

        <div className="financial-kpi">

          <div className="financial-kpi-icon">
            <TrendingUp size={19} />
          </div>

          <div>
            <span>{t('risk_reported_spend')}</span>

            <strong>
              ₹
              <AnimatedCounter
                end={Math.round(totalSpent / 100000)}
                suffix="L"
              />
            </strong>
          </div>

        </div>

        <div className="financial-kpi warning">

          <div className="financial-kpi-icon">
            <AlertTriangle size={19} />
          </div>

          <div>
            <span>{t('dash_priority_cases')}</span>

            <strong>{flagged.length}</strong>
          </div>

        </div>

        <div className="financial-kpi">

          <div className="financial-kpi-icon">
            <Clock3 size={19} />
          </div>

          <div>
            <span>{t('fin_deviation')}</span>

            <strong>
              {financialMismatch.length}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          INTELLIGENCE SUMMARY
      ====================================================== */}

      <div className="financial-intelligence-banner">

        <div className="financial-banner-icon">
          <ShieldAlert size={20} />
        </div>

        <div>

          <span className="eyebrow">
            {t('signal_financial_name')}
          </span>

          <h3>
            {flagged.length} {t('fin_flagged_title')}
          </h3>

          <p>
            {t('signal_financial_finding')} {t('disclaimer_risk_not_fraud')}
          </p>

        </div>

        <button
          onClick={() => setFilter('flagged')}
          className="financial-review-button"
        >
          {t('btn_review_evidence')}
          <ArrowRight size={15} />
        </button>

      </div>

      {/* =====================================================
          CHARTS
      ====================================================== */}

      <div className="grid-2 financial-charts">

        <ScatterChart
          title={t('fin_expenditure_chart')}
          xLabel="Sanctioned amount (₹ lakh)"
          yLabel="Reported spend (₹ lakh)"
          datasets={[
            {
              label: 'Normal',
              data: scoped
                .filter((p) => !p.isDetectedAnomaly)
                .map((p) => ({
                  x: p.sanctionedAmount / 100000,
                  y: p.spentAmount / 100000,
                })),
            },
            {
              label: 'AI risk signal',
              data: flagged.map((p) => ({
                x: p.sanctionedAmount / 100000,
                y: p.spentAmount / 100000,
              })),
            },
          ]}
        />

        <BarChart
          title={t('fin_progress_chart')}
          labels={financialMismatch
            .slice(0, 8)
            .map((p) => p.id)}
          datasets={[
            {
              label: 'Financial progress %',
              data: financialMismatch
                .slice(0, 8)
                .map((p) => p.financialProgress),
            },
            {
              label: 'Physical progress %',
              data: financialMismatch
                .slice(0, 8)
                .map((p) => p.physicalProgress),
            },
          ]}
        />

      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <div className="financial-section-head">

        <div>
          <span className="eyebrow">
            {t('inv_my_queue')}
          </span>

          <h3>{t('nav_financial')}</h3>
        </div>

        <div className="financial-filters">

          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            {t('inv_filter_all')}
          </button>

          <button
            className={
              filter === 'flagged' ? 'active' : ''
            }
            onClick={() => setFilter('flagged')}
          >
            {t('fin_flagged')}
            <span>{flagged.length}</span>
          </button>

          <button
            className={
              filter === 'mismatch' ? 'active' : ''
            }
            onClick={() => setFilter('mismatch')}
          >
            {t('fin_deviation')}
            <span>{financialMismatch.length}</span>
          </button>

        </div>

      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="chart-card financial-table-card">

        <div className="table-container">

          <table className="table">

            <thead>
              <tr>
                <th>{t('fin_project')}</th>
                <th>{t('risk_sanctioned')}</th>
                <th>{t('risk_reported_spend')}</th>
                <th>{t('tab_financial')}</th>
                <th>{t('fin_physical_progress')}</th>
                <th>{t('dash_signal_eyebrow')}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {visibleProjects.slice(0, 12).map((p) => {

                const mismatch =
                  p.financialProgress -
                    p.physicalProgress >=
                  25;

                return (
                  <tr
                    key={p.id}
                    className={
                      selectedId === p.id
                        ? 'financial-row-selected'
                        : ''
                    }
                  >

                    <td>

                      <div className="financial-project">

                        <b>{p.id}</b>

                        <span>{p.name}</span>

                        <small>
                          {p.district}, {p.state}
                        </small>

                      </div>

                    </td>

                    <td>
                      ₹
                      {(
                        p.sanctionedAmount / 100000
                      ).toFixed(1)}
                      L
                    </td>

                    <td>
                      <strong>
                        ₹
                        {(
                          p.spentAmount / 100000
                        ).toFixed(1)}
                        L
                      </strong>
                    </td>

                    <td>
                      {p.financialProgress}%
                    </td>

                    <td>
                      <div className="mini-progress">

                        <div>
                          <span
                            style={{
                              width: `${Math.min(
                                p.physicalProgress,
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        {p.physicalProgress}%

                      </div>
                    </td>

                    <td>

                      {p.isDetectedAnomaly ? (
                        <RiskBadge
                          level={p.severity}
                          size="small"
                        />
                      ) : mismatch ? (
                        <span className="financial-signal mismatch">
                          {t('fin_deviation')}
                        </span>
                      ) : (
                        <span className="financial-signal normal">
                          {t('badge_low_risk')}
                        </span>
                      )}

                    </td>

                    <td>

                      <button
                        className="financial-open"
                        onClick={() =>
                          setSelectedId(p.id)
                        }
                      >
                        {t('btn_review_evidence')}
                        <ArrowRight size={13} />
                      </button>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          SELECTED CASE DETAIL
      ====================================================== */}

      {selectedProject && (

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="financial-case-detail"
        >

          <div className="financial-case-title">

            <div>

              <span className="eyebrow">
                {t('fin_batch_eyebrow')}
              </span>

              <h3>
                {selectedProject.name}
              </h3>

              <p>
                {selectedProject.id} ·{' '}
                {selectedProject.district},{' '}
                {selectedProject.state}
              </p>

            </div>

            <button
              onClick={() => setSelectedId(null)}
              className="financial-close"
            >
              {t('btn_close')}
            </button>

          </div>

          <div className="financial-case-grid">

            <div>
              <span>{t('risk_sanctioned')}</span>
              <strong>
                ₹
                {(
                  selectedProject.sanctionedAmount /
                  100000
                ).toFixed(1)}
                L
              </strong>
            </div>

            <div>
              <span>{t('risk_reported_spend')}</span>
              <strong>
                ₹
                {(
                  selectedProject.spentAmount /
                  100000
                ).toFixed(1)}
                L
              </strong>
            </div>

            <div>
              <span>{t('tab_financial')}</span>
              <strong>
                {selectedProject.financialProgress}%
              </strong>
            </div>

            <div>
              <span>{t('risk_physical_progress')}</span>
              <strong>
                {selectedProject.physicalProgress}%
              </strong>
            </div>

          </div>

          <div className="financial-reason">

            <AlertTriangle size={17} />

            <div>

              <b>{t('risk_signal_breakdown_title')}</b>

              <p>
                {t('signal_financial_finding')} {t('disclaimer_full')}
              </p>

            </div>

          </div>

          <div className="financial-case-footer">

            <span>
              <CheckCircle2 size={14} />
              {t('risk_requires_verif')}
            </span>

            <button
              onClick={() => {
                navigate(`/official/risk/${selectedProject.id}`);
              }}
            >
              {t('nav_risk')}
              <ArrowRight size={14} />
            </button>

          </div>

        </motion.div>

      )}

    </div>
  );
}