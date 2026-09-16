"""
PRAHARI MPLADS Backend — Pydantic Models
"""
from pydantic import BaseModel, Field
from typing import Optional, List


# ─── Project ──────────────────────────────────────────────────────────────────
class ProjectMetrics(BaseModel):
    project_id: str
    sanctioned_amount: float
    spent_amount: float
    physical_progress: float  # 0-100
    approved_duration_months: int
    elapsed_months: int
    agency_risk_score: float  # 0-100
    spatial_overlap_count: int = 0
    benchmark_cost_per_unit: Optional[float] = None
    reported_cost_per_unit: Optional[float] = None

    @property
    def cost_variance_pct(self) -> float:
        if self.sanctioned_amount == 0:
            return 0.0
        return round((self.spent_amount - self.sanctioned_amount) / self.sanctioned_amount * 100, 1)


# ─── Risk Story Response ──────────────────────────────────────────────────────
class RiskStoryResponse(BaseModel):
    executive_summary: str
    findings: List[str]
    review_priority: str  # HIGH | MEDIUM | LOW
    hindi_summary: str
    disclaimer: str = "Contribution to review priority, not a statistical fraud probability."
    generated_by: str = "gemini-1.5-flash"


# ─── Evidence Verification ────────────────────────────────────────────────────
class EvidenceVerifyRequest(BaseModel):
    image: str  # base64-encoded JPEG/PNG
    claimed_category: str = "general"


class EvidenceVerifyResponse(BaseModel):
    asset_match_confidence: int  # 0-100
    spoof_risk: str              # LOW | ELEVATED | HIGH
    spoof_indicators: List[str]
    verdict: str                 # VERIFIED_GENUINE | SUSPECT_SPOOF | NON_CONFORMING
    confidence_score: int
    generated_by: str
    disclaimer: str = "AI analysis supports human review; it does not independently establish evidence authenticity."


# ─── Complaint / Grievance ────────────────────────────────────────────────────
class ComplaintRequest(BaseModel):
    project_id: str
    project_name: str
    district: str
    state: str
    state_code: str
    district_code: str
    issue_type: str
    observation: str
    is_anonymous: bool = False
    has_photo: bool = False


class ComplaintResponse(BaseModel):
    token_id: str
    status: str = "Submitted"
    submitted_at: str
    ai_check_initiated: bool = True
    message: str


# ─── Investigation Action ─────────────────────────────────────────────────────
class InvestigationActionRequest(BaseModel):
    action: str
    officer_name: str = "Officer"
    role: str = "district_authority"
    note: str = ""
    new_status: str


class InvestigationActionResponse(BaseModel):
    project_id: str
    new_status: str
    action_logged: bool
    audit_hash: str


# ─── Cloud Citizen Observation ───────────────────────────────────────────────
class CitizenObservationRequest(BaseModel):
    work_id: str
    ground_status: str
    observation_text: str
    evidence_photo_url: Optional[str] = None
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None


# ─── Investigation Decision ───────────────────────────────────────────────────
class InvestigationDecisionRequest(BaseModel):
    work_id: str
    decision: str  # e.g., 'VERIFIED_ESCALATED', 'RESOLVED_CLEARED', 'APPROVE_CLOSE', 'ESCALATE_VIGILANCE'
    officer_name: Optional[str] = "District Magistrate / Investigation Officer"
    note: Optional[str] = ""


# ─── Role-Based Authentication & Onboarding ──────────────────────────────────
class OfficerLoginRequest(BaseModel):
    email: str
    password: str
    target_portal: str  # 'COMMAND_CENTER' or 'INVESTIGATION_CENTER'


class OfficerOnboardingRequest(BaseModel):
    officer_id: int
    govt_id_number: str
    id_proof_data: Optional[str] = None
    new_password: str


