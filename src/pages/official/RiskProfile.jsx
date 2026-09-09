import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  GitBranch,
  MapPin,
  Network,
  SearchCheck,
  ShieldAlert,
  UserRound,
  Building2,
  Landmark,
  FileText,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { projects, agencies } from '../../data/mockData';
import { calculateRiskScore } from '../../data/aiEngine';
import SpeakerButton from '../../components/SpeakerButton';
import EvidenceDrawer from '../../components/EvidenceDrawer';

export default function RiskProfile() {
  const { id = 'PRJ002' } = useParams();
  const navigate = useNavigate();

  const p =
    projects.find((x) => x.id === id) ||
    projects.find((x) => x.id === 'PRJ002');

  const risk = calculateRiskScore(p);
  const agency = agencies.find((a) => a.id === p.agency);

  const [node, setNode] = useState('Project');
  const [drawerOpen, setDrawerOpen] = useState(false);

  /*
   * Candidate related work.
   * This is intentionally presented as a relationship to review,
   * not as proof of duplication/fraud.
   */
  const relatedWork = useMemo(() => {
    const sameConstituency = projects.find(
      (x) =>
        x.id !== p.id &&
        x.constituency === p.constituency &&
        x.sector === p.sector
    );

    if (sameConstituency) return sameConstituency;

    return projects.find(
      (x) => x.id !== p.id && x.sector === p.sector
    );
  }, [p]);

  const signals = [
    {
      key: 'Financial anomaly',
      icon: CircleDollarSign,
      score: Math.min(32, risk.score),
      level:
        p.spentAmount > p.sanctionedAmount * 1.1 ? 'HIGH' : 'LOW',
      detail: `Reported expenditure is ₹${(
        p.spentAmount / 100000
      ).toFixed(1)}L against ₹${(p.sanctionedAmount / 100000).toFixed(
        1
      )}L sanctioned.`,
    },
    {
      key: 'Spatial overlap',
      icon: MapPin,
      score: 28,
      level: relatedWork ? 'HIGH' : 'LOW',
      detail: relatedWork
        ? `A potentially related ${relatedWork.sector.toLowerCase()} work exists in the same constituency and is surfaced for review.`
        : 'No comparable work was found in the current dataset.',
    },
    {
      key: 'Delay risk',
      icon: Clock3,
      score: p.status === 'delayed' ? 16 : 5,
      level: p.status === 'delayed' ? 'MEDIUM' : 'LOW',
      detail:
        p.status === 'delayed'
          ? 'Physical progress is behind the expected timeline.'
          : 'No material delay signal in the record.',
    },
    {
      key: 'Agency signal',
      icon: UserRound,
      score: Math.min(15, agency?.riskScore || 0),
      level: (agency?.riskScore || 0) > 50 ? 'MEDIUM' : 'LOW',
      detail:
        'Historical agency performance is used as contextual evidence, not a finding of wrongdoing.',
    },
  ];

  const graphNodes = [
    {
      id: 'MP / Constituency',
      type: 'CONTEXT',
      value: p.constituency,
      icon: Landmark,
      position: 'mp',
      description:
        'Constituency context associated with this MPLADS work.',
      evidence: `${p.constituency}, ${p.state}`,
    },
    {
      id: 'Agency',
      type: 'AGENCY',
      value: agency?.name?.split(' - ')[0] || p.agency,
      icon: Building2,
      position: 'agency',
      description:
        'Implementing agency recorded against the project.',
      evidence: agency
        ? `${agency.totalProjects} projects · ${agency.onTimeRate}% on-time rate`
        : 'Agency record available in the project data.',
    },
    {
      id: 'Project',
      type: 'PROJECT',
      value: p.id,
      icon: FileText,
      position: 'project',
      description:
        'Primary MPLADS project record being investigated.',
      evidence: `${p.name} · ${p.status}`,
    },
    {
      id: 'Payment',
      type: 'FINANCIAL',
      value: `₹${(p.spentAmount / 100000).toFixed(1)}L`,
      icon: CircleDollarSign,
      position: 'payment',
      description:
        'Reported expenditure associated with this project.',
      evidence: `Sanctioned ₹${(
        p.sanctionedAmount / 100000
      ).toFixed(1)}L · Reported ₹${(
        p.spentAmount / 100000
      ).toFixed(1)}L`,
    },
    {
      id: 'Location',
      type: 'GEOSPATIAL',
      value: p.district,
      icon: MapPin,
      position: 'location',
      description:
        'Geographic context associated with the project record.',
      evidence: `${p.district}, ${p.state}`,
    },
    {
      id: 'Related Work',
      type: 'RELATION',
      value: relatedWork?.id || 'No match',
      icon: Network,
      position: 'related',
      description:
        'A candidate related work surfaced by shared project attributes.',
      evidence: relatedWork
        ? `${relatedWork.name} · ${relatedWork.constituency}`
        : 'No comparable record found.',
    },
  ];

  const selectedNode =
    graphNodes.find((n) => n.id === node) || graphNodes[2];

  return (
    <div className="page-content risk-page">

      <button
        className="back-link"
        onClick={() => navigate('/official/dashboard')}
      >
        <ArrowLeft size={16} />
        Back to Command Centre
      </button>

      {/* HEADER */}
      <div className="risk-header">
        <div>
          <div className="eyebrow">
            PROJECT RISK PROFILE · CASE {p.id}
          </div>

          <h2>{p.name}</h2>

          <p>
            <MapPin size={14} /> {p.district}, {p.state} · {p.sector}
          </p>
        </div>

        <div className="risk-header-actions">
          <SpeakerButton
            text={`${p.name}. Risk score ${risk.score} out of 100. Requires human verification.`}
          />

          <button
            className="primary-action"
            onClick={() => navigate('/official/investigation')}
          >
            <SearchCheck size={16} />
            Investigate case
          </button>
        </div>
      </div>

      {/* RISK SUMMARY */}
      <div className="risk-summary">

        <div className="risk-score">
          <div className="score-circle">
            <strong>{risk.score}</strong>
            <span>/100</span>
          </div>

          <div>
            <span className="critical-label">HIGH PRIORITY</span>

            <h3>Requires verification</h3>

            <p>
              Multiple signals point to a review opportunity.
              This is not a fraud finding.
            </p>
          </div>
        </div>

        <div className="risk-facts">

          <div>
            <span>Sanctioned</span>
            <b>
              ₹{(p.sanctionedAmount / 100000).toFixed(1)}L
            </b>
          </div>

          <div>
            <span>Reported spend</span>
            <b>
              ₹{(p.spentAmount / 100000).toFixed(1)}L
            </b>
          </div>

          <div>
            <span>Physical progress</span>
            <b>{p.physicalProgress}%</b>
          </div>

          <div>
            <span>Case owner</span>
            <b>District Authority</b>
          </div>

        </div>
      </div>

      <div className="risk-layout">

        <main>

          {/* SIGNAL BREAKDOWN */}
          <section className="panel">

            <div className="panel-head">
              <div>
                <span className="eyebrow">SIGNAL BREAKDOWN</span>
                <h3>Why PRAHARI flagged this case</h3>
              </div>

              <ShieldAlert size={18} />
            </div>

            <div className="signal-grid">

              {signals.map((s) => {
                const I = s.icon;

                return (
                  <button
                    className="signal-card"
                    key={s.key}
                    onClick={() => { setNode(s.key); setDrawerOpen(true); }}
                  >

                    <div className="signal-top">
                      <I size={18} />

                      <span
                        className={`signal-level ${s.level.toLowerCase()}`}
                      >
                        {s.level}
                      </span>
                    </div>

                    <b>{s.key}</b>

                    <div className="signal-meter">
                      <i
                        style={{
                          width: `${Math.min(
                            100,
                            s.score * 2.5
                          )}%`,
                        }}
                      />
                    </div>

                    <p>{s.detail}</p>

                    <span className="evidence-link">
                      View evidence
                      <ChevronRight size={14} />
                    </span>

                  </button>
                );
              })}

            </div>
          </section>

          {/* RISK STORY */}
          <section className="panel risk-story">

            <div className="panel-head">

              <div>
                <span className="eyebrow">EXPLAINABILITY</span>
                <h3>PRAHARI Risk Story</h3>
              </div>

              <span className="story-badge">
                Plain-language explanation
              </span>

            </div>

            <div className="story-chain">

              <div className="story-step">
                <span>01</span>
                <b>Financial signal</b>
                <p>
                  Reported expenditure is materially above the sanctioned amount.
                </p>
              </div>

              <div className="story-connector">+</div>

              <div className="story-step">
                <span>02</span>
                <b>Relationship signal</b>
                <p>
                  A potentially related work is surfaced
                  using shared project attributes.
                </p>
              </div>

              <div className="story-connector">+</div>

              <div className="story-step">
                <span>03</span>
                <b>Combined priority</b>
                <p>
                  Independent signals converge, so the case
                  moves higher in the review queue.
                </p>
              </div>

            </div>

            <div className="human-note">
              <CheckCircle2 size={17} />

              <span>
                <b>Human-in-the-loop:</b> the investigator confirms,
                rejects or qualifies these signals after reviewing evidence.
              </span>
            </div>

          </section>

          {/* =====================================================
              EVIDENCE GRAPH
          ====================================================== */}
          <section className="panel evidence-graph-panel">

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  EVIDENCE GRAPH
                </span>

                <h3>
                  Connected evidence around {p.id}
                </h3>

                <p className="panel-subtitle">
                  Explore relationships between the project,
                  financial record, agency, location and related works.
                </p>
              </div>

              <Network size={19} />

            </div>

            <div className="graph-legend">
              <span>
                <i className="graph-dot project" />
                Project
              </span>

              <span>
                <i className="graph-dot context" />
                Context
              </span>

              <span>
                <i className="graph-dot evidence" />
                Evidence
              </span>

              <span>
                <i className="graph-dot relation" />
                Candidate relation
              </span>
            </div>

            <div className="evidence-graph-canvas">

              <svg
                className="graph-lines"
                viewBox="0 0 900 430"
                preserveAspectRatio="none"
              >

                {/* MP → PROJECT */}
                <line
                  x1="450"
                  y1="82"
                  x2="450"
                  y2="176"
                  className="graph-line"
                />

                {/* AGENCY → PROJECT */}
                <line
                  x1="180"
                  y1="215"
                  x2="370"
                  y2="215"
                  className="graph-line"
                />

                {/* PROJECT → PAYMENT */}
                <line
                  x1="530"
                  y1="215"
                  x2="720"
                  y2="215"
                  className="graph-line"
                />

                {/* PROJECT → LOCATION */}
                <line
                  x1="450"
                  y1="255"
                  x2="450"
                  y2="345"
                  className="graph-line"
                />

                {/* LOCATION → RELATED */}
                <line
                  x1="450"
                  y1="345"
                  x2="690"
                  y2="345"
                  className="graph-line relation-line"
                />

              </svg>

              {graphNodes.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    className={`graph-node-card ${item.position} ${
                      node === item.id ? 'selected' : ''
                    } ${
                      item.type === 'RELATION'
                        ? 'candidate'
                        : ''
                    }`}
                    onClick={() => { setNode(item.id); setDrawerOpen(true); }}
                  >

                    <div className="graph-node-icon">
                      <Icon size={17} />
                    </div>

                    <div className="graph-node-copy">

                      <span>{item.type}</span>

                      <strong>{item.value}</strong>

                    </div>

                  </button>
                );
              })}

            </div>

            {/* SELECTED NODE */}
            <div className="selected-evidence-card">

              <div className="selected-evidence-icon">
                <GitBranch size={17} />
              </div>

              <div className="selected-evidence-content">

                <div className="selected-evidence-heading">
                  <span>SELECTED EVIDENCE</span>

                  <b>{selectedNode.id}</b>
                </div>

                <p>
                  {selectedNode.description}
                </p>

                <div className="selected-evidence-source">

                  <span>Record context</span>

                  <strong>
                    {selectedNode.evidence}
                  </strong>

                </div>

              </div>

            </div>

            <div className="graph-governance-note">

              <ShieldAlert size={15} />

              <span>
                Connected records are investigation leads.
                Relationships shown here do not independently establish
                fraud or wrongdoing.
              </span>

            </div>

          </section>

        </main>

        {/* RIGHT SIDE */}
        <aside className="side-stack">

          <section className="panel">

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  EVIDENCE COMPLETENESS
                </span>

                <h3>72%</h3>
              </div>

            </div>

            <div className="completion-ring">
              <div>
                <b>72</b>
                <span>%</span>
              </div>
            </div>

            <ul className="check-list">
              <li className="done">Project record</li>
              <li className="done">Financial record</li>
              <li className="done">Location data</li>
              <li>Field verification</li>
              <li>Supporting document</li>
            </ul>

          </section>

          <section className="panel">

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  RECOMMENDED ACTION
                </span>

                <h3>Verify on ground</h3>
              </div>

            </div>

            <div className="recommendation">

              <SearchCheck size={19} />

              <p>
                Prioritize a physical verification because
                financial and relationship signals converge.
              </p>

              <button
                onClick={() =>
                  navigate('/official/investigation')
                }
                className="primary-action full"
              >
                Assign verification
                <ArrowRight size={15} />
              </button>

            </div>

          </section>

          <section className="panel">

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  CASE HISTORY
                </span>

                <h3>Accountability trail</h3>
              </div>

            </div>

            <div className="timeline">
              <span>
                Detected <b>09 Sep</b>
              </span>

              <span>
                Reviewed <b>Pending</b>
              </span>

              <span>
                Assigned <b>Pending</b>
              </span>

              <span>
                Field verification <b>Pending</b>
              </span>
            </div>

          </section>

        </aside>

      </div>
    
      <EvidenceDrawer
        node={selectedNode}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAttach={(n) => console.log('Attaching node to docket:', n.id)}
        agency={agency}
        project={p}
        relatedWork={relatedWork}
      />
    </div>
  );
}