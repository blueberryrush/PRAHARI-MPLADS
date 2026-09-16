import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load env
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / ".env")
load_dotenv(backend_dir.parent / ".env")

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "https://alimjhdhmkoyyaukyhzf.supabase.co").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsaW1qaGRobWtveXlhdWt5aHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzU5MTMsImV4cCI6MjEwNDgxMTkxM30.-VMyWvY0EItnc3-S3Ws43fH-AqcIlgVdDtlt-MhaveA"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Range": "0-0",
    "Prefer": "count=exact",
}

# 1. Check real_projects.json count
json_path = backend_dir / "data" / "real_projects.json"
json_count = 0
if json_path.exists():
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        json_count = len(data) if isinstance(data, list) else len(data.get("projects", []))

print(f"=== PRAHARI SUPABASE VERIFICATION SCRIPT ===")
print(f"Supabase Endpoint: {SUPABASE_URL}")
print(f"real_projects.json Record Count: {json_count}")

# 2. Get exact row count for official_projects
try:
    r_off = requests.get(f"{SUPABASE_URL}/rest/v1/official_projects?select=work_id", headers=headers, timeout=10)
    # Content-Range header format: 0-0/4684
    content_range_off = r_off.headers.get("Content-Range", "")
    exact_count_off = content_range_off.split("/")[-1] if "/" in content_range_off else "Unknown"
    print(f"official_projects Table Exact Row Count: {exact_count_off} (Status: {r_off.status_code})")
except Exception as e:
    print(f"Error querying official_projects: {e}")

# 3. Get exact row count for prahari_intelligence
try:
    r_intel = requests.get(f"{SUPABASE_URL}/rest/v1/prahari_intelligence?select=work_id", headers=headers, timeout=10)
    content_range_intel = r_intel.headers.get("Content-Range", "")
    exact_count_intel = content_range_intel.split("/")[-1] if "/" in content_range_intel else "Unknown"
    print(f"prahari_intelligence Table Exact Row Count: {exact_count_intel} (Status: {r_intel.status_code})")
except Exception as e:
    print(f"Error querying prahari_intelligence: {e}")

# 4. Get exact row count for citizen_observations
try:
    r_obs = requests.get(f"{SUPABASE_URL}/rest/v1/citizen_observations?select=id", headers=headers, timeout=10)
    content_range_obs = r_obs.headers.get("Content-Range", "")
    exact_count_obs = content_range_obs.split("/")[-1] if "/" in content_range_obs else "Unknown"
    print(f"citizen_observations Table Exact Row Count: {exact_count_obs} (Status: {r_obs.status_code})")
except Exception as e:
    print(f"Error querying citizen_observations: {e}")

# 5. Sample record check
try:
    r_sample = requests.get(f"{SUPABASE_URL}/rest/v1/official_projects?select=work_id,work_name,state,district,sanctioned_amount_lakhs&limit=3", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }, timeout=10)
    print("\nSample records from official_projects:")
    print(json.dumps(r_sample.json(), indent=2))
except Exception as e:
    print(f"Error fetching sample: {e}")
