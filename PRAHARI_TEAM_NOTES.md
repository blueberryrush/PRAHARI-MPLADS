# PRAHARI — Prototype & Future-Ready Team Notes

## Demo truth
- Current prototype uses demonstration/mock records. Do not claim live eSAKSHI/PFMS integration unless it is actually implemented.
- AI risk output is a **risk signal**, not proof of fraud. Final determination remains with an authorized human reviewer.

## Core flow
`eSAKSHI + PFMS + GIS → PRAHARI → anomaly/correlation/risk → explainable evidence → investigation → field verification → resolution → feedback`

## Must-show prototype modules
1. Command Centre — what needs attention?
2. Risk Profile + Risk Story — why was it flagged?
3. Investigation Centre — what does the investigator do next?
4. Evidence Graph / related records.
5. Financial, duplicate/similarity, agency and bottleneck intelligence.
6. Geographic drilldown.
7. Role/jurisdiction-scoped views.

## Evidence rules
- Distinguish **source data**, **AI signal**, **investigator finding**, and **field-verified outcome**.
- Every production finding should retain source/provenance: source system, record ID, timestamp/last update and relevant field/document reference.
- A citizen report or photograph alone is not proof of irregularity.

## Authorization
- Ministry/Central: national review scope.
- State Nodal: state scope.
- District Authority: district scope.
- MP Office: constituency scope.
- Citizen: public information only.
- Production authorization must be enforced server-side using authenticated identity + role + jurisdiction; frontend visibility is not security.

## Privacy & security
- Data minimization.
- Role/jurisdiction-based access.
- Mask unnecessary PII.
- Encryption in transit/at rest.
- Secure secrets/API authentication.
- Audit trail: who, what, when, case.
- Retention and access policies for sensitive investigation data.

## Field verification
`Risk signal → case → assignment → expected location → capture evidence → checklist → outcome`

Production verification can combine authorized inspection, project ID, timestamp/location metadata, photos/documents and officer observations. Do not present a photo as standalone proof.

## AI governance
- Anomaly ≠ fraud.
- Anomaly ≠ case.
- Case ≠ priority.
- Risk score should be explainable through contributing signals.
- False positives should be recordable.
- Investigator outcomes can become feedback for later calibration/model improvement.

## Faculty answers to remember
**Why not eSAKSHI?** eSAKSHI provides the underlying monitoring/transparency; PRAHARI adds an intelligence layer for correlation, anomaly detection, explainability and prioritization.

**How do you prove fraud?** We do not claim AI proves fraud. It identifies risk signals; authorized officials investigate and verify.

**How do you protect data?** Role + jurisdiction access, minimization, masking, encryption and audit logging in production.

**What if AI is wrong?** The finding can be marked false positive/legitimate; outcomes can support future calibration.
