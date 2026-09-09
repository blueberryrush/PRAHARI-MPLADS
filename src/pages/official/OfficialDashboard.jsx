import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock3, Eye, Filter, MapPin, SearchCheck, ShieldAlert, Sparkles, TrendingUp, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projects } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { calculateRiskScore } from '../../data/aiEngine';
import SpeakerButton from '../../components/SpeakerButton';
import SpatialCommandView from '../../components/SpatialCommandView';

const riskLabel = s => s >= 70 ? 'HIGH PRIORITY' : s >= 50 ? 'REVIEW' : 'MONITOR';

export default function OfficialDashboard() {
  const navigate = useNavigate();
  const { user, getRoleLabel } = useAuth();
  const [filter, setFilter] = useState('all');
  const scope = user?.role === 'ministry' ? 'India' : user?.role === 'state_nodal' ? (user?.state || 'Uttar Pradesh') : user?.role === 'mp' ? `${user?.constituency || 'Varanasi'} Constituency` : (user?.district || 'Varanasi District');
  const authorityLabel = getRoleLabel(user?.role || 'district_authority');
  const [query, setQuery] = useState('');
  const [focusedId, setFocusedId] = useState(null);
  const scopedProjects = useMemo(() => projects.filter(p => {
    if (user?.role === 'ministry') return true;
    if (user?.role === 'state_nodal') return p.state === (user?.state || 'Uttar Pradesh');
    if (user?.role === 'mp') return p.constituency === (user?.constituency || 'Varanasi');
    return p.district === (user?.district || 'Varanasi');
  }), [user]);
  const scored = useMemo(() => scopedProjects.map(p => ({...p, risk: calculateRiskScore(p)})).sort((a,b)=>b.risk.score-a.risk.score), [scopedProjects]);
  const visible = scored.filter(p => {
    const f = filter === 'all' || (filter === 'financial' && p.spentAmount > p.sanctionedAmount*1.1) || (filter === 'delay' && p.status === 'delayed') || (filter === 'duplicate' && p.id === 'PRJ002');
    return f && (!query || `${p.id} ${p.name} ${p.district} ${p.constituency}`.toLowerCase().includes(query.toLowerCase()));
  }).slice(0,7);
  const priority = scored.filter(p=>p.risk.score>=50).length;
  const exposure = scored.filter(p=>p.risk.score>=50).reduce((s,p)=>s+p.sanctionedAmount,0);

  return <div className="page-content command-page">
    <div className="workspace-head">
      <div><div className="eyebrow">{authorityLabel.toUpperCase()} · {scope}</div><h2>What needs attention?</h2><p>PRAHARI narrows the monitoring universe into explainable, review-ready cases.</p></div>
      <div className="workspace-tools"><div className="scope-lock"><MapPin size={15}/><span>{scope}</span><small>Scoped to your authority</small></div><SpeakerButton text="What needs attention? PRAHARI narrows the monitoring universe into explainable, review-ready cases." /></div>
    </div>

    
    <div className="kpi-grid">
      {[
        ['1,248','Works monitored','Across connected MPLADS records', 'neutral'],
        [String(priority || 87),'Priority cases','Require review or verification', 'critical'],
        ['18','Under verification','Active investigation workflow', 'amber'],
        ['64','Resolved','Closed with recorded outcome', 'sage'],
        [`₹${(exposure/10000000).toFixed(1)} Cr`,'Financial exposure','Across priority cases', 'teal'],
      ].map(([v,l,s,c])=><div className="kpi-panel" key={l}><div className={`kpi-accent ${c}`}/><span className="kpi-label">{l}</span><strong>{v}</strong><small>{s}</small></div>)}
    </div>

    <div className="command-grid">
      <section className="panel priority-panel">
        <div className="panel-head"><div><span className="eyebrow">CASE REGISTER</span><h3>Priority cases</h3></div><button className="ghost-action" onClick={()=>navigate('/official/investigation')}>Open investigation queue <ArrowRight size={15}/></button></div>
        <div className="filter-row">
          {['all','financial','duplicate','delay'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f==='all'?'All':f==='duplicate'?'Duplicate / Overlap':f[0].toUpperCase()+f.slice(1)}</button>)}
          <label className="mini-search"><SearchCheck size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search cases"/></label>
          <button className="icon-button soft"><Filter size={16}/></button>
        </div>
        <div className="case-list">
          {visible.map((p,i)=><button className="case-row" key={p.id} onClick={()=>navigate(`/official/risk/${p.id}`)}>
            <div className="case-index">{String(i+1).padStart(2,'0')}</div>
            <div className="case-main"><div className="case-id">{p.id} · {p.district}</div><strong>{p.name}</strong><div className="signal-tags">
              {p.spentAmount>p.sanctionedAmount*1.1 && <span className="tag red">Financial anomaly</span>}
              {p.status==='delayed' && <span className="tag amber">Delay risk</span>}
              {p.id==='PRJ002' && <span className="tag teal">Spatial overlap</span>}
            </div></div>
            <div className="case-score"><b>{p.risk.score}</b><span>{riskLabel(p.risk.score)}</span></div>
            <div className="case-next"><small>Next action</small><span>{p.risk.score>=70?'Field verification':'Review evidence'}</span></div>
            <ArrowRight size={16} className="row-arrow"/>
          </button>)}
        </div>
      </section>

      <aside className="side-stack">
        <section className="panel insight-panel">
          <div className="panel-head"><div><span className="eyebrow">PRAHARI INSIGHTS</span><h3>Connected patterns</h3></div><Sparkles size={17}/></div>
          <div className="insight-item"><div className="insight-icon"><TrendingUp size={16}/></div><div><b>3 works share a financial + progress mismatch</b><p>Concentrated in the current review scope.</p><button onClick={()=>navigate('/official/investigation')}>Investigate pattern →</button></div></div>
          <div className="insight-item"><div className="insight-icon"><UsersRound size={16}/></div><div><b>1 agency appears across multiple priority cases</b><p>Review the connected project history before escalation.</p><button onClick={()=>navigate('/official/agency')}>View connections →</button></div></div>
        </section>
        <section className="panel action-panel">
          <div className="panel-head"><div><span className="eyebrow">ACTION QUEUE</span><h3>Needs attention today</h3></div><Clock3 size={17}/></div>
          <div className="action-line"><span className="queue-dot critical"/><div><b>7</b><span>High-priority reviews</span></div><ArrowRight size={14}/></div>
          <div className="action-line"><span className="queue-dot amber"/><div><b>6</b><span>Field verifications</span></div><ArrowRight size={14}/></div>
          <div className="action-line"><span className="queue-dot neutral"/><div><b>5</b><span>Awaiting evidence</span></div><ArrowRight size={14}/></div>
        </section>
      </aside>
    </div>

    <div className="bottom-grid">
      <section className="panel map-panel"><div className="panel-head"><div><span className="eyebrow">SPATIAL COMMAND VIEW</span><h3>Risk distribution</h3></div><span className="map-caption"><span className="legend-dot high"/> Priority <span className="legend-dot med"/> Review <span className="legend-dot safe"/> Stable</span></div><SpatialCommandView projects={scored} focusedId={focusedId} onPinClick={(id) => setFocusedId(id)} /></section>
      <section className="panel distribution-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">SIGNAL MIX</span>
          <h3>Why cases are surfacing</h3>
        </div>
        <Eye size={17}/>
      </div>
      <div className="bar-item">
        <div>
          <span><b>Financial anomaly</b> <span className="severity-chip strong">strong</span></span>
          <span className="contribution-badge">32%</span>
        </div>
        <p className="signal-finding">{scored[0] ? `Spending rate exceeds physical milestone baseline by ${Math.round((scored[0].spentAmount/scored[0].sanctionedAmount - 1)*100)}%` : 'Expenditure variance detected in Authorized PFMS Feed'}</p>
        <div className="signal-micro-bar"><i className="red" style={{width: '32%'}}></i></div>
      </div>
      <div className="bar-item">
        <div>
          <span><b>Spatial / Duplicate</b> <span className="severity-chip elevated">elevated</span></span>
          <span className="contribution-badge">24%</span>
        </div>
        <p className="signal-finding">Candidate duplicate work found in same constituency and sector</p>
        <div className="signal-micro-bar"><i className="teal" style={{width: '24%'}}></i></div>
      </div>
      <div className="bar-item">
        <div>
          <span><b>Delay risk</b> <span className="severity-chip moderate">moderate</span></span>
          <span className="contribution-badge">21%</span>
        </div>
        <p className="signal-finding">Physical execution behind approved DPR timeline</p>
        <div className="signal-micro-bar"><i className="amber" style={{width: '21%'}}></i></div>
      </div>
      <div className="bar-item">
        <div>
          <span><b>Evidence inconsistency</b> <span className="severity-chip low">low</span></span>
          <span className="contribution-badge">13%</span>
        </div>
        <p className="signal-finding">Incomplete eSAKSHI Ingestion Pipeline record for review period</p>
        <div className="signal-micro-bar"><i className="sage" style={{width: '13%'}}></i></div>
      </div>
      <div className="bar-item">
        <div>
          <span><b>Other signals</b> <span className="severity-chip low">low</span></span>
          <span className="contribution-badge">10%</span>
        </div>
        <p className="signal-finding">Additional contextual signals from Authorized PFMS Feed</p>
        <div className="signal-micro-bar"><i className="neutral" style={{width: '10%'}}></i></div>
      </div>
      <p className="signal-mix-caption">Contribution to risk priority, not a fraud probability.</p>
    </section>
    </div>
  </div>
}
