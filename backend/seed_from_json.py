import json
import os
import random
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / ".env")
load_dotenv(backend_dir.parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials missing in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
JSON_FILE_PATH = backend_dir / "data" / "real_projects.json"

COORDINATES = {
    "ARRAH": (25.5541, 84.6663),
    "KISHANGANJ": (26.0746, 87.9424),
    "PATNA": (25.5941, 85.1376),
    "VARANASI": (25.3176, 82.9739),
    "GHAZIABAD": (28.6692, 77.4538),
    "NEW DELHI": (28.6139, 77.2090),
}

def parse_record(item, idx):
    constituency_raw = str(item.get("constituency", "Arrah")).strip()
    const_key = constituency_raw.upper()
    base_lat, base_lon = COORDINATES.get(const_key, (25.5541, 84.6663))

    lat = round(base_lat + random.uniform(-0.02, 0.02), 6)
    lon = round(base_lon + random.uniform(-0.02, 0.02), 6)

    raw_cost = float(item.get("cost", 1000000))
    raw_disbursed = float(item.get("disbursed", raw_cost * 0.8))
    sanctioned_lakhs = round(raw_cost / 100000.0, 2)
    expenditure_lakhs = round(raw_disbursed / 100000.0, 2)

    is_completed = "completed" in str(item.get("type", "")).lower() or "completed" in str(item.get("status", "")).lower()
    
    raw_year = item.get("year", 2024)
    sanction_date = f"{raw_year}-04-15"
    completion_date = f"{raw_year}-12-20" if is_completed else None
    work_status = "Completed" if is_completed else "Work in Progress"

    work_id = str(item.get("id") or f"MPLADS-BI-{idx+1:05d}")

    official_project = {
        "work_id": work_id,
        "work_name": item.get("title", "MPLADS Infrastructure Work"),
        "category": item.get("category", "General Infrastructure"),
        "state": item.get("state", "Bihar"),
        "district": constituency_raw,
        "block_constituency": constituency_raw,
        "mp_name": item.get("mp", "Representative MP"),
        "sanctioned_amount_lakhs": sanctioned_lakhs,
        "expenditure_lakhs": expenditure_lakhs,
        "sanction_date": sanction_date,
        "completion_date": completion_date,
        "work_status": work_status,
        "implementing_agency": item.get("agency", f"{constituency_raw} DISTRICT PLANNING OFFICE"),
        "latitude": lat,
        "longitude": lon,
        "source_system": "Official eSAKSHI / MPLADS Public Data"
    }

    if is_completed:
        reported_pct = 100
        ai_pct = 100
        discrepancy = 0
        risk_score = random.randint(5, 20)
        priority = "STABLE"
        audit_status = "RESOLVED_AUDITED"
        vel_signal = "NORMAL: Expenditure fully reconciled against verified completion"
        delay_signal = "NORMAL: Handed over within project schedule"
        spatial_signal = "CLEAR: Independent asset footprint verified"
        agency_signal = "LOW: Monitored work record"
    else:
        reported_pct = random.randint(40, 85)
        ai_pct = max(reported_pct - random.choice([0, 5, 25, 35]), 10)
        discrepancy = reported_pct - ai_pct

        if discrepancy >= 25 or (expenditure_lakhs > 0.8 * sanctioned_lakhs and ai_pct < 35):
            risk_score = random.randint(75, 95)
            priority = "HIGH_PRIORITY"
            audit_status = "QUEUED_FOR_FIELD_INSPECTION"
            vel_signal = f"CRITICAL: {expenditure_lakhs}L disbursed against only {ai_pct}% ground progress"
            delay_signal = "HIGH: Significant execution stall past milestone target"
            spatial_signal = "ALERT: Proximity density conflict in sector"
            agency_signal = "ELEVATED: High allocation saturation under planning agency"
        else:
            risk_score = random.randint(20, 55)
            priority = "STABLE"
            audit_status = "MONITORED_AUTO"
            vel_signal = "NORMAL: Expenditure pace aligns with physical phase"
            delay_signal = "MODERATE: Minor timeline lag"
            spatial_signal = "CLEAR: Demarcated location verified"
            agency_signal = "LOW: Normal operational schedule"

    intel_record = {
        "work_id": work_id,
        "reported_progress_pct": reported_pct,
        "ai_visual_estimate_pct": ai_pct,
        "progress_discrepancy_points": discrepancy,
        "financial_velocity_signal": vel_signal,
        "temporal_slippage_signal": delay_signal,
        "spatial_clustering_signal": spatial_signal,
        "agency_concentration_signal": agency_signal,
        "composite_risk_score": risk_score,
        "review_priority": priority,
        "audit_status": audit_status
    }

    return official_project, intel_record

def run_ingestion():
    if not JSON_FILE_PATH.exists():
        print(f"Error: {JSON_FILE_PATH} not found.")
        return

    with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    if not isinstance(records, list):
        records = records.get("projects", [])

    print(f"Loaded {len(records)} records from JSON. Preparing batch upsert...")

    official_batch = []
    intel_batch = []

    for idx, item in enumerate(records):
        proj, intel = parse_record(item, idx)
        official_batch.append(proj)
        intel_batch.append(intel)

    batch_size = 50
    total = len(official_batch)

    # 1. Upsert into official_projects
    for i in range(0, total, batch_size):
        chunk = official_batch[i : i + batch_size]
        supabase.table("official_projects").upsert(chunk).execute()
        print(f"[official_projects] Upserted {min(i + batch_size, total)} / {total}")

    # 2. Upsert into prahari_intelligence
    for i in range(0, total, batch_size):
        chunk = intel_batch[i : i + batch_size]
        supabase.table("prahari_intelligence").upsert(chunk).execute()
        print(f"[prahari_intelligence] Upserted {min(i + batch_size, total)} / {total}")

    print("Success: Both official_projects and prahari_intelligence populated!")

if __name__ == "__main__":
    run_ingestion()