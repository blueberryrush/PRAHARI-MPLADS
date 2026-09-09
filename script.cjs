const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/Anushka Gupta/OneDrive/Documents/Downloads/PRAHARI_MPLADS_SIH2026_real_map/MPLADs-main/src';

// ============================================
// App.jsx
// ============================================
let appPath = path.join(srcDir, 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(
  "import { AuthProvider, useAuth } from './contexts/AuthContext';",
  "import { AuthProvider, useAuth } from './contexts/AuthContext';\nimport { CaseProvider } from './contexts/CaseContext';"
);
appContent = appContent.replace(
  "<BrowserRouter>\n\n      <LanguageProvider>",
  "<BrowserRouter>\n\n      <CaseProvider>\n\n      <LanguageProvider>"
);
appContent = appContent.replace(
  "</LanguageProvider>\n\n    </BrowserRouter>",
  "</LanguageProvider>\n\n      </CaseProvider>\n\n    </BrowserRouter>"
);
fs.writeFileSync(appPath, appContent);

// ============================================
// RiskProfile.jsx
// ============================================
let rpPath = path.join(srcDir, 'pages/official/RiskProfile.jsx');
let rpContent = fs.readFileSync(rpPath, 'utf8');
rpContent = rpContent.replace(
  "import SpeakerButton from '../../components/SpeakerButton';",
  "import SpeakerButton from '../../components/SpeakerButton';\nimport EvidenceDrawer from '../../components/EvidenceDrawer';"
);
rpContent = rpContent.replace(
  "const [node, setNode] = useState('Project');",
  "const [node, setNode] = useState('Project');\n  const [drawerOpen, setDrawerOpen] = useState(false);"
);
rpContent = rpContent.replace(
  /onClick=\{\(\) => setNode\(item\.id\)\}/g,
  "onClick={() => { setNode(item.id); setDrawerOpen(true); }}"
);
rpContent = rpContent.replace(
  /onClick=\{\(\) => setNode\(s\.key\)\}/g,
  "onClick={() => { setNode(s.key); setDrawerOpen(true); }}"
);
rpContent = rpContent.replace(
  /<\/div>\n\s*\);\n\}/,
  `\n      <EvidenceDrawer
        node={selectedNode}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAttach={(n) => console.log('Attaching node to docket:', n.id)}
        agency={agency}
        project={p}
        relatedWork={relatedWork}
      />\n    </div>\n  );\n}`
);

// sanitize display strings
rpContent = rpContent.replace(/demonstration dataset/g, "dataset");
rpContent = rpContent.replace(/demo record/g, "record");

fs.writeFileSync(rpPath, rpContent);

// ============================================
// OfficialDashboard.jsx
// ============================================
let odPath = path.join(srcDir, 'pages/official/OfficialDashboard.jsx');
let odContent = fs.readFileSync(odPath, 'utf8');

if (!odContent.includes('SpatialCommandView')) {
  odContent = odContent.replace(
    "import SpeakerButton from '../../components/SpeakerButton';",
    "import SpeakerButton from '../../components/SpeakerButton';\nimport SpatialCommandView from '../../components/SpatialCommandView';"
  );
}

if (!odContent.includes('focusedId')) {
  odContent = odContent.replace(
    "const [query, setQuery] = useState('');",
    "const [query, setQuery] = useState('');\n  const [focusedId, setFocusedId] = useState(null);"
  );
}

odContent = odContent.replace(
  /<div className="map-placeholder">[\s\S]*?<\/div><\/section>/,
  `<SpatialCommandView projects={scored} focusedId={focusedId} onPinClick={(id) => setFocusedId(id)} /></section>`
);

const signalMixPanel = `<section className="panel distribution-panel">
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
        <p className="signal-finding">{scored[0] ? \`Spending rate exceeds physical milestone baseline by \${Math.round((scored[0].spentAmount/scored[0].sanctionedAmount - 1)*100)}%\` : 'Expenditure variance detected in Authorized PFMS Feed'}</p>
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
    </section>`;
odContent = odContent.replace(
  /<section className="panel distribution-panel">[\s\S]*?<\/section>/,
  signalMixPanel
);

fs.writeFileSync(odPath, odContent);

// ============================================
// InvestigationCentre.jsx
// ============================================
let icPath = path.join(srcDir, 'pages/official/InvestigationCentre.jsx');
let icContent = fs.readFileSync(icPath, 'utf8');

if (!icContent.includes('GroundVerificationCapture')) {
  icContent = icContent.replace(
    "import { projects } from '../../data/mockData';",
    "import { projects } from '../../data/mockData';\nimport GroundVerificationCapture from '../../components/investigation/GroundVerificationCapture';\nimport CalibrationToast from '../../components/CalibrationToast';\nimport { useCaseContext } from '../../contexts/CaseContext';\nimport { Clock3 } from 'lucide-react';"
  );
}

if (!icContent.includes('showGVC')) {
  icContent = icContent.replace(
    "const [evidenceAdded, setEvidenceAdded] = useState(false);",
    "const [evidenceAdded, setEvidenceAdded] = useState(false);\n  const [showGVC, setShowGVC] = useState(false);\n  const { getCase, advanceStatus, recordFeedback, attachEvidence } = useCaseContext();"
  );
}

if (!icContent.includes('caseData')) {
  icContent = icContent.replace(
    "const risk = calculateRiskScore(p);",
    "const risk = calculateRiskScore(p);\n  const caseData = getCase(p?.id || 'PRJ002');"
  );
}

icContent = icContent.replace(
  /setSaved\(true\);/g,
  "setSaved(true);\n    advanceStatus(p.id, outcome === 'Verified / Legitimate' ? 'Resolved' : 'Field Verification', investigatorRole, investigationNote);"
);

icContent = icContent.replace(
  /onClick=\{\(\) => handleFieldStep\(2\)\}/g,
  "onClick={() => { handleFieldStep(2); if (fieldStarted) setShowGVC(true); }}"
);

icContent = icContent.replace(
  /onClick=\{\(\) => setFeedback\('Yes'\)\}/g,
  "onClick={() => { setFeedback('Yes'); recordFeedback(p.id, 'Confirmed Anomaly', p.district || 'Varanasi', 'financial overspend'); }}"
);

icContent = icContent.replace(
  /onClick=\{\(\) => setFeedback\('No'\)\}/g,
  "onClick={() => { setFeedback('No'); recordFeedback(p.id, 'False Alarm', p.district || 'Varanasi', 'seasonal roadwork delays'); }}"
);

icContent = icContent.replace(
  /onClick=\{\(\) =>\s*setFeedback\('Partially'\)\s*\}/g,
  "onClick={() => { setFeedback('Partially'); recordFeedback(p.id, 'Partially Confirmed', p.district || 'Varanasi', 'expenditure timing mismatch'); }}"
);

if (!icContent.includes('<CalibrationToast />')) {
  icContent = icContent.replace(
    '<div className="page-content investigation-page">',
    '<div className="page-content investigation-page">\n      <CalibrationToast />'
  );
}

const auditPanel = `
          <section className="panel audit-trail-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">AUDIT TRAIL</span>
                <h3>Accountability record</h3>
              </div>
            </div>
            <div className="audit-trail">
              {caseData?.auditHistory?.slice().reverse().map((entry, i) => (
                <div key={i} className="audit-trail-row">
                  <span className="audit-dot" />
                  <div>
                    <b>{entry.action}</b>
                    <p>{entry.note}</p>
                    <small>{new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {entry.officerId}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>`;

const gvcModal = `
      {showGVC && (
        <GroundVerificationCapture
          sanctionCoordinates={{ lat: 25.3176, lng: 82.9739 }}
          onCaptureComplete={(payload) => {
            attachEvidence(p.id, payload);
            setShowGVC(false);
            setFieldStep(3);
          }}
          onClose={() => setShowGVC(false)}
        />
      )}`;

if (!icContent.includes('audit-trail-panel')) {
  icContent = icContent.replace(
    /<\/section>\n\n\s*<\/main>/,
    `</section>\n${auditPanel}\n        </main>\n${gvcModal}`
  );
}

fs.writeFileSync(icPath, icContent);
console.log('Update successful');
