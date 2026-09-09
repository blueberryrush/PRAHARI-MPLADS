import { useMemo, useState } from 'react';
import { ArrowRight, LocateFixed, Search, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projects, states } from '../../data/mockData';
import SpeakerButton from '../../components/SpeakerButton';
import IndiaDrilldownMap from '../../components/IndiaDrilldownMap';

export default function CitizenDashboard() {
  const navigate=useNavigate();
  const [search,setSearch]=useState('');
  const [state,setState]=useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [grievanceModal, setGrievanceModal] = useState(false);
  const [grievanceText, setGrievanceText] = useState('');
  const [grievanceSubmitted, setGrievanceSubmitted] = useState(false);

  const filtered=useMemo(()=>projects.filter(p=>(!state||p.state===state)&&(!search||`${p.name} ${p.district} ${p.constituency}`.toLowerCase().includes(search.toLowerCase()))),[search,state]);

  const constituencyProjects = useMemo(() =>
    selectedDistrict
      ? projects.filter(p => p.district?.toLowerCase() === selectedDistrict.toLowerCase())
      : [],
  [selectedDistrict]);

  return <div className="page-content citizen-page">
    <div className="citizen-welcome"><div><span className="eyebrow">PUBLIC PROJECT EXPLORER</span><h2>See what is happening near you.</h2><p>Explore MPLADS works, follow their public project journey, and share an observation when something looks different on the ground.</p></div><SpeakerButton text="See what is happening near you. Explore MPLADS works, follow their public project journey, and share an observation when something looks different on the ground."/></div>
    <div className="citizen-searchbar"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search constituency, district or project"/><select value={state} onChange={e=>setState(e.target.value)}><option value="">All India</option>{states.map(s=><option key={s}>{s}</option>)}</select><button className="near-btn"><LocateFixed size={16}/> Near me</button></div>
    <div className="citizen-map panel"><IndiaDrilldownMap projects={filtered} selectedState={state} onStateChange={setState} onDistrictSelect={setSelectedDistrict} /></div>
    
    {selectedDistrict && constituencyProjects.length > 0 && (
      <div className="constituency-roster">
        <div className="roster-header">
          <span className="eyebrow">CONSTITUENCY WORKS</span>
          <h3>Sanctioned works in {selectedDistrict}</h3>
          <p>{constituencyProjects.length} works found in the Authorized PFMS Feed for this area.</p>
        </div>
        <div className="roster-grid">
          {constituencyProjects.map(p => (
            <button
              key={p.id}
              className="roster-card"
              onClick={() => { setSelectedProject(p); setGrievanceModal(false); }}
            >
              <div className="roster-sector-dot" data-sector={p.sector.split(' ')[0].toLowerCase()} />
              <div className="roster-card-body">
                <span className="roster-id">{p.id} · {p.sector}</span>
                <strong>{p.name}</strong>
                <div className="roster-meta">
                  <span>₹{(p.sanctionedAmount/100000).toFixed(1)}L sanctioned</span>
                  <span className={`roster-status ${p.status}`}>{p.status.replace('_',' ')}</span>
                </div>
                <div className="roster-progress-bar">
                  <i style={{width: `${p.physicalProgress}%`}} />
                </div>
                <span className="roster-progress-text">{p.physicalProgress}% physical progress</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )}

    {selectedProject && (
      <div className="project-preview-card">
        <div className="preview-header">
          <div>
            <span className="eyebrow">PROJECT DETAIL · {selectedProject.id}</span>
            <h3>{selectedProject.name}</h3>
          </div>
          <button className="preview-close" onClick={() => setSelectedProject(null)}>×</button>
        </div>
        <div className="preview-facts">
          <div><span>Sanction Amount</span><b>₹{(selectedProject.sanctionedAmount/100000).toFixed(1)}L</b></div>
          <div><span>MP / Constituency</span><b>{selectedProject.constituency}</b></div>
          <div><span>Physical Progress</span><b>{selectedProject.physicalProgress}%</b></div>
          <div><span>Geotagged Proofs</span><b>{selectedProject.status === 'completed' ? 'Available' : 'Pending'}</b></div>
          <div><span>Status</span><b>{selectedProject.status.replace('_',' ')}</b></div>
          <div><span>Sector</span><b>{selectedProject.sector}</b></div>
        </div>
        <div className="preview-actions">
          <button
            className="primary-action"
            onClick={() => { setGrievanceModal(true); setGrievanceSubmitted(false); setGrievanceText(''); }}
          >
            Raise Grievance / Verify Reality
          </button>
        </div>
      </div>
    )}

    <div className="citizen-overview"><div className="public-stat"><span>WORKS FOUND</span><b>{filtered.length}</b><small>In your current view</small></div><div className="public-stat"><span>COMPLETED</span><b>{filtered.filter(p=>p.status==='completed').length}</b><small>Marked completed</small></div><div className="public-stat"><span>ONGOING</span><b>{filtered.filter(p=>p.status==='in_progress').length}</b><small>Currently in progress</small></div><div className="public-stat"><span>PUBLIC EVIDENCE</span><b>72%</b><small>Records with supporting evidence</small></div></div>
    <div className="citizen-cards"><section className="panel"><div className="panel-head"><div><span className="eyebrow">PROJECT JOURNEY</span><h3>Follow a work from recommendation to verification</h3></div><ShieldCheck size={18}/></div><div className="journey"><span className="done">Recommended</span><i>→</i><span className="done">Sanctioned</span><i>→</i><span className="done">Work started</span><i>→</i><span>Progress</span><i>→</i><span>Completed</span><i>→</i><span>Verified</span></div></section>
    <section className="panel observation-card"><div><span className="eyebrow">PUBLIC PARTICIPATION</span><h3>Something looks different?</h3><p>Share an observation with evidence. It enters a verification workflow; a citizen report is not automatically treated as proof of irregularity.</p></div><button className="primary-action" onClick={()=>navigate('/citizen/projects')}>Report on a project <ArrowRight size={15}/></button></section></div>
    {grievanceModal && selectedProject && (
      <div className="grievance-overlay">
        <div className="grievance-modal">
          <div className="grievance-modal-header">
            <div>
              <span className="eyebrow">PUBLIC GRIEVANCE</span>
              <h3>Raise Observation for {selectedProject.id}</h3>
              <p>Your observation enters a human verification workflow. A citizen report is not automatically treated as proof of irregularity.</p>
            </div>
            <button className="grievance-close" onClick={() => setGrievanceModal(false)}>×</button>
          </div>
          {grievanceSubmitted ? (
            <div className="grievance-success">
              <span>✓</span>
              <b>Observation submitted.</b>
              <p>Your report has entered the verification queue. Reference: GRV-{selectedProject.id}-{Date.now().toString().slice(-6)}</p>
            </div>
          ) : (
            <>
              <label className="field-label">What did you observe on the ground?</label>
              <textarea
                className="note-box"
                value={grievanceText}
                onChange={e => setGrievanceText(e.target.value)}
                placeholder="Describe what you saw at the project site — construction status, presence of work, any discrepancy…"
                rows={4}
              />
              <div className="grievance-disclaimer">
                This observation will be reviewed by the designated authority. Please provide factual, on-ground observations only.
              </div>
              <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:12}}>
                <button className="secondary-action" onClick={() => setGrievanceModal(false)}>Cancel</button>
                <button
                  className="primary-action"
                  disabled={!grievanceText.trim()}
                  onClick={() => setGrievanceSubmitted(true)}
                >
                  Submit Observation
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
}
