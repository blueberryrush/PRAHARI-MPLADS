"""
PRAHARI MPLADS — FastAPI Backend
Run: uvicorn backend.main:app --reload --port 8000
"""
import os
import random
import string
from datetime import datetime, timezone
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.models import (
    ProjectMetrics,
    EvidenceVerifyRequest,
    EvidenceVerifyResponse,
    ComplaintRequest,
    ComplaintResponse,
    InvestigationActionRequest,
    InvestigationActionResponse,
)
from backend.services.scoring import calculate_risk_score
from backend.services.gemini_service import generate_risk_story, analyze_evidence_image

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="PRAHARI MPLADS API",
    description="Civic Intelligence Backend — AI-assisted MPLADS oversight platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory stores (replace with DB in production) ────────────────────────
_investigation_log: dict = {}  # { project_id: [action, ...] }
_complaints: list = []


# ─── Helpers ──────────────────────────────────────────────────────────────────
def rand_hash(n: int = 8) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=n))


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─── Static project dataset (mirrors frontend mockData.js) ────────────────────
PROJECTS = [
    {
        "id": "PRJ001", "name": "Road Widening – Varanasi North",
        "district": "Varanasi", "state": "Uttar Pradesh",
        "constituency": "Varanasi", "sector": "Roads",
        "sanctionedAmount": 5000000, "spentAmount": 4200000,
        "physicalProgress": 72, "status": "in_progress",
        "agency": "AGN001", "isAnomaly": False,
    },
    {
        "id": "PRJ002", "name": "Community Hall – Varanasi Central",
        "district": "Varanasi", "state": "Uttar Pradesh",
        "constituency": "Varanasi", "sector": "Community",
        "sanctionedAmount": 3500000, "spentAmount": 4900000,
        "physicalProgress": 45, "status": "delayed",
        "agency": "AGN003", "isAnomaly": True,
    },
    {
        "id": "PRJ003", "name": "Drinking Water Pipeline – Lucknow West",
        "district": "Lucknow", "state": "Uttar Pradesh",
        "constituency": "Lucknow", "sector": "Drinking Water",
        "sanctionedAmount": 8000000, "spentAmount": 7600000,
        "physicalProgress": 88, "status": "in_progress",
        "agency": "AGN002", "isAnomaly": False,
    },
]


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "PRAHARI MPLADS API", "timestamp": utcnow()}


@app.get("/api/projects")
def list_projects(
    district: Optional[str] = None,
    risk_tier: Optional[str] = None,
    state: Optional[str] = None,
):
    """List all MPLADS projects with optional filters."""
    results = PROJECTS

    if district:
        results = [p for p in results if p.get("district", "").lower() == district.lower()]
    if state:
        results = [p for p in results if p.get("state", "").lower() == state.lower()]

    # Enrich with risk scores
    enriched = []
    for p in results:
        score_data = calculate_risk_score(
            sanctioned_amount=p["sanctionedAmount"],
            spent_amount=p["spentAmount"],
            physical_progress=p["physicalProgress"],
            approved_duration_months=24,
            elapsed_months=12,
            agency_risk_score=50,
        )
        item = {**p, "riskScore": score_data["score"], "riskTier": score_data["tier"]}
        if risk_tier and item["riskTier"].lower() != risk_tier.lower():
            continue
        enriched.append(item)

    return {"projects": enriched, "total": len(enriched), "timestamp": utcnow()}


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    """Get a single project by ID."""
    project = next((p for p in PROJECTS if p["id"] == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    score_data = calculate_risk_score(
        sanctioned_amount=project["sanctionedAmount"],
        spent_amount=project["spentAmount"],
        physical_progress=project["physicalProgress"],
        approved_duration_months=24,
        elapsed_months=12,
        agency_risk_score=50,
    )
    return {**project, "riskAnalysis": score_data, "timestamp": utcnow()}


@app.post("/api/projects/{project_id}/generate-story")
def generate_story(project_id: str, metrics: ProjectMetrics):
    """Generate a plain-language AI risk story for a project."""
    project = next((p for p in PROJECTS if p["id"] == project_id), None)
    if not project and project_id != metrics.project_id:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    story = generate_risk_story(metrics.model_dump())
    return {"project_id": project_id, "story": story, "timestamp": utcnow()}


@app.post("/api/verify-evidence", response_model=EvidenceVerifyResponse)
def verify_evidence(request: EvidenceVerifyRequest):
    """Analyze field evidence image for authenticity signals."""
    if not request.image:
        raise HTTPException(status_code=400, detail="No image data provided")

    result = analyze_evidence_image(request.image, request.claimed_category)
    return EvidenceVerifyResponse(**result)


@app.post("/api/complaints/submit", response_model=ComplaintResponse)
def submit_complaint(complaint: ComplaintRequest):
    """Register a citizen grievance/observation."""
    token_id = f"GRV-{complaint.state_code}-{complaint.district_code}-2026-{random.randint(1000, 9999)}"
    submitted_at = utcnow()

    _complaints.append({
        **complaint.model_dump(),
        "token_id": token_id,
        "submitted_at": submitted_at,
        "status": "Submitted",
    })

    return ComplaintResponse(
        token_id=token_id,
        status="Submitted",
        submitted_at=submitted_at,
        ai_check_initiated=True,
        message=f"Observation registered. Tracking Reference: {token_id}. AI evidence authenticity check initiated.",
    )


@app.post("/api/investigations/{project_id}/action", response_model=InvestigationActionResponse)
def record_action(project_id: str, action: InvestigationActionRequest):
    """Record an investigation action/lifecycle advance for a case."""
    audit_hash = rand_hash()

    log_entry = {
        "project_id": project_id,
        "action": action.action,
        "new_status": action.new_status,
        "officer_name": action.officer_name,
        "role": action.role,
        "note": action.note,
        "timestamp": utcnow(),
        "hash": audit_hash,
    }

    if project_id not in _investigation_log:
        _investigation_log[project_id] = []
    _investigation_log[project_id].append(log_entry)

    return InvestigationActionResponse(
        project_id=project_id,
        new_status=action.new_status,
        action_logged=True,
        audit_hash=audit_hash,
    )


@app.get("/api/investigations/{project_id}/history")
def get_history(project_id: str):
    """Get audit trail for a project investigation."""
    return {
        "project_id": project_id,
        "audit_trail": _investigation_log.get(project_id, []),
        "timestamp": utcnow(),
    }
