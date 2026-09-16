import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCaseContext } from '../../contexts/CaseContext';
import { projects as mockProjects, states, sectors } from '../../data/mockData';
import { StatusBadge } from '../../components/RiskBadge';
import { Search, Download, X } from 'lucide-react';

export default function ProjectExplorer() {
  const { t, lang } = useLanguage();
  const { projects: cloudProjects } = useCaseContext();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  const activeProjects = useMemo(() => {
    return cloudProjects && cloudProjects.length > 0 ? cloudProjects : mockProjects;
  }, [cloudProjects]);

  const filtered = activeProjects.filter(p => {
    const s = search.trim().toLowerCase();
    const match = !s || (p.name || p.work_name || '').toLowerCase().includes(s) || (p.id || p.work_id || '').toLowerCase().includes(s);
    const st = !stateFilter || (p.state || '').toLowerCase() === stateFilter.toLowerCase();
    const sec = !sectorFilter || (p.sector || p.category || '').toLowerCase() === sectorFilter.toLowerCase();
    const stat = !statusFilter || (p.status || p.audit_status || '').toLowerCase() === statusFilter.toLowerCase();
    return match && st && sec && stat;
  });

  const exportCSV = () => {
    const headers = 'ID,Name,Sector,State,District,Constituency,Sanctioned (Lakhs),Spent (Lakhs),Status,Physical Progress\n';
    const rows = filtered.map(p => {
      const pId = p.id || p.work_id;
      const pName = p.name || p.work_name;
      const pSec = p.sector || p.category;
      const pSanc = p.sanctioned_amount_lakhs != null ? p.sanctioned_amount_lakhs : ((p.sanctionedAmount || 0) / 100000).toFixed(1);
      const pSpent = p.expenditure_lakhs != null ? p.expenditure_lakhs : ((p.spentAmount || 0) / 100000).toFixed(1);
      const pProg = p.physicalProgress ?? p.reported_progress_pct ?? 0;
      const pStat = p.audit_status || p.status || 'Monitored';
      return `${pId},"${pName}",${pSec},${p.state},${p.district},${p.constituency},${pSanc},${pSpent},${pStat},${pProg}%`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mplads_projects.csv'; a.click();
  };

  return (
    <div className="page-content">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="page-header">
          <h1>{t('nav_projects')}</h1>
          <p>{lang === 'hi' ? 'MPLADS परियोजनाओं को फ़िल्टर और खोजें' : 'Filter and explore MPLADS projects across India'}</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input className="input" style={{ paddingLeft: 44 }} placeholder={t('citizen_search')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{ width: 160 }} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option value="">{t('common_all')} {t('common_state')}</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select" style={{ width: 180 }} value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
            <option value="">{t('common_all')} {t('common_sector')}</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{t('common_all')}</option>
            <option value="completed">{t('common_completed')}</option>
            <option value="in_progress">{t('common_in_progress')}</option>
            <option value="delayed">{t('common_delayed')}</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14} /> CSV</button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          {lang === 'hi' ? `${filtered.length} परियोजनाएं मिलीं` : `${filtered.length} projects found`}
        </p>

        {/* Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('fin_project')}</th>
                <th>{t('common_sector')}</th>
                <th>{t('common_constituency')}</th>
                <th>{t('fin_sanctioned')}</th>
                <th>{t('fin_spent')}</th>
                <th>{t('fin_physical_progress')}</th>
                <th>{t('fin_status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const pId = p.id || p.work_id;
                const pName = p.name || p.work_name;
                const pSec = p.sector || p.category;
                const sancLakhs = p.sanctioned_amount_lakhs != null ? Number(p.sanctioned_amount_lakhs) : (p.sanctionedAmount || 0) / 100000;
                const spentLakhs = p.expenditure_lakhs != null ? Number(p.expenditure_lakhs) : (p.spentAmount || 0) / 100000;
                const progPct = p.physicalProgress ?? p.reported_progress_pct ?? 0;
                const status = p.audit_status || p.status || 'in_progress';

                return (
                  <tr key={pId}>
                    <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--primary)' }}>{pId}</td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{pName}</td>
                    <td><span className="badge badge-info" style={{ fontSize: '12px', fontWeight: 500 }}>{pSec}</span></td>
                    <td>{p.constituency || p.district}</td>
                    <td>₹{sancLakhs.toFixed(1)}L</td>
                    <td style={{ color: spentLakhs > sancLakhs * 1.2 ? 'var(--coral)' : 'inherit', fontWeight: spentLakhs > sancLakhs * 1.2 ? 700 : 400 }}>₹{spentLakhs.toFixed(1)}L</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className={`progress-fill ${progPct === 100 ? 'green' : progPct > 60 ? 'blue' : status === 'delayed' ? 'red' : 'yellow'}`} style={{ width: `${progPct}%` }}></div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{progPct}%</span>
                      </div>
                    </td>
                    <td><StatusBadge status={status} /></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => setSelectedProject(p)}>{t('common_view_details')}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail Modal */}
      {selectedProject && (() => {
        const pId = selectedProject.id || selectedProject.work_id;
        const pName = selectedProject.name || selectedProject.work_name;
        const pSec = selectedProject.sector || selectedProject.category;
        const sancLakhs = selectedProject.sanctioned_amount_lakhs != null ? Number(selectedProject.sanctioned_amount_lakhs) : (selectedProject.sanctionedAmount || 0) / 100000;
        const spentLakhs = selectedProject.expenditure_lakhs != null ? Number(selectedProject.expenditure_lakhs) : (selectedProject.spentAmount || 0) / 100000;
        const progPct = selectedProject.physicalProgress ?? selectedProject.reported_progress_pct ?? 0;
        const status = selectedProject.audit_status || selectedProject.status || 'in_progress';

        return (
          <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
            <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="modal-header">
                <h2>{pName}</h2>
                <button className="btn-icon" onClick={() => setSelectedProject(null)}><X size={18} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { l: 'ID', v: pId },
                  { l: t('common_sector'), v: pSec },
                  { l: t('common_state'), v: selectedProject.state },
                  { l: t('common_constituency'), v: selectedProject.constituency || selectedProject.district },
                  { l: t('fin_sanctioned'), v: `₹${sancLakhs.toFixed(1)}L` },
                  { l: t('fin_spent'), v: `₹${spentLakhs.toFixed(1)}L` },
                  { l: lang === 'hi' ? 'शुरू' : 'Start Date', v: selectedProject.startDate || '2024-01-15' },
                  { l: lang === 'hi' ? 'अपेक्षित' : 'Expected', v: selectedProject.expectedCompletion || '2025-03-31' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>{item.l}</div>
                    <div style={{ fontWeight: 600 }}>{item.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{lang === 'hi' ? 'विवरण' : 'Description'}</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedProject.description || 'Public development works monitored under the Members of Parliament Local Area Development Scheme (MPLADS).'}</p>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('fin_physical_progress')}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{progPct}%</span>
                </div>
                <div className="progress-bar" style={{ height: 12 }}>
                  <div className={`progress-fill ${progPct === 100 ? 'green' : 'blue'}`} style={{ width: `${progPct}%` }}></div>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <StatusBadge status={status} />
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
