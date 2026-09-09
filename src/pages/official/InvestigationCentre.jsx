import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Flag,
  MapPin,
  MessageSquare,
  Paperclip,
  SearchCheck,
  ShieldAlert,
  Upload,
  UserRound,
  LockKeyhole,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projects } from '../../data/mockData';
import GroundVerificationCapture from '../../components/investigation/GroundVerificationCapture';
import CalibrationToast from '../../components/CalibrationToast';
import { useCaseContext } from '../../contexts/CaseContext';
import { Clock3 } from 'lucide-react';
import { calculateRiskScore } from '../../data/aiEngine';

export default function InvestigationCentre() {
  const { user, getRoleLabel } = useAuth();

  const [selected, setSelected] = useState('PRJ002');
  const [outcome, setOutcome] = useState('');
  const [investigationNote, setInvestigationNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [fieldStep, setFieldStep] = useState(1);
  const [fieldStarted, setFieldStarted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [assigned, setAssigned] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [evidenceAdded, setEvidenceAdded] = useState(false);
  const [showGVC, setShowGVC] = useState(false);
  const { getCase, advanceStatus, recordFeedback, attachEvidence } = useCaseContext();

  const scopedProjects = projects.filter((x) => {
    if (user?.role === 'ministry') return true;

    if (user?.role === 'state_nodal') {
      return x.state === (user?.state || 'Uttar Pradesh');
    }

    if (user?.role === 'mp') {
      return x.constituency === (user?.constituency || 'Varanasi');
    }

    return x.district === (user?.district || 'Varanasi');
  });

  const cases = scopedProjects
    .filter((x) => x.isAnomaly || x.status === 'delayed')
    .slice(0, 6);

  const selectedCase =
    cases.find((x) => x.id === selected) ||
    cases[0] ||
    projects[1];

  const p = selectedCase;
  const risk = calculateRiskScore(p);
  const caseData = getCase(p?.id || 'PRJ002');

  const investigatorContext =
    user?.role === 'ministry'
      ? 'Central Review Cell'
      : user?.role === 'state_nodal'
        ? `State Investigation Desk · ${
            user?.state || 'Uttar Pradesh'
          }`
        : user?.role === 'mp'
          ? `Constituency Review Desk · ${
              user?.constituency || 'Varanasi'
            }`
          : `District Investigation Desk · ${
              user?.district || 'Varanasi'
            }`;

  const investigatorRole = getRoleLabel(
    user?.role || 'district_authority'
  );

  const resetCaseState = () => {
    setOutcome('');
    setInvestigationNote('');
    setSaved(false);
    setFieldStep(1);
    setFieldStarted(false);
    setFeedback('');
    setAssigned(false);
    setEscalated(false);
    setEvidenceAdded(false);
  };

  const handleSelectCase = (id) => {
    setSelected(id);
    resetCaseState();
  };

  const handleSaveOutcome = () => {
    if (!outcome) return;

    setSaved(true);
    advanceStatus(p.id, outcome === 'Verified / Legitimate' ? 'Resolved' : 'Field Verification', investigatorRole, investigationNote);

    // Once the investigator has assessed the case,
    // field verification becomes available.
    setFieldStep(1);
  };

  const handleStartFieldVerification = () => {
    if (!saved) return;

    setFieldStarted(true);
    setFieldStep(2);
  };

  const handleFieldStep = (step) => {
    if (!fieldStarted) return;

    setFieldStep(step);
  };

  return (
    <div className="page-content investigation-page">
      <CalibrationToast />

      {/* HEADER */}
      <div className="workspace-head">

        <div>
          <div className="eyebrow">
            INVESTIGATION WORKSPACE ·{' '}
            {investigatorContext.toUpperCase()}
          </div>

          <h2>Investigation Centre</h2>

          <p>
            Act on assigned cases, collect evidence, verify on the
            ground and record the outcome.
          </p>
        </div>

        <div className="queue-summary">
          <span>
            Open <b>12</b>
          </span>

          <span>
            Field <b>6</b>
          </span>

          <span>
            Overdue <b>2</b>
          </span>
        </div>

      </div>

      {/* INVESTIGATOR CONTEXT */}
      <div className="investigator-context">

        <span className="context-dot" />

        <div>
          <span>INVESTIGATOR CONTEXT</span>

          <b>{investigatorRole}</b>

          <small>
            {investigatorContext} · Cases assigned to this review desk
          </small>
        </div>

      </div>

      <div className="invest-layout">

        {/* =====================================================
            CASE QUEUE
        ====================================================== */}
        <aside className="case-queue panel">

          <div className="panel-head">

            <div>
              <span className="eyebrow">MY QUEUE</span>
              <h3>Priority cases</h3>
            </div>

            <ChevronDown size={16} />

          </div>

          <div className="queue-filter">

            <button className="selected">
              All 12
            </button>

            <button>
              High 7
            </button>

            <button>
              Field 6
            </button>

          </div>

          {cases.map((c) => (

            <button
              className={`queue-case ${
                selected === c.id ? 'selected' : ''
              }`}
              key={c.id}
              onClick={() => handleSelectCase(c.id)}
            >

              <span
                className={`queue-score ${
                  calculateRiskScore(c).level
                }`}
              >
                {calculateRiskScore(c).score}
              </span>

              <div>
                <b>{c.id}</b>

                <p>{c.name}</p>

                <small>
                  {c.district} ·{' '}
                  {c.status.replace('_', ' ')}
                </small>
              </div>

              <ArrowRight size={14} />

            </button>

          ))}

        </aside>

        {/* =====================================================
            MAIN INVESTIGATION WORKSPACE
        ====================================================== */}
        <main className="invest-workspace">

          {/* CASE HEADER */}
          <section className="panel case-header">

            <div>

              <div className="eyebrow">
                CASE {p.id} · {saved ? 'ASSESSED' : 'OPEN'}
              </div>

              <h2>{p.name}</h2>

              <p>
                <MapPin size={14} />
                {p.district}, {p.state} · Last action:{' '}
                {saved ? 'Investigator assessment' : 'AI review'} ·
                Next:{' '}
                {saved
                  ? 'field verification'
                  : 'investigator assessment'}
              </p>

            </div>

            <div className="case-owner">

              <span>CASE OWNER</span>

              <b>{investigatorRole}</b>

              <small>{investigatorContext}</small>

            </div>

          </section>

          {/* TABS */}
          <div className="invest-tabs">

            <button className="active">
              Overview
            </button>

            <button>Financial</button>

            <button>Spatial</button>

            <button>Related Works</button>

            <button>History</button>

          </div>

          <div className="invest-grid">

            {/* =================================================
                EVIDENCE
            ================================================== */}
            <section className="panel evidence-panel">

              <div className="panel-head">

                <div>
                  <span className="eyebrow">EVIDENCE</span>

                  <h3>Review the signals</h3>
                </div>

                <ShieldAlert size={18} />

              </div>

              {/* Financial */}
              <div className="evidence-row">

                <div className="evidence-icon red">
                  <Flag size={17} />
                </div>

                <div>
                  <b>Financial anomaly</b>

                  <p>
                    ₹
                    {(p.spentAmount / 100000).toFixed(1)}
                    L reported against ₹
                    {(p.sanctionedAmount / 100000).toFixed(1)}
                    L sanctioned.
                  </p>
                </div>

                <span className="confidence">
                  HIGH
                </span>

              </div>

              {/* Spatial */}
              <div className="evidence-row">

                <div className="evidence-icon teal">
                  <MapPin size={17} />
                </div>

                <div>
                  <b>
                    Spatial / duplicate candidate
                  </b>

                  <p>
                    PRJ001 is a nearby, similarly described
                    work. Compare before concluding overlap.
                  </p>
                </div>

                <span className="confidence">
                  HIGH
                </span>

              </div>

              {/* Completeness */}
              <div className="evidence-row">

                <div className="evidence-icon amber">
                  <FileText size={17} />
                </div>

                <div>
                  <b>Evidence completeness</b>

                  <p>
                    72% of expected project evidence is
                    currently available.
                  </p>
                </div>

                <span className="confidence">
                  72%
                </span>

              </div>

              {/* Evidence chain */}
              <div className="record-chain">

                <span>Sanction</span>

                <i>→</i>

                <span>Work order</span>

                <i>→</i>

                <span>Bill</span>

                <i>→</i>

                <span>Payment</span>

                <i>→</i>

                <span>Physical work</span>

              </div>

              {/* Governance note */}
              <div className="investigation-governance-note">

                <ShieldAlert size={15} />

                <span>
                  These are AI-generated risk signals.
                  They support investigation but do not
                  independently establish fraud.
                </span>

              </div>

            </section>

            {/* =================================================
                INVESTIGATOR ASSESSMENT
            ================================================== */}
            <section className="panel action-workspace">

              <div className="panel-head">

                <div>
                  <span className="eyebrow">
                    INVESTIGATOR ASSESSMENT
                  </span>

                  <h3>What did you find?</h3>
                </div>

                {saved && (
                  <span className="assessment-saved">
                    <CheckCircle2 size={14} />
                    Saved
                  </span>
                )}

              </div>

              <label className="field-label">
                Assessment
              </label>

              <select
                className="select wide"
                value={outcome}
                disabled={saved}
                onChange={(e) => {
                  setOutcome(e.target.value);
                  setSaved(false);
                }}
              >

                <option value="">
                  Select an outcome…
                </option>

                <option value="Verified / Legitimate">
                  Verified / Legitimate
                </option>

                <option value="Needs Further Review">
                  Needs Further Review
                </option>

                <option value="Corrective Action Required">
                  Corrective Action Required
                </option>

                <option value="Escalated">
                  Escalated
                </option>

                <option value="Insufficient Evidence">
                  Insufficient Evidence
                </option>

              </select>

              <label className="field-label">
                Investigation note
              </label>

              <textarea
                className="note-box"
                value={investigationNote}
                disabled={saved}
                onChange={(e) =>
                  setInvestigationNote(e.target.value)
                }
                placeholder="Record what the evidence supports. Avoid conclusions that are not independently verified."
              />

              {/* Evidence attachment */}
              <button
                type="button"
                className={`evidence-upload ${
                  evidenceAdded ? 'added' : ''
                }`}
                onClick={() =>
                  setEvidenceAdded(!evidenceAdded)
                }
              >

                <Upload size={18} />

                <div>

                  <b>
                    {evidenceAdded
                      ? 'Evidence marked for attachment'
                      : 'Add evidence'}
                  </b>

                  <span>
                    Document · Photo · Location ·
                    Field observation
                  </span>

                </div>

                <Paperclip size={16} />

              </button>

              {/* Action buttons */}
              <div className="action-buttons">

                <button
                  className={`secondary-action ${
                    assigned ? 'action-active' : ''
                  }`}
                  onClick={() => setAssigned(!assigned)}
                >
                  <UserRound size={15} />

                  {assigned
                    ? 'Assigned'
                    : 'Assign'}
                </button>

                <button
                  className={`secondary-action ${
                    escalated ? 'action-active' : ''
                  }`}
                  onClick={() =>
                    setEscalated(!escalated)
                  }
                >
                  <ArrowRight size={15} />

                  {escalated
                    ? 'Escalated'
                    : 'Escalate'}
                </button>

                <button
                  className="primary-action"
                  disabled={!outcome || saved}
                  onClick={handleSaveOutcome}
                >

                  {saved ? (
                    <>
                      <CheckCircle2 size={15} />
                      Outcome saved
                    </>
                  ) : (
                    <>
                      Save outcome
                      <CheckCircle2 size={15} />
                    </>
                  )}

                </button>

              </div>

              {!outcome && (
                <div className="assessment-hint">
                  <LockKeyhole size={14} />
                  Select an assessment before closing
                  this review step.
                </div>
              )}

            </section>

          </div>

          {/* =====================================================
              FIELD VERIFICATION
          ====================================================== */}
          <section className="panel field-verification">

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  FIELD VERIFICATION
                </span>

                <h3>Close the loop</h3>
              </div>

              <span className="field-badge">
                <MapPin size={14} />
                Mobile-ready
              </span>

            </div>

            {!saved && (
              <div className="verification-locked">

                <LockKeyhole size={16} />

                <span>
                  Complete and save the investigator
                  assessment to start field verification.
                </span>

              </div>
            )}

            <div className="field-steps">

              {/* STEP 1 */}
              <button
                className={`field-step ${
                  fieldStep === 1 ? 'active' : ''
                } ${
                  saved && fieldStep > 1 ? 'completed' : ''
                }`}
                disabled={!saved}
                onClick={() => handleFieldStep(1)}
              >

                <span>01</span>

                <b>Expected location</b>

                <small>
                  Project coordinates available
                </small>

              </button>

              {/* STEP 2 */}
              <button
                className={`field-step ${
                  fieldStep === 2 ? 'active' : ''
                } ${
                  fieldStep > 2 ? 'completed' : ''
                }`}
                disabled={!fieldStarted}
                onClick={() => { handleFieldStep(2); if (fieldStarted) setShowGVC(true); }}
              >

                <span>02</span>

                <b>Capture evidence</b>

                <small>
                  Photo + timestamp + location
                </small>

              </button>

              {/* STEP 3 */}
              <button
                className={`field-step ${
                  fieldStep === 3 ? 'active' : ''
                } ${
                  fieldStep > 3 ? 'completed' : ''
                }`}
                disabled={!fieldStarted}
                onClick={() => handleFieldStep(3)}
              >

                <span>03</span>

                <b>Verify checklist</b>

                <small>
                  Existence · location · progress
                </small>

              </button>

              {/* STEP 4 */}
              <button
                className={`field-step ${
                  fieldStep === 4 ? 'active' : ''
                }`}
                disabled={!fieldStarted}
                onClick={() => handleFieldStep(4)}
              >

                <span>04</span>

                <b>Record outcome</b>

                <small>
                  Verified · issue · insufficient
                </small>

              </button>

            </div>

            <button
              className="primary-action"
              disabled={!saved}
              onClick={handleStartFieldVerification}
            >

              {fieldStarted
                ? 'Field verification active'
                : 'Start field verification'}

              <ArrowRight size={15} />

            </button>

            {fieldStarted && (
              <div className="field-progress-message">

                <CheckCircle2 size={15} />

                <span>
                  Field verification started. Current
                  step:{' '}
                  <b>
                    {fieldStep === 1
                      ? 'Expected location'
                      : fieldStep === 2
                        ? 'Capture evidence'
                        : fieldStep === 3
                          ? 'Verify checklist'
                          : 'Record outcome'}
                  </b>
                </span>

              </div>
            )}

          </section>

          {/* =====================================================
              MODEL FEEDBACK
          ====================================================== */}
          <section className="panel feedback-panel">

            <MessageSquare size={18} />

            <div>

              <span className="eyebrow">
                MODEL FEEDBACK
              </span>

              <h3>
                Did the original risk assessment hold?
              </h3>

              <p>
                Investigator outcomes become labelled
                feedback for calibration and false-positive
                analysis.
              </p>

            </div>

            <div className="feedback-actions">

              <button
                className={
                  feedback === 'Yes'
                    ? 'feedback-selected'
                    : ''
                }
                disabled={!saved}
                onClick={() => { setFeedback('Yes'); recordFeedback(p.id, 'Confirmed Anomaly', p.district || 'Varanasi', 'financial overspend'); }}
              >
                Yes
              </button>

              <button
                className={
                  feedback === 'Partially'
                    ? 'feedback-selected'
                    : ''
                }
                disabled={!saved}
                onClick={() => { setFeedback('Partially'); recordFeedback(p.id, 'Partially Confirmed', p.district || 'Varanasi', 'expenditure timing mismatch'); }}
              >
                Partially
              </button>

              <button
                className={
                  feedback === 'No'
                    ? 'feedback-selected'
                    : ''
                }
                disabled={!saved}
                onClick={() => { setFeedback('No'); recordFeedback(p.id, 'False Alarm', p.district || 'Varanasi', 'seasonal roadwork delays'); }}
              >
                No
              </button>

            </div>

          </section>

          {/* =====================================================
              TRUST & GOVERNANCE
          ====================================================== */}
          <section className="panel trust-panel">

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  TRUST & GOVERNANCE
                </span>

                <h3>Evidence provenance</h3>
              </div>

              <ShieldAlert size={18} />

            </div>

            <div className="trust-grid">

              <div>
                <span className="trust-label">
                  SOURCE RECORDS
                </span>

                <b>eSAKSHI · PFMS · GIS</b>
              </div>

              <div>
                <span className="trust-label">
                  AI STATUS
                </span>

                <b>Risk signal — not a fraud verdict</b>

                <small>
                  Human review is required before any case
                  decision.
                </small>
              </div>

              <div>
                <span className="trust-label">
                  ACCESS
                </span>

                <b>{investigatorRole}</b>

                <small>
                  {investigatorContext}
                </small>
              </div>

              <div>
                <span className="trust-label">
                  AUDIT TRAIL
                </span>

                <b>Review actions attributable</b>

                <small>
                  Assessment, verification and feedback
                  are linked to the investigator.
                </small>
              </div>

            </div>

            <div className="evidence-provenance">

              <span>Source record · </span>
              <i>→</i>

              <span>AI signal</span>
              <i>→</i>

              <span>Investigator review</span>
              <i>→</i>

              <span>Field verification</span>

            </div>

          </section>

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
          </section>
        </main>

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
      )}

      </div>

    </div>

  );
}