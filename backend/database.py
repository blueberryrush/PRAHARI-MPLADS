"""
PRAHARI MPLADS — SQLite Database Layer for Authentication & Prototype Accounts
Manages the `officers` table and pre-seeds prototype authority & citizen accounts for SIH evaluation.
"""
import sqlite3
import os
import hashlib
from typing import Optional, Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "prahari_auth.db")


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with consistent salt."""
    salt = "prahari_sih_2026_salt"
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()


def get_db_connection():
    """Create and return a database connection with dict-like row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create schema and pre-seed accounts if not already present."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS officers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        designation TEXT NOT NULL,
        department TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'Uttar Pradesh',
        district TEXT NOT NULL DEFAULT 'Varanasi',
        portal_access TEXT NOT NULL, -- 'COMMAND_CENTER', 'INVESTIGATION_CENTER', or 'CITIZEN'
        is_first_login INTEGER NOT NULL DEFAULT 0,
        govt_id_number TEXT,
        id_proof_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

    # Pre-seeded prototype accounts (all active with direct instant access)
    seed_officers = [
        {
            "email": "dm.varanasi@prahari.gov.in",
            "password": "Password@123",
            "name": "Rajesh Kumar Sharma, IAS",
            "designation": "District Magistrate",
            "department": "District Administration",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "portal_access": "COMMAND_CENTER",
            "is_first_login": 0,
            "govt_id_number": "IAS-UP-2012-0891",
            "id_proof_url": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
        },
        {
            "email": "cdo.varanasi@prahari.gov.in",
            "password": "TempPassword@123",
            "name": "Dr. Alok Verma, IAS",
            "designation": "Chief Development Officer",
            "department": "Rural Development",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "portal_access": "COMMAND_CENTER",
            "is_first_login": 0,
            "govt_id_number": "IAS-UP-2016-0492",
            "id_proof_url": None,
        },
        {
            "email": "ae.priyasingh@prahari.gov.in",
            "password": "Field@123",
            "name": "Er. Priya Singh",
            "designation": "Assistant Engineer",
            "department": "Rural Engineering Services (RES)",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "portal_access": "INVESTIGATION_CENTER",
            "is_first_login": 0,
            "govt_id_number": "UP-RED-2024-881",
            "id_proof_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        },
        {
            "email": "sdm.pindra@prahari.gov.in",
            "password": "TempField@123",
            "name": "Vikramaditya Rao, PCS",
            "designation": "Sub-Divisional Magistrate",
            "department": "Sub-Divisional Revenue & Works",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "portal_access": "INVESTIGATION_CENTER",
            "is_first_login": 0,
            "govt_id_number": "PCS-UP-2018-9122",
            "id_proof_url": None,
        },
        {
            "email": "citizen@prahari.gov.in",
            "password": "Citizen@123",
            "name": "Rajesh Kumar (Citizen)",
            "designation": "Citizen Observer",
            "department": "Public Vigilance & Community Oversight",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "portal_access": "CITIZEN",
            "is_first_login": 0,
            "govt_id_number": "EPIC-VNS-88491",
            "id_proof_url": None,
        },
        {
            "email": "citizen@demo.com",
            "password": "demo123",
            "name": "Rajesh Kumar (Citizen)",
            "designation": "Citizen Observer",
            "department": "Public Vigilance & Community Oversight",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "portal_access": "CITIZEN",
            "is_first_login": 0,
            "govt_id_number": "EPIC-VNS-88491",
            "id_proof_url": None,
        },
    ]

    for off in seed_officers:
        cursor.execute("SELECT id FROM officers WHERE email = ?", (off["email"],))
        existing = cursor.fetchone()
        pwd_hash = hash_password(off["password"])
        if not existing:
            cursor.execute("""
            INSERT INTO officers (
                email, password_hash, name, designation, department, state, district,
                portal_access, is_first_login, govt_id_number, id_proof_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                off["email"],
                pwd_hash,
                off["name"],
                off["designation"],
                off["department"],
                off["state"],
                off["district"],
                off["portal_access"],
                off["is_first_login"],
                off["govt_id_number"],
                off["id_proof_url"],
            ))
        else:
            # Update to ensure active status
            cursor.execute("""
            UPDATE officers SET is_first_login = 0, password_hash = ? WHERE email = ?
            """, (pwd_hash, off["email"]))

    conn.commit()
    conn.close()


def get_officer_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Fetch officer record by email."""
    if not email:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM officers WHERE LOWER(email) = ?", (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_officer_by_id(officer_id: int) -> Optional[Dict[str, Any]]:
    """Fetch officer record by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM officers WHERE id = ?", (officer_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_officer_onboarding(officer_id: int, govt_id_number: str, id_proof_url: Optional[str], new_password: str) -> bool:
    """Update officer record upon completing onboarding."""
    conn = get_db_connection()
    cursor = conn.cursor()
    new_hash = hash_password(new_password)
    cursor.execute("""
    UPDATE officers
    SET govt_id_number = ?,
        id_proof_url = ?,
        password_hash = ?,
        is_first_login = 0
    WHERE id = ?
    """, (govt_id_number.strip(), id_proof_url, new_hash, officer_id))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0



# Initialize DB on load
init_db()
