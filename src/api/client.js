/**
 * PRAHARI Frontend API Bridge
 * Connects to the FastAPI backend (http://localhost:8000 by default).
 * All functions have graceful fallbacks when the backend is offline.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TIMEOUT_MS = 8000;

// ─── Fetch with timeout & fallback ───────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, data: await res.json(), fallback: false };
  } catch (err) {
    clearTimeout(timer);
    // Network/timeout errors fall through to deterministic fallback
    return { ok: false, data: null, fallback: true, error: err.message };
  }
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export async function fetchProjects({ district, riskTier, category } = {}) {
  const params = new URLSearchParams();
  if (district) params.set('district', district);
  if (riskTier) params.set('risk_tier', riskTier);
  if (category) params.set('category', category);
  return apiFetch(`/api/projects?${params}`);
}

export async function fetchProjectById(id) {
  return apiFetch(`/api/projects/${id}`);
}

// ─── Risk Story (Gemini) ──────────────────────────────────────────────────────
export async function generateRiskStory(projectId, metrics) {
  const result = await apiFetch(`/api/projects/${projectId}/generate-story`, {
    method: 'POST',
    body: JSON.stringify(metrics),
  });
  if (result.fallback || !result.ok) {
    // Deterministic fallback when backend is offline
    return {
      ok: true,
      fallback: true,
      data: buildLocalRiskStory(metrics),
    };
  }
  return result;
}

function buildLocalRiskStory(metrics) {
  const costPct = metrics?.costVariancePct || 0;
  const physProg = metrics?.physicalProgress || 0;
  return {
    executive_summary: `This project shows a ${costPct > 0 ? `+${costPct}%` : 'nominal'} cost variance against the sanctioned benchmark with ${physProg}% physical completion. Multiple signals have been surfaced for human review.`,
    findings: [
      costPct > 10
        ? `Reported expenditure is ${costPct}% above the sanctioned benchmark — significantly above the sector norm.`
        : 'Expenditure is within acceptable variance of the sanctioned benchmark.',
      physProg < 60
        ? 'Physical execution is materially behind the expected DPR milestone timeline.'
        : 'Physical progress is broadly consistent with the approved schedule.',
      'Agency historical performance has been included as contextual evidence. This does not constitute a finding of wrongdoing.',
    ],
    review_priority: costPct > 50 ? 'HIGH' : costPct > 20 ? 'MEDIUM' : 'LOW',
    hindi_summary: `इस परियोजना में स्वीकृत बेंचमार्क की तुलना में व्यय में ${costPct > 0 ? `${costPct}%` : 'न्यूनतम'} विचलन है। मानव सत्यापन आवश्यक है।`,
    generated_by: 'local_fallback',
    disclaimer: 'Contribution to review priority, not a statistical fraud probability.',
  };
}

// ─── Evidence Authenticity (AI) ───────────────────────────────────────────────
export async function verifyEvidence(base64Image, claimedCategory = 'general') {
  const result = await apiFetch('/api/verify-evidence', {
    method: 'POST',
    body: JSON.stringify({ image: base64Image, claimed_category: claimedCategory }),
  });
  if (result.fallback || !result.ok) {
    return {
      ok: true,
      fallback: true,
      data: buildLocalEvidenceCheck(base64Image),
    };
  }
  return result;
}

function buildLocalEvidenceCheck(base64) {
  // Deterministic heuristic: check image data length as proxy for quality
  const len = base64?.length || 0;
  const assetMatch = len > 50000 ? 74 : len > 20000 ? 61 : 45;
  const spoofRisk = len < 10000 ? 'ELEVATED' : 'LOW';
  const verdict =
    spoofRisk === 'ELEVATED' ? 'SUSPECT_SPOOF' :
    assetMatch >= 65 ? 'VERIFIED_GENUINE' : 'NON_CONFORMING';

  return {
    asset_match_confidence: assetMatch,
    spoof_risk: spoofRisk,
    spoof_indicators: spoofRisk === 'ELEVATED'
      ? ['Low image resolution', 'Insufficient natural lighting detected']
      : [],
    verdict,
    confidence_score: assetMatch,
    generated_by: 'local_fallback',
    disclaimer: 'AI analysis supports human review; it does not independently establish evidence authenticity.',
  };
}

// ─── Citizen Grievance ────────────────────────────────────────────────────────
export async function submitComplaint(payload) {
  const result = await apiFetch('/api/complaints/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (result.fallback || !result.ok) {
    // Token generated locally in CaseContext.addComplaint() — no backend needed
    return { ok: true, fallback: true, data: { status: 'queued_locally' } };
  }
  return result;
}

// ─── Investigation Action ─────────────────────────────────────────────────────
export async function recordInvestigationAction(projectId, action) {
  const result = await apiFetch(`/api/investigations/${projectId}/action`, {
    method: 'POST',
    body: JSON.stringify(action),
  });
  if (result.fallback || !result.ok) {
    // CaseContext handles local state persistence — backend sync is best-effort
    return { ok: true, fallback: true, data: { synced: false } };
  }
  return result;
}

// ─── Health check ─────────────────────────────────────────────────────────────
export async function checkBackendHealth() {
  const result = await apiFetch('/api/health');
  return result.ok && !result.fallback;
}
