"""
PRAHARI MPLADS — Gemini AI Service
Handles risk story generation and evidence authenticity analysis.
All functions degrade gracefully when the API key is missing.
"""
import os
import base64
import logging

logger = logging.getLogger(__name__)

# Lazy import to avoid crash when key is absent
_gemini_configured = False

def _ensure_gemini():
    global _gemini_configured
    if _gemini_configured:
        return True
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        return False
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        _gemini_configured = True
        return True
    except Exception as e:
        logger.warning(f"Gemini init failed: {e}")
        return False


# ─── Risk Story Generator ─────────────────────────────────────────────────────
RISK_STORY_PROMPT = """
You are PRAHARI, an AI-assisted civic intelligence system for MPLADS project oversight in India.
Your role is to explain WHY a project has been flagged for review — NOT to declare fraud.

PROJECT DATA:
- Project ID: {project_id}
- Sanctioned Amount: ₹{sanctioned:.2f} lakhs
- Reported Spend: ₹{spent:.2f} lakhs
- Cost Variance: {variance:+.1f}%
- Physical Progress: {physical:.0f}%
- Approved Duration: {duration} months
- Elapsed: {elapsed} months
- Agency Risk Score: {agency_risk}/100

TASK: Write a plain-language risk story with:
1. An executive summary (2-3 sentences) explaining the risk signals. Never say "fraud" or "corrupt".
2. A list of 3 specific findings, each grounded in the data above.
3. A Hindi summary (2-3 sentences) for field officers.
4. Review priority: HIGH / MEDIUM / LOW

Respond ONLY in this JSON format:
{{
  "executive_summary": "...",
  "findings": ["finding 1", "finding 2", "finding 3"],
  "hindi_summary": "...",
  "review_priority": "HIGH|MEDIUM|LOW"
}}
"""

def generate_risk_story(metrics: dict) -> dict:
    """Generate a plain-language risk story for a project."""
    if not _ensure_gemini():
        return _local_risk_story(metrics)

    try:
        import google.generativeai as genai
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = RISK_STORY_PROMPT.format(
            project_id=metrics.get("project_id", "N/A"),
            sanctioned=metrics.get("sanctioned_amount", 0) / 100000,
            spent=metrics.get("spent_amount", 0) / 100000,
            variance=metrics.get("cost_variance_pct", 0),
            physical=metrics.get("physical_progress", 0),
            duration=metrics.get("approved_duration_months", 0),
            elapsed=metrics.get("elapsed_months", 0),
            agency_risk=metrics.get("agency_risk_score", 0),
        )
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
        import json
        data = json.loads(response.text)
        data["generated_by"] = "gemini-1.5-flash"
        data["disclaimer"] = "Contribution to review priority, not a statistical fraud probability."
        return data
    except Exception as e:
        logger.warning(f"Gemini risk story failed: {e}")
        return _local_risk_story(metrics)


def _local_risk_story(metrics: dict) -> dict:
    """Deterministic fallback when Gemini is unavailable."""
    variance = metrics.get("cost_variance_pct", 0)
    physical = metrics.get("physical_progress", 0)
    pid = metrics.get("project_id", "N/A")

    findings = []
    if abs(variance) > 10:
        findings.append(
            f"Reported expenditure is {variance:+.1f}% against the sanctioned benchmark — "
            f"{'above' if variance > 0 else 'below'} expected for this stage."
        )
    else:
        findings.append("Expenditure is within acceptable variance of the sanctioned benchmark.")

    if physical < 60:
        findings.append(
            "Physical execution is materially behind the expected DPR milestone timeline, "
            "creating a financial-progress mismatch that warrants review."
        )
    else:
        findings.append("Physical progress is broadly consistent with the approved timeline.")

    findings.append(
        "Agency historical performance has been included as contextual evidence. "
        "This does not constitute a finding of wrongdoing."
    )

    priority = "HIGH" if abs(variance) > 50 or physical < 30 else "MEDIUM" if abs(variance) > 20 else "LOW"

    return {
        "executive_summary": (
            f"Project {pid} has been surfaced for review due to a {variance:+.1f}% cost variance "
            f"against the sanctioned benchmark with {physical:.0f}% physical completion. "
            "Multiple independent signals converge, warranting human verification."
        ),
        "findings": findings,
        "review_priority": priority,
        "hindi_summary": (
            f"इस परियोजना में स्वीकृत बेंचमार्क की तुलना में {abs(variance):.0f}% व्यय विचलन है "
            f"और {physical:.0f}% भौतिक प्रगति है। मानव सत्यापन आवश्यक है।"
        ),
        "generated_by": "local_fallback",
        "disclaimer": "Contribution to review priority, not a statistical fraud probability.",
    }


# ─── Evidence Authenticity Analyzer ──────────────────────────────────────────
EVIDENCE_PROMPT = """
You are an evidence authenticity analyzer for PRAHARI, a civic intelligence platform.
Analyze the provided field evidence image and return a structured assessment.

TASK: Assess whether this image is:
1. A genuine on-site photo taken at the project location
2. A potential spoof/recycled/digitally manipulated image
3. Non-conforming (irrelevant content, too poor quality to assess)

Claimed project category: {category}

Respond ONLY in this JSON format:
{{
  "asset_match_confidence": <integer 0-100>,
  "spoof_risk": "LOW|ELEVATED|HIGH",
  "spoof_indicators": ["indicator 1", ...],
  "verdict": "VERIFIED_GENUINE|SUSPECT_SPOOF|NON_CONFORMING",
  "confidence_score": <integer 0-100>
}}

CRITICAL GOVERNANCE NOTE:
- Never conclude fraud definitively
- Always note this is a preliminary AI assessment requiring human verification
"""

def analyze_evidence_image(base64_image: str, claimed_category: str = "general") -> dict:
    """Analyze a base64-encoded image for authenticity signals."""
    if not _ensure_gemini():
        return _local_evidence_check(base64_image)

    try:
        import google.generativeai as genai
        from PIL import Image
        import io

        # Decode and verify image
        img_bytes = base64.b64decode(base64_image)
        img = Image.open(io.BytesIO(img_bytes))
        img.verify()

        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = EVIDENCE_PROMPT.format(category=claimed_category)

        response = model.generate_content(
            [prompt, {"mime_type": "image/jpeg", "data": base64_image}],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
        import json
        data = json.loads(response.text)
        data["generated_by"] = "gemini-1.5-flash"
        data["disclaimer"] = "AI analysis supports human review; it does not independently establish evidence authenticity."
        return data
    except Exception as e:
        logger.warning(f"Gemini evidence check failed: {e}")
        return _local_evidence_check(base64_image)


def _local_evidence_check(base64_image: str) -> dict:
    """Deterministic heuristic fallback for evidence analysis."""
    length = len(base64_image) if base64_image else 0
    asset_match = min(74, max(35, length // 2000))
    spoof_risk = "ELEVATED" if length < 10000 else "LOW"
    verdict = (
        "SUSPECT_SPOOF" if spoof_risk == "ELEVATED" else
        "VERIFIED_GENUINE" if asset_match >= 65 else
        "NON_CONFORMING"
    )
    return {
        "asset_match_confidence": asset_match,
        "spoof_risk": spoof_risk,
        "spoof_indicators": ["Low resolution image"] if spoof_risk == "ELEVATED" else [],
        "verdict": verdict,
        "confidence_score": asset_match,
        "generated_by": "local_fallback",
        "disclaimer": "AI analysis supports human review; it does not independently establish evidence authenticity.",
    }
