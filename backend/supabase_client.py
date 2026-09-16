"""
PRAHARI MPLADS — Supabase Cloud Database Client
Handles PostgREST communication with Supabase for persistent civic intelligence.
Optimized with persistent HTTP connection pooling, parallel execution, and in-memory caching.
"""
import os
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import threading

from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://alimjhdhmkoyyaukyhzf.supabase.co").rstrip("/")
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsaW1qaGRobWtveXlhdWt5aHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzU5MTMsImV4cCI6MjEwNDgxMTkxM30.-VMyWvY0EItnc3-S3Ws43fH-AqcIlgVdDtlt-MhaveA"
)

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# ─── Persistent Session with Connection Pooling ──────────────────────────────
_session = requests.Session()
_session.headers.update(HEADERS)
_retry_strategy = Retry(
    total=2,
    backoff_factor=0.3,
    status_forcelist=[429, 500, 502, 503, 504],
)
_adapter = HTTPAdapter(pool_connections=15, pool_maxsize=30, max_retries=_retry_strategy)
_session.mount("https://", _adapter)
_session.mount("http://", _adapter)

# ─── In-Memory TTL Cache ───────────────────────────────────────────────────────
_cache_lock = threading.Lock()
_CACHE: Dict[str, Any] = {}
_CACHE_EXPIRY: Dict[str, float] = {}
CACHE_TTL_SECONDS = 30.0


def _get_from_cache(key: str) -> Optional[Any]:
    with _cache_lock:
        if key in _CACHE and time.time() < _CACHE_EXPIRY.get(key, 0):
            return _CACHE[key]
    return None


def _set_cache(key: str, data: Any, ttl: float = CACHE_TTL_SECONDS):
    with _cache_lock:
        _CACHE[key] = data
        _CACHE_EXPIRY[key] = time.time() + ttl


def clear_cache():
    with _cache_lock:
        _CACHE.clear()
        _CACHE_EXPIRY.clear()


# ─── HTTP Primitives ──────────────────────────────────────────────────────────

def _get(path: str, params: Optional[dict] = None, timeout: float = 6.0) -> List[dict]:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    resp = _session.get(url, params=params or {}, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def _post(path: str, data: Any, prefer: str = "return=representation", timeout: float = 8.0) -> List[dict]:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {**HEADERS, "Prefer": prefer}
    resp = _session.post(url, headers=headers, json=data, timeout=timeout)
    resp.raise_for_status()
    clear_cache()
    return resp.json() if "return=representation" in prefer else []


def _patch(path: str, params: dict, data: dict, prefer: str = "return=representation", timeout: float = 8.0) -> List[dict]:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {**HEADERS, "Prefer": prefer}
    resp = _session.patch(url, headers=headers, params=params, json=data, timeout=timeout)
    resp.raise_for_status()
    clear_cache()
    return resp.json() if "return=representation" in prefer else []


def _get_all_paginated(path: str, page_size: int = 1000, timeout: float = 8.0) -> List[dict]:
    """Retrieve all records for a table by paginating through PostgREST limit/offset."""
    all_records: List[dict] = []
    offset = 0
    clean_path = path.split("?")[0]
    base_query = path.split("?")[1] if "?" in path else "select=*"

    while True:
        url = f"{SUPABASE_URL}/rest/v1/{clean_path}?{base_query}&limit={page_size}&offset={offset}"
        resp = _session.get(url, timeout=timeout)
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        all_records.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    return all_records


def get_official_projects() -> List[dict]:
    """Retrieve all official projects from Supabase (all pages)."""
    return _get_all_paginated("official_projects?select=*")


def get_prahari_intelligence() -> List[dict]:
    """Retrieve all computed intelligence metrics from Supabase (all pages)."""
    return _get_all_paginated("prahari_intelligence?select=*")


def get_all_joined_projects(
    district: Optional[str] = None,
    state: Optional[str] = None,
    risk_tier: Optional[str] = None,
    category: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> List[dict]:
    """
    Fetch official_projects and join with prahari_intelligence on work_id.
    Uses concurrency and in-memory TTL caching for ultra-low latency response times.
    """
    cache_key = "all_joined_projects"
    cached = _get_from_cache(cache_key)

    if cached is None:
        # Fetch both datasets concurrently using thread pool
        with ThreadPoolExecutor(max_workers=2) as executor:
            fut_official = executor.submit(get_official_projects)
            fut_intel = executor.submit(get_prahari_intelligence)

            official_list = fut_official.result()
            intelligence_list = fut_intel.result()

        intel_map = {item["work_id"]: item for item in intelligence_list if "work_id" in item}

        joined = []
        for proj in official_list:
            wid = proj.get("work_id")
            intel = intel_map.get(wid, {})

            joined.append({
                "work_id": wid,
                "official_record": proj,
                "prahari_intelligence": intel,
                # Flattened properties for convenience
                "name": proj.get("work_name"),
                "district": proj.get("district"),
                "state": proj.get("state"),
                "block_constituency": proj.get("block_constituency"),
                "mp_name": proj.get("mp_name"),
                "category": proj.get("category"),
                "sanctioned_amount_lakhs": proj.get("sanctioned_amount_lakhs"),
                "expenditure_lakhs": proj.get("expenditure_lakhs"),
                "work_status": proj.get("work_status"),
                "implementing_agency": proj.get("implementing_agency"),
                "latitude": proj.get("latitude"),
                "longitude": proj.get("longitude"),
                "reported_progress_pct": intel.get("reported_progress_pct", 0),
                "ai_visual_estimate_pct": intel.get("ai_visual_estimate_pct", 0),
                "progress_discrepancy_points": intel.get("progress_discrepancy_points", 0),
                "composite_risk_score": intel.get("composite_risk_score", 0),
                "review_priority": intel.get("review_priority", "MONITORED_AUTO"),
                "audit_status": intel.get("audit_status", "MONITORED_AUTO"),
                "financial_velocity_signal": intel.get("financial_velocity_signal"),
                "temporal_slippage_signal": intel.get("temporal_slippage_signal"),
                "spatial_clustering_signal": intel.get("spatial_clustering_signal"),
                "agency_concentration_signal": intel.get("agency_concentration_signal"),
            })

        cached = joined
        _set_cache(cache_key, cached)

    # Filter cached copy
    results = cached
    if district:
        results = [p for p in results if (p.get("district") or "").lower() == district.lower()]
    if state:
        results = [p for p in results if (p.get("state") or "").lower() == state.lower()]
    if risk_tier:
        results = [p for p in results if risk_tier.lower() in (p.get("review_priority") or "").lower()]
    if category:
        results = [p for p in results if (p.get("category") or "").lower() == category.lower()]

    if offset is not None:
        results = results[offset:]
    if limit is not None:
        results = results[:limit]

    return results


def get_project_by_id(work_id: str) -> Optional[dict]:
    """Retrieve full project details, intelligence, and matching citizen observations in parallel."""
    cache_key = f"project_detail_{work_id}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    with ThreadPoolExecutor(max_workers=3) as executor:
        f_proj = executor.submit(_get, "official_projects", {"work_id": f"eq.{work_id}"})
        f_intel = executor.submit(_get, "prahari_intelligence", {"work_id": f"eq.{work_id}"})
        f_obs = executor.submit(_get, "citizen_observations", {"work_id": f"eq.{work_id}", "order": "submitted_at.desc"})

        projects = f_proj.result()
        if not projects:
            return None

        official = projects[0]
        try:
            intel_records = f_intel.result()
            intel = intel_records[0] if intel_records else {}
        except Exception:
            intel = {}

        try:
            observations = f_obs.result()
        except Exception:
            observations = []

    res = {
        "work_id": work_id,
        "official_record": official,
        "prahari_intelligence": intel,
        "citizen_observations": observations,
    }
    _set_cache(cache_key, res, ttl=20.0)
    return res


def add_citizen_observation(
    work_id: str,
    ground_status: str,
    observation_text: str,
    evidence_photo_url: Optional[str] = None,
    user_latitude: Optional[float] = None,
    user_longitude: Optional[float] = None,
) -> dict:
    """Insert a citizen observation into Supabase."""
    data = {
        "work_id": work_id,
        "ground_status": ground_status,
        "observation_text": observation_text,
        "evidence_photo_url": evidence_photo_url,
        "user_latitude": user_latitude,
        "user_longitude": user_longitude,
    }
    inserted = _post("citizen_observations", data)
    clear_cache()
    return inserted[0] if inserted else data


def update_intelligence(work_id: str, updates: dict) -> dict:
    """Update fields in prahari_intelligence for a work_id."""
    updates["computed_at"] = datetime.now(timezone.utc).isoformat()
    result = _patch("prahari_intelligence", {"work_id": f"eq.{work_id}"}, updates)
    clear_cache()
    return result[0] if result else updates


def update_audit_status(work_id: str, audit_status: str) -> dict:
    """Update audit_status in prahari_intelligence."""
    return update_intelligence(work_id, {"audit_status": audit_status})


def get_state_summaries() -> Dict[str, dict]:
    """
    Aggregate project statistics by state:
    - project_count
    - average_risk_score
    - risk_tier ('HIGH RISK', 'MEDIUM RISK', 'LOW RISK')
    - total_sanctioned_lakhs & formatted string (₹ Cr)
    - anomaly_count (flagged cases)
    """
    cache_key = "state_summaries_cache"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    projects = get_all_joined_projects()
    raw_summaries: Dict[str, dict] = {}

    for p in projects:
        st = (p.get("state") or "").strip()
        if not st:
            continue
        st_key = st.lower()
        if st_key not in raw_summaries:
            raw_summaries[st_key] = {
                "state": st,
                "project_count": 0,
                "total_sanctioned_lakhs": 0.0,
                "total_expenditure_lakhs": 0.0,
                "total_risk_score": 0,
                "anomaly_count": 0,
                "high_risk_count": 0,
                "medium_risk_count": 0,
                "low_risk_count": 0,
            }

        entry = raw_summaries[st_key]
        entry["project_count"] += 1
        entry["total_sanctioned_lakhs"] += float(p.get("sanctioned_amount_lakhs") or 0)
        entry["total_expenditure_lakhs"] += float(p.get("expenditure_lakhs") or 0)
        score = int(p.get("composite_risk_score") or 0)
        entry["total_risk_score"] += score

        if score >= 60 or (p.get("progress_discrepancy_points") or 0) > 0 or "HIGH" in (p.get("review_priority") or ""):
            entry["anomaly_count"] += 1
            entry["high_risk_count"] += 1
        elif score >= 40:
            entry["medium_risk_count"] += 1
        else:
            entry["low_risk_count"] += 1

    final_result: Dict[str, dict] = {}
    for st_key, data in raw_summaries.items():
        count = data["project_count"]
        avg_score = round(data["total_risk_score"] / count, 1) if count > 0 else 0
        risk_tier = "HIGH RISK" if avg_score >= 60 else "MEDIUM RISK" if avg_score >= 40 else "LOW RISK"
        sanctioned_cr = round(data["total_sanctioned_lakhs"] / 100, 2)
        sanctioned_formatted = f"₹{sanctioned_cr:.1f} Cr" if sanctioned_cr >= 1 else f"₹{data['total_sanctioned_lakhs']:.1f} L"

        final_result[st_key] = {
            "state": data["state"],
            "project_count": count,
            "average_risk_score": avg_score,
            "risk_tier": risk_tier,
            "risk_level": "high" if avg_score >= 60 else "medium" if avg_score >= 40 else "low",
            "total_sanctioned_lakhs": round(data["total_sanctioned_lakhs"], 2),
            "sanctioned_cr": sanctioned_cr,
            "sanctioned_formatted": sanctioned_formatted,
            "anomaly_count": data["anomaly_count"],
            "high_risk_count": data["high_risk_count"],
            "medium_risk_count": data["medium_risk_count"],
            "low_risk_count": data["low_risk_count"],
        }

    _set_cache(cache_key, final_result, ttl=60.0)
    return final_result
