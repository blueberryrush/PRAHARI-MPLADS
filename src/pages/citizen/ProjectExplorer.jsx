import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { projects, states, sectors } from '../../data/mockData';
import { StatusBadge } from '../../components/RiskBadge';
import { Search, Download, X } from 'lucide-react';

export default function ProjectExplorer() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  const filtered = projects.filter(p => {
    const match = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const st = !stateFilter || p.state === stateFilter;
    const sec = !sectorFilter || p.sector === sectorFilter;
    const stat = !statusFilter || p.status === statusFilter;
    return match && st && sec && stat;
  });

  const exportCSV = () => {
    const headers = 'ID,Name,Sector,State,District,Constituency,Sanctioned,Spent,Status,Physical Progress\n';
    const rows = filtered.map(p => `${p.id},${p.name},${p.sector},${p.state},${p.district},${p.constituency},${p.sanctionedAmount},${p.spentAmount},${p.status},${p.physicalProgress}%`).join('\n');
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
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--primary)' }}>{p.id}</td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{p.name}</td>
                  <td><span className="badge badge-info" style={{ fontSize: '12px', fontWeight: 500 }}>{p.sector}</span></td>
                  <td>{p.constituency}</td>
                  <td>₹{(p.sanctionedAmount / 100000).toFixed(1)}L</td>
                  <td style={{ color: p.spentAmount > p.sanctionedAmount * 1.2 ? 'var(--coral)' : 'inherit', fontWeight: p.spentAmount > p.sanctionedAmount * 1.2 ? 700 : 400 }}>₹{(p.spentAmount / 100000).toFixed(1)}L</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div className={`progress-fill ${p.physicalProgress === 100 ? 'green' : p.physicalProgress > 60 ? 'blue' : p.status === 'delayed' ? 'red' : 'yellow'}`} style={{ width: `${p.physicalProgress}%` }}></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{p.physicalProgress}%</span>
                    </div>
                  </td>
                  <td><StatusBadge status={p.status} /></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setSelectedProject(p)}>{t('common_view_details')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail Modal */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="modal-header">
              <h2>{selectedProject.name}</h2>
              <button className="btn-icon" onClick={() => setSelectedProject(null)}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { l: 'ID', v: selectedProject.id },
                { l: t('common_sector'), v: selectedProject.sector },
                { l: t('common_state'), v: selectedProject.state },
                { l: t('common_constituency'), v: selectedProject.constituency },
                { l: t('fin_sanctioned'), v: `₹${(selectedProject.sanctionedAmount / 100000).toFixed(1)}L` },
                { l: t('fin_spent'), v: `₹${(selectedProject.spentAmount / 100000).toFixed(1)}L` },
                { l: lang === 'hi' ? 'शुरू' : 'Start Date', v: selectedProject.startDate },
                { l: lang === 'hi' ? 'अपेक्षित' : 'Expected', v: selectedProject.expectedCompletion },
              ].map((item, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>{item.l}</div>
                  <div style={{ fontWeight: 600 }}>{item.v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{lang === 'hi' ? 'विवरण' : 'Description'}</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedProject.description}</p>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('fin_physical_progress')}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{selectedProject.physicalProgress}%</span>
              </div>
              <div className="progress-bar" style={{ height: 12 }}>
                <div className={`progress-fill ${selectedProject.physicalProgress === 100 ? 'green' : 'blue'}`} style={{ width: `${selectedProject.physicalProgress}%` }}></div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <StatusBadge status={selectedProject.status} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
