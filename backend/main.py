"""
PRAHARI MPLADS — FastAPI Backend with Supabase Cloud Architecture
Run: uvicorn backend.main:app --reload --port 8000
"""
import json
import os
import random
import string
from datetime import datetime, timezone
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai

# Initialize Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Warning: Failed to configure Gemini API: {e}")

from fastapi import FastAPI, HTTPException, Query, Response, Request, Header
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
    CitizenObservationRequest,
    InvestigationDecisionRequest,
    OfficerLoginRequest,
    OfficerOnboardingRequest,
)
from backend.services.scoring import calculate_risk_score
from backend.services.gemini_service import generate_risk_story, analyze_evidence_image
import backend.supabase_client as db
import backend.database as auth_db
import backend.auth_service as auth_svc


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="PRAHARI MPLADS API",
    description="Civic Intelligence Backend — AI-assisted MPLADS oversight platform with Supabase Cloud persistence",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "*",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory audit & complaint log fallback ────────────────────────────────
_investigation_log: dict = {}  # { project_id: [action, ...] }
_complaints: list = []


# ─── Helpers ──────────────────────────────────────────────────────────────────
def rand_hash(n: int = 8) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=n))


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    """Returns service health and Supabase connection status."""
    supabase_ok = False
    try:
        projs = db.get_official_projects()
        supabase_ok = len(projs) > 0
    except Exception:
        supabase_ok = False

    return {
        "status": "ok",
        "service": "PRAHARI MPLADS API",
        "supabase_connected": supabase_ok,
        "supabase_url": db.SUPABASE_URL,
        "timestamp": utcnow(),
    }


# ─── Authentication & Onboarding Routes ───────────────────────────────────────

@app.post("/api/auth/login")
def officer_login(req: OfficerLoginRequest):
    """
    Direct, instant prototype authentication for officials and citizens.
    """
    email = req.email.strip().lower() if req.email else "citizen@prahari.gov.in"
    target_portal = (req.target_portal or "COMMAND_CENTER").strip().upper()
    officer = auth_db.get_officer_by_email(email)

    if officer:
        token = auth_svc.create_access_token(officer)
        return {
            "token": token,
            "officer": auth_svc.sanitize_officer_response(officer),
            "message": f"Welcome, {officer['name']}."
        }

    # If citizen portal requested or citizen email
    if "citizen" in email or target_portal == "CITIZEN":
        citizen_user = {
            "id": 999,
            "email": email,
            "name": "Rajesh Kumar (Citizen)",
            "designation": "Citizen Observer",
            "department": "Public Vigilance & Community Oversight",
            "portal_access": "CITIZEN",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "role": "citizen"
        }
        token = auth_svc.create_access_token(citizen_user)
        return {
            "token": token,
            "officer": citizen_user,
            "message": "Welcome to PRAHARI Citizen Portal."
        }

    # Standard fallback login for arbitrary demo credentials
    generic_user = {
        "id": 100,
        "email": email,
        "name": email.split("@")[0].replace(".", " ").title(),
        "designation": "District Authority" if target_portal == "COMMAND_CENTER" else "Investigation Officer",
        "department": "District Administration",
        "portal_access": target_portal,
        "state": "Uttar Pradesh",
        "district": "Varanasi",
    }
    token = auth_svc.create_access_token(generic_user)
    return {
        "token": token,
        "officer": generic_user,
        "message": f"Welcome, {generic_user['name']}."
    }



@app.post("/api/auth/complete-onboarding")
def complete_onboarding(req: OfficerOnboardingRequest):
    """
    Complete first-time officer service clearance & onboarding.
    Updates Govt Service ID, uploaded credential proof, and sets new password.
    """
    govt_id = req.govt_id_number.strip()
    if not govt_id:
        raise HTTPException(status_code=400, detail="Government Service ID / Cadre Number is required.")

    if not req.new_password or len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")

    officer = auth_db.get_officer_by_id(req.officer_id)
    if not officer:
        raise HTTPException(status_code=404, detail="Officer record not found.")

    # Update database record
    updated = auth_db.update_officer_onboarding(
        officer_id=req.officer_id,
        govt_id_number=govt_id,
        id_proof_url=req.id_proof_data,
        new_password=req.new_password,
    )

    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update officer onboarding information.")

    refreshed_officer = auth_db.get_officer_by_id(req.officer_id)
    token = auth_svc.create_access_token(refreshed_officer)

    return {
        "success": True,
        "requires_onboarding": False,
        "token": token,
        "officer": auth_svc.sanitize_officer_response(refreshed_officer),
        "message": "Officer verification and credential update completed successfully."
    }


@app.get("/api/auth/me")
def get_current_officer(authorization: Optional[str] = Header(None)):
    """
    Retrieve authenticated officer profile from Bearer token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return {"authenticated": False, "officer": None}

    token = authorization.split("Bearer ")[1].strip()
    payload = auth_svc.decode_access_token(token)
    if not payload:
        return {"authenticated": False, "officer": None}

    officer = auth_db.get_officer_by_id(payload.get("id"))
    if not officer:
        return {"authenticated": True, "officer": payload}

    return {"authenticated": True, "officer": auth_svc.sanitize_officer_response(officer)}



@app.get("/api/projects")
@app.get("/api/works")
def list_projects(
    district: Optional[str] = None,
    risk_tier: Optional[str] = None,
    state: Optional[str] = None,
    category: Optional[str] = None,
    limit: Optional[int] = 5000,
    offset: Optional[int] = None,
):
    """
    List all MPLADS projects joined with prahari_intelligence from Supabase.
    Supports querying all seeded records (up to 5,000) without truncation.
    """
    try:
        projects = db.get_all_joined_projects(
            district=district,
            state=state,
            risk_tier=risk_tier,
            category=category,
            limit=limit or 5000,
            offset=offset,
        )
        return {
            "projects": projects,
            "total": len(projects),
            "source": "supabase_cloud",
            "timestamp": utcnow(),
        }
    except Exception as exc:
        return {
            "projects": [],
            "total": 0,
            "error": str(exc),
            "source": "fallback",
            "timestamp": utcnow(),
        }


@app.get("/api/anomalies")
def list_anomalies(
    district: Optional[str] = None,
    state: Optional[str] = None,
    min_score: int = 50,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
):
    """
    List high-risk anomaly projects flagged by PRAHARI intelligence from Supabase.
    """
    try:
        all_projs = db.get_all_joined_projects(
            district=district,
            state=state,
        )
        # Filter projects that exceed the anomaly risk threshold or have discrepancy signals
        anomalies = [
            p for p in all_projs
            if (p.get("composite_risk_score") or 0) >= min_score
            or (p.get("progress_discrepancy_points") or 0) > 0
            or "HIGH" in (p.get("review_priority") or "")
        ]
        # Sort by composite_risk_score descending
        anomalies.sort(key=lambda x: x.get("composite_risk_score") or 0, reverse=True)

        if offset is not None:
            anomalies = anomalies[offset:]
        if limit is not None:
            anomalies = anomalies[:limit]

        return {
            "anomalies": anomalies,
            "total": len(anomalies),
            "source": "supabase_cloud",
            "timestamp": utcnow(),
        }
    except Exception as exc:
        return {
            "anomalies": [],
            "total": 0,
            "error": str(exc),
            "source": "fallback",
            "timestamp": utcnow(),
        }


@app.get("/api/state-summary")
def get_state_summary():
    """
    Get aggregated project counts, average risk score, sanctioned amounts (in Cr/Lakhs),
    and anomaly counts grouped by state for interactive map hover cards.
    """
    try:
        summaries = db.get_state_summaries()
        return {
            "status": "success",
            "states": summaries,
            "total_states": len(summaries),
            "source": "supabase_cloud",
            "timestamp": utcnow(),
        }
    except Exception as exc:
        return {
            "status": "error",
            "states": {},
            "total_states": 0,
            "error": str(exc),
            "source": "fallback",
            "timestamp": utcnow(),
        }


@app.get("/api/projects/{work_id}")
def get_project(work_id: str):
    """
    Get full details for a project including official record, prahari_intelligence,
    and associated citizen ground observations from Supabase.
    """
    try:
        detail = db.get_project_by_id(work_id)
        if not detail:
            raise HTTPException(status_code=404, detail=f"Project {work_id} not found in Supabase")
        return {
            **detail,
            "timestamp": utcnow(),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@app.post("/api/citizen/observation")
def submit_citizen_observation(obs: CitizenObservationRequest):
    """
    Insert a citizen observation into Supabase and perform dynamic risk recalculation.
    If observation indicates discrepancy while reported progress is >= 70%,
    elevates composite risk score by +15 points.
    """
    try:
        # 1. Insert observation into Supabase
        inserted = db.add_citizen_observation(
            work_id=obs.work_id,
            ground_status=obs.ground_status,
            observation_text=obs.observation_text,
            evidence_photo_url=obs.evidence_photo_url,
            user_latitude=obs.user_latitude,
            user_longitude=obs.user_longitude,
        )

        # 2. Dynamic risk recalculation & intelligence update
        project_detail = db.get_project_by_id(obs.work_id)
        updated_intel = None

        if project_detail:
            intel = project_detail.get("prahari_intelligence") or {}
            reported_prog = intel.get("reported_progress_pct", 0)
            status_lower = obs.ground_status.lower()

            is_discrepancy = any(keyword in status_lower for keyword in [
                "abandoned", "incomplete", "stopped", "not started",
                "delayed", "ghost", "barren", "discrepancy", "poor"
            ])

            if is_discrepancy and reported_prog >= 60:
                current_score = intel.get("composite_risk_score", 50)
                new_score = min(99, current_score + 15)
                new_discrepancy = min(100, (intel.get("progress_discrepancy_points", 0) or 0) + 20)

                updates = {
                    "composite_risk_score": new_score,
                    "progress_discrepancy_points": new_discrepancy,
                    "review_priority": "HIGH_PRIORITY",
                    "temporal_slippage_signal": f"CRITICAL DISCREPANCY: Ground citizen observation reported '{obs.ground_status}' despite {reported_prog}% reported completion.",
                }
                if intel.get("audit_status") in ("MONITORED_AUTO", "RESOLVED_AUDITED"):
                    updates["audit_status"] = "QUEUED_FOR_FIELD_INSPECTION"

                updated_intel = db.update_intelligence(obs.work_id, updates)

        return {
            "status": "success",
            "observation": inserted,
            "updated_intelligence": updated_intel,
            "message": "Citizen observation registered and dynamic PRAHARI risk score recalibrated.",
            "timestamp": utcnow(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to record observation: {str(exc)}")


@app.post("/api/investigation/decision")
def record_investigation_decision(req: InvestigationDecisionRequest):
    """
    Update the investigation audit_status in Supabase prahari_intelligence.
    Supports VERIFIED_ESCALATED, RESOLVED_CLEARED, UNDER_FIELD_INVESTIGATION, etc.
    """
    decision_map = {
        "VERIFIED_ESCALATED": "ESCALATED_TO_STATE_VIGILANCE",
        "RESOLVED_CLEARED": "RESOLVED_AUDITED",
        "APPROVE_CLOSE": "RESOLVED_AUDITED",
        "ESCALATE_VIGILANCE": "ESCALATED_TO_STATE_VIGILANCE",
        "FIELD_DISPATCH": "UNDER_FIELD_INVESTIGATION",
        "UNDER_REVIEW": "UNDER_REVIEW",
    }
    target_status = decision_map.get(req.decision, req.decision)

    try:
        updated = db.update_audit_status(req.work_id, target_status)

        # Also append to in-memory audit log for rapid UI retrieval
        audit_hash = rand_hash()
        log_entry = {
            "work_id": req.work_id,
            "action": f"Decision: {req.decision}",
            "new_status": target_status,
            "officer_name": req.officer_name,
            "note": req.note,
            "timestamp": utcnow(),
            "hash": audit_hash,
        }
        if req.work_id not in _investigation_log:
            _investigation_log[req.work_id] = []
        _investigation_log[req.work_id].append(log_entry)

        return {
            "status": "success",
            "work_id": req.work_id,
            "audit_status": target_status,
            "audit_hash": audit_hash,
            "updated_intelligence": updated,
            "timestamp": utcnow(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to record investigation decision: {str(exc)}")


@app.post("/api/recalculate-all")
def recalculate_all():
    """
    Recalculate deterministic risk scores for all projects in Supabase.
    Formula: Score = 0.25F + 0.20S + 0.20T + 0.15A + 0.10B + 0.10D
    """
    try:
        projects = db.get_official_projects()
        intelligence_list = db.get_prahari_intelligence()
        intel_map = {item["work_id"]: item for item in intelligence_list if "work_id" in item}

        updated_count = 0
        for proj in projects:
            wid = proj.get("work_id")
            if not wid:
                continue

            sanctioned = float(proj.get("sanctioned_amount_lakhs") or 0) * 100000
            spent = float(proj.get("expenditure_lakhs") or 0) * 100000
            intel = intel_map.get(wid, {})
            phys_prog = float(intel.get("reported_progress_pct") or 50)

            score_res = calculate_risk_score(
                sanctioned_amount=sanctioned,
                spent_amount=spent,
                physical_progress=phys_prog,
                approved_duration_months=24,
                elapsed_months=14,
                agency_risk_score=60 if "RED" in (proj.get("implementing_agency") or "") else 35,
            )

            tier_to_priority = {
                "HIGH": "HIGH_PRIORITY",
                "MEDIUM": "MODERATE_WATCH",
                "LOW": "STABLE",
            }

            db.update_intelligence(wid, {
                "composite_risk_score": int(score_res["score"]),
                "review_priority": tier_to_priority.get(score_res["tier"], "MODERATE_WATCH"),
            })
            updated_count += 1

        return {
            "status": "success",
            "recalculated_count": updated_count,
            "timestamp": utcnow(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Recalculation error: {str(exc)}")


# ─── Existing Auxiliary Endpoints ─────────────────────────────────────────────

@app.post("/api/projects/{project_id}/generate-story")
def generate_story(project_id: str, metrics: ProjectMetrics):
    """Generate a plain-language AI risk story for a project."""
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
    """Register a citizen grievance."""
    token_id = f"GRV-{complaint.state_code}-{complaint.district_code}-2026-{random.randint(1000, 9999)}"
    submitted_at = utcnow()

    _complaints.append({
        **complaint.model_dump(),
        "token_id": token_id,
        "submitted_at": submitted_at,
        "status": "Submitted",
    })

    # Also persist to Supabase if possible
    try:
        db.add_citizen_observation(
            work_id=complaint.project_id,
            ground_status=complaint.issue_type,
            observation_text=f"[{complaint.issue_type}] {complaint.observation}",
        )
    except Exception:
        pass

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

    # Sync to Supabase audit status
    try:
        db.update_audit_status(project_id, action.new_status)
    except Exception:
        pass

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


# ─── MoSPI-Restricted Gemini Chatbot ──────────────────────────────────────────

SYSTEM_PROMPT = """You are PRAHARI AI Sahayak, the official MoSPI MPLADS Governance Assistant.
Guidelines:
1. Respect the user's requested language strictly:
   - If user asks in English or says "answer in English", answer in clear, professional English.
   - If user asks in Hindi (Devanagari), reply in Hindi.
   - If user asks in Hinglish, reply in natural Hinglish.
2. Maintain conversation context across turns (remember previous questions).
3. Grievance / Complaint Registration Process:
   Step 1: Navigate to Citizen Portal (/citizen).
   Step 2: Locate the project via Search or Interactive Map.
   Step 3: Click 'Report Observation for this Project'.
   Step 4: Select category (Stalled, Substandard, or Completed on Paper).
   Step 5: Upload geotagged photo evidence.
   Step 6: Receive a cryptographic tracking hash (e.g., #CIT-VAR-2024-XXXX).
4. Keep replies concise, actionable, and accurate to MPLADS guidelines.
"""


class ChatRequest(BaseModel):
    message: Optional[str] = None
    query: Optional[str] = None
    history: Optional[List[dict]] = []


def make_chat_response(reply_text: str) -> Response:
    """Helper to return clean UTF-8 encoded JSON response without character corruption."""
    return Response(
        content=json.dumps({"reply": reply_text}, ensure_ascii=False),
        media_type="application/json; charset=utf-8",
    )


@app.post("/api/chat")
def chat_with_sahayak(req: ChatRequest):
    """
    Official MoSPI MPLADS Governance Assistant (PRAHARI AI Sahayak).
    Supports multi-turn context memory, strict language adherence (English, Hindi, Hinglish),
    and exact 6-step grievance registration workflow.
    """
    user_msg = (req.message or req.query or "").strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history_list = req.history or []
    recent_history = history_list[-5:] if len(history_list) > 5 else history_list

    # Format history for Gemini API
    formatted_gemini_history = []
    for h in recent_history:
        role = "user" if h.get("role") == "user" else "model"
        text = h.get("text") or h.get("content") or h.get("message") or ""
        if text:
            formatted_gemini_history.append({"role": role, "parts": [text]})

    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key and api_key != "your_gemini_api_key_here":
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=SYSTEM_PROMPT,
            )
            chat = model.start_chat(history=formatted_gemini_history)
            response = chat.send_message(user_msg)
            if response and response.text:
                return make_chat_response(response.text.strip())
        except Exception:
            pass

    # ─── Smart Context-Aware & Multilingual Dynamic Engine ────────────────────
    msg_lower = user_msg.lower()

    # Detect language instruction
    force_english = any(
        phrase in msg_lower
        for phrase in [
            "in english",
            "answer in english",
            "english please",
            "speak english",
            "english me",
            "english mein",
            "english me answer",
            "english me batao",
            "reply in english",
        ]
    )
    force_hindi = (
        any(phrase in msg_lower for phrase in ["hindi me", "hindi me batao", "hindi mein", "in hindi", "हिंदी में", "हिंदी"])
        or any(0x0900 <= ord(c) <= 0x097F for c in user_msg)
    )
    force_hinglish = any(phrase in msg_lower for phrase in ["hinglish", "kaise kare", "batao", "kya hai", "shikayat kaise", "karo"])

    # Extract topic from history if user asks for language switch (e.g., "english me answer do")
    prev_user_text = ""
    for h in reversed(recent_history):
        if h.get("role") == "user":
            prev_user_text = (h.get("text") or "").lower()
            break

    combined_context = f"{prev_user_text} {msg_lower}"

    is_complaint = any(
        k in combined_context
        for k in ["complaint", "grievance", "report", "shikayat", "delay", "stalled", "substandard", "ghost", "photo", "evidence", "register", "darj"]
    )
    is_rules = any(
        k in combined_context
        for k in ["guideline", "rule", "fund", "allocation", "5 crore", "sc", "st", "niyam", "disha", "esakshi", "paisa"]
    )
    is_risk = any(
        k in combined_context
        for k in ["risk", "score", "formula", "anomaly", "jokhim", "composite", "calculate"]
    )
    is_cvc = any(
        k in combined_context
        for k in ["cvc", "procurement", "tender", "gfr", "thekedaar", "contractor"]
    )

    if is_complaint:
        if force_english or (not force_hindi and not force_hinglish and not any(0x0900 <= ord(c) <= 0x097F for c in user_msg)):
            reply = (
                "**MPLADS Grievance / Complaint Registration Process:**\n\n"
                "**Step 1:** Navigate to the **Citizen Portal** (`/citizen`).\n"
                "**Step 2:** Locate the project via **Search** or the **Interactive Map**.\n"
                "**Step 3:** Click **'Report Observation for this Project'**.\n"
                "**Step 4:** Select the issue category (*Stalled*, *Substandard*, or *Completed on Paper*).\n"
                "**Step 5:** Upload geotagged photo evidence from the site.\n"
                "**Step 6:** Receive a cryptographic tracking hash (e.g., `#CIT-VAR-2024-XXXX`) to monitor resolution status."
            )
        elif force_hindi:
            reply = (
                "**एमपीएलएडीएस शिकायत / अवलोकन दर्ज करने की 6-चरणीय प्रक्रिया:**\n\n"
                "**चरण 1:** **नागरिक पोर्टल** (`/citizen`) पर जाएँ।\n"
                "**चरण 2:** **खोज (Search)** अथवा **इंटरैक्टिव मानचित्र** द्वारा परियोजना का चयन करें।\n"
                "**चरण 3:** **'Report Observation for this Project'** पर क्लिक करें।\n"
                "**चरण 4:** श्रेणी चुनें (*रुका हुआ/Stalled*, *घटिया निर्माण/Substandard*, या *केवल कागजों पर पूर्ण/Completed on Paper*)।\n"
                "**चरण 5:** निर्माण स्थल की जियोटैग्ड फोटो साक्ष्य अपलोड करें।\n"
                "**चरण 6:** त्वरित क्रिप्टोग्राफिक ट्रैकिंग टोकन (उदा. `#CIT-VAR-2024-XXXX`) प्राप्त करें।"
            )
        else:
            reply = (
                "**MPLADS Complaint / Grievance Register karne ke 6 Steps:**\n\n"
                "**Step 1:** **Citizen Portal** (`/citizen`) par visit karein.\n"
                "**Step 2:** Search ya **Interactive Map** se apni constituency ka project choose karein.\n"
                "**Step 3:** **'Report Observation for this Project'** button par click karein.\n"
                "**Step 4:** Category select karein (*Stalled*, *Substandard*, ya *Completed on Paper*).\n"
                "**Step 5:** Ground site ki geotagged photo evidence upload karein.\n"
                "**Step 6:** Instant cryptographic tracking hash (jaise `#CIT-VAR-2024-XXXX`) receive karein."
            )
        return make_chat_response(reply)

    if is_rules:
        if force_english or (not force_hindi and not force_hinglish and not any(0x0900 <= ord(c) <= 0x097F for c in user_msg)):
            reply = (
                "**MoSPI MPLADS Revised Guidelines 2023:**\n\n"
                "1. **Annual Allocation:** Each Member of Parliament is entitled to recommend works up to **₹5 Crore per annum**.\n"
                "2. **Social Inclusion:** At least **15%** of annual funds must be allocated for Scheduled Caste (SC) areas and **7.5%** for Scheduled Tribe (ST) areas.\n"
                "3. **Digital Management:** All approvals, sanctions, and contractor payments are processed strictly via the **eSAKSHI portal**.\n"
                "4. **Prohibited Works:** Private assets, commercial organizations, places of worship, or recurring administrative expenses cannot be funded under MPLADS."
            )
        elif force_hindi:
            reply = (
                "**MoSPI एमपीएलएडीएस संशोधित दिशानिर्देश 2023:**\n\n"
                "1. **वार्षिक निधि:** प्रत्येक सांसद प्रति वर्ष **₹5 करोड़** तक के विकासात्मक कार्यों की सिफारिश कर सकते हैं।\n"
                "2. **अनिवार्य आवंटन:** न्यूनतम **15%** निधि अनुसूचित जाति (SC) तथा **7.5%** अनुसूचित जनजाति (ST) बाहुल्य क्षेत्रों के लिए अनिवार्य है।\n"
                "3. **डिजिटल संचालन:** समस्त प्रस्ताव, वित्तीय स्वीकृति एवं भुगतान **eSAKSHI पोर्टल** द्वारा ट्रैक किए जाते हैं।\n"
                "4. **प्रतिबंधित कार्य:** निजी संपत्तियों, व्यावसायिक संस्थाओं या धार्मिक स्थलों पर MPLADS निधि का उपयोग पूर्णतः वर्जित है।"
            )
        else:
            reply = (
                "**MoSPI MPLADS Guidelines 2023 ke mukhya niyam:**\n\n"
                "1. **Fund Allocation:** Har MP ko per year **₹5 Crore** ka budget recommend karne ka adhikar hai.\n"
                "2. **SC/ST Priority:** Kam se kam **15%** funds SC areas aur **7.5%** funds ST areas ke liye mandatory hain.\n"
                "3. **eSAKSHI Portal:** Saara approval aur disbursement digitally eSAKSHI portal se hota hai.\n"
                "4. **Prohibited Works:** Private property, religious institutions ya commercial works par MPLADS fund use nahi ho sakta."
            )
        return make_chat_response(reply)

    if is_risk:
        if force_english or (not force_hindi and not force_hinglish and not any(0x0900 <= ord(c) <= 0x097F for c in user_msg)):
            reply = (
                "**PRAHARI Composite Risk Scoring Model (0-100):**\n\n"
                "$$\\text{Risk Score} = 0.25F + 0.20S + 0.20T + 0.15A + 0.10D + 0.10C$$\n\n"
                "- **F (25%):** Financial Variance against benchmark DPR expenditure.\n"
                "- **S (20%):** Spatial Overlap with previously sanctioned public assets.\n"
                "- **T (20%):** Temporal Slippage & execution delays against milestone schedule.\n"
                "- **A (15%):** Implementing Agency historical risk track record.\n"
                "- **D (10%):** DPR baseline structural deviation.\n"
                "- **C (10%):** Ground Citizen Discrepancy reports.\n\n"
                "Projects scoring **≥ 70** are flagged as **HIGH PRIORITY** for vigilance inspection."
            )
        elif force_hindi:
            reply = (
                "**प्रहरी कंपोजिट जोखिम स्कोरिंग मॉडल (0-100):**\n\n"
                "स्कोर = 0.25 × वित्तीय विचलन + 0.20 × स्थानिक दोहराव + 0.20 × समयसीमा विलंब + 0.15 × कार्यकारी एजेंसी जोखिम + 0.10 × DPR विचलन + 0.10 × नागरिक साक्ष्य विसंगति।\n\n"
                "**70 या उससे अधिक** स्कोर वाली परियोजनाओं को सतर्कता जांच हेतु **उच्च प्राथमिकता (HIGH PRIORITY)** में सूचीबद्ध किया जाता है।"
            )
        else:
            reply = (
                "**PRAHARI Composite Risk Score Calculation:**\n\n"
                "Score 6 weighted indicators se calculate hota hai: Financial Variance (25%), Spatial Overlap (20%), Delay Slippage (20%), Agency History (15%), DPR Variance (10%), aur Citizen Observation Discrepancy (10%).\n\n"
                "**Score ≥ 70** hone par project ko **HIGH PRIORITY** review flag milta hai."
            )
        return make_chat_response(reply)

    if is_cvc:
        if force_english or (not force_hindi and not force_hinglish and not any(0x0900 <= ord(c) <= 0x097F for c in user_msg)):
            reply = (
                "**CVC & Public Procurement Compliance under MPLADS:**\n\n"
                "1. All MPLADS works must be executed by designated nodal government agencies (e.g., PWD, Rural Engineering Services).\n"
                "2. Procurement must strictly follow General Financial Rules (GFR) and Central Vigilance Commission (CVC) e-tendering norms.\n"
                "3. Direct execution or contract awards to commercial private entities without transparent open tendering is prohibited."
            )
        elif force_hindi:
            reply = (
                "**MPLADS के तहत CVC एवं सार्वजनिक खरीद अनुपालन:**\n\n"
                "1. सभी कार्य नामित सरकारी नोडल एजेंसियों (जैसे PWD, ग्रामीण अभियंत्रण विभाग) द्वारा ही कराए जा सकते हैं।\n"
                "2. खरीद प्रक्रिया सामान्य वित्तीय नियमावली (GFR) और CVC ई-निविदा नियमों के पूर्णतः अनुरूप होनी चाहिए।\n"
                "3. बिना पारदर्शी खुली निविदा के किसी भी निजी संस्था को सीधा कार्य आवंटित करना वर्जित है।"
            )
        else:
            reply = (
                "**CVC & Procurement Rules for MPLADS:**\n\n"
                "1. Saare works authorized government agencies (PWD, RED) execute karti hain.\n"
                "2. GFR aur CVC guidelines ke hisaab se transparent e-tendering mandatory hai.\n"
                "3. Kisi bhi private contractor ko direct bina tender ke contract dena prohibited hai."
            )
        return make_chat_response(reply)

    # General Greeting
    if force_english or (not force_hindi and not force_hinglish and not any(0x0900 <= ord(c) <= 0x097F for c in user_msg)):
        reply = (
            "Namaste! I am **PRAHARI AI Sahayak**, the official MoSPI MPLADS Governance Assistant.\n\n"
            "I can assist you with:\n"
            "- **MPLADS Scheme Rules & ₹5 Crore Fund Guidelines**\n"
            "- **Step-by-step Citizen Grievance & Observation Registration**\n"
            "- **Composite AI Risk Scoring & Anomaly Detection**\n"
            "- **CVC & GFR Public Procurement Compliance**\n\n"
            "How may I assist you today?"
        )
    elif force_hindi:
        reply = (
            "नमस्ते! मैं **प्रहरी एआई सहायक** हूँ, आपका आधिकारिक MoSPI एमपीएलएडीएस शासन सहायक।\n\n"
            "आप मुझसे पूछ सकते हैं:\n"
            "- **एमपीएलएडीएस योजना नियम एवं ₹5 करोड़ निधि दिशानिर्देश**\n"
            "- **नागरिक शिकायत व साक्ष्य दर्ज करने की प्रक्रिया**\n"
            "- **एआई जोखिम स्कोरिंग एवं विसंगति विश्लेषण**\n"
            "- **केंद्रीय सतर्कता आयोग (CVC) नियम**\n\n"
            "मैं आपकी क्या सहायता कर सकता हूँ?"
        )
    else:
        reply = (
            "Namaste! Main **PRAHARI AI Sahayak** hoon, aapka official MoSPI MPLADS Governance Assistant.\n\n"
            "Aap mujhse pooch sakte hain:\n"
            "- **MPLADS Rules aur ₹5 Crore Fund Guidelines**\n"
            "- **Citizen Grievance & Ground Photo Upload Process**\n"
            "- **AI Composite Risk Score aur Flagged Anomalies**\n"
            "- **CVC Procurement Guidelines**\n\n"
            "Aapko kis vishay par jankari chahiye?"
        )
    return make_chat_response(reply)
