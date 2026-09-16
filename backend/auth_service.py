"""
PRAHARI MPLADS — Authentication & Clearance Service
Provides token signing, verification, and role-based clearance validation.
"""
import os
import json
import base64
import hmac
import hashlib
import time
from typing import Optional, Dict, Any

from database import (
    get_officer_by_email,
    get_officer_by_id,
    hash_password,
    update_officer_onboarding,
)

JWT_SECRET = os.getenv("JWT_SECRET", "prahari_sih_2026_jwt_secret_key_varanasi_mospi")


def _base64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64_url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_access_token(officer: Dict[str, Any], expires_in_seconds: int = 86400 * 7) -> str:
    """
    Generate a cryptographic HMAC-SHA256 JWT-compatible token for the officer.
    Payload includes id, email, name, role (designation), portal, state, district, department.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "id": officer["id"],
        "email": officer["email"],
        "name": officer["name"],
        "role": officer["designation"],
        "portal": officer["portal_access"],
        "state": officer.get("state", "Uttar Pradesh"),
        "district": officer.get("district", "Varanasi"),
        "department": officer.get("department", ""),
        "govt_id_number": officer.get("govt_id_number"),
        "iat": now,
        "exp": now + expires_in_seconds,
    }

    h_bytes = _base64_url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    p_bytes = _base64_url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature_data = f"{h_bytes}.{p_bytes}".encode("utf-8")
    sig = hmac.new(JWT_SECRET.encode("utf-8"), signature_data, hashlib.sha256).digest()
    sig_encoded = _base64_url_encode(sig)

    return f"{h_bytes}.{p_bytes}.{sig_encoded}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode HMAC-SHA256 JWT token."""
    if not token:
        return None
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None
        h_bytes, p_bytes, sig_received = parts
        signature_data = f"{h_bytes}.{p_bytes}".encode("utf-8")
        expected_sig = _base64_url_encode(
            hmac.new(JWT_SECRET.encode("utf-8"), signature_data, hashlib.sha256).digest()
        )
        if not hmac.compare_digest(sig_received, expected_sig):
            return None

        payload = json.loads(_base64_url_decode(p_bytes).decode("utf-8"))
        if payload.get("exp") and int(time.time()) > payload["exp"]:
            return None  # Token expired

        return payload
    except Exception:
        return None


def sanitize_officer_response(officer: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive password hash from officer dictionary before returning to client."""
    return {
        "id": officer["id"],
        "email": officer["email"],
        "name": officer["name"],
        "designation": officer["designation"],
        "department": officer["department"],
        "state": officer.get("state", "Uttar Pradesh"),
        "district": officer.get("district", "Varanasi"),
        "portal_access": officer["portal_access"],
        "is_first_login": officer.get("is_first_login", 0),
        "govt_id_number": officer.get("govt_id_number"),
        "id_proof_url": officer.get("id_proof_url"),
        "created_at": officer.get("created_at"),
    }
