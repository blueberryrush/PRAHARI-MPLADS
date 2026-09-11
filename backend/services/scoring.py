"""
PRAHARI MPLADS — Deterministic Risk Scoring Engine
Formula: Score = 0.25F + 0.20S + 0.20T + 0.15A + 0.10B + 0.10D
"""


def clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def calculate_risk_score(
    sanctioned_amount: float,
    spent_amount: float,
    physical_progress: float,          # 0-100
    approved_duration_months: int,
    elapsed_months: int,
    agency_risk_score: float,          # 0-100
    benchmark_cost_per_unit: float = 0.0,
    reported_cost_per_unit: float = 0.0,
    spatial_overlap_count: int = 0,
) -> dict:
    """
    Returns a dict with sub-scores and the composite weighted score.
    All sub-scores are 0-100. Output score is 0-100.
    """

    # ── Financial Anomaly (F): over/under-spend vs sanction ──────────────────
    if sanctioned_amount > 0:
        variance_pct = abs((spent_amount - sanctioned_amount) / sanctioned_amount * 100)
        F = clamp(variance_pct * 1.5)            # 20% overspend → 30 pts
    else:
        F = 0.0

    # ── Spatial Overlap (S): nearby duplicate works ───────────────────────────
    S = clamp(min(spatial_overlap_count * 30, 100))

    # ── Temporal Delay (T): physical vs financial progress mismatch ───────────
    if approved_duration_months > 0:
        expected_progress = (elapsed_months / approved_duration_months) * 100
        progress_gap = max(0, expected_progress - physical_progress)
        T = clamp(progress_gap * 1.2)
    else:
        T = 0.0

    # ── Agency History (A): historical risk score of implementing agency ──────
    A = clamp(agency_risk_score)

    # ── Benchmark Deviation (B): SoR unit cost comparison ────────────────────
    if benchmark_cost_per_unit > 0 and reported_cost_per_unit > 0:
        B = clamp(abs((reported_cost_per_unit - benchmark_cost_per_unit) / benchmark_cost_per_unit) * 100)
    else:
        B = 30.0  # default moderate signal when benchmark not available

    # ── Duplicate Flags (D): binary duplicate flagging ────────────────────────
    D = 100.0 if spatial_overlap_count > 0 else 0.0

    # ── Composite Score ───────────────────────────────────────────────────────
    score = (0.25 * F) + (0.20 * S) + (0.20 * T) + (0.15 * A) + (0.10 * B) + (0.10 * D)
    score = round(clamp(score), 1)

    tier = "HIGH" if score >= 70 else "MEDIUM" if score >= 50 else "LOW"

    return {
        "score": score,
        "tier": tier,
        "sub_scores": {
            "financial": round(F, 1),
            "spatial": round(S, 1),
            "temporal": round(T, 1),
            "agency": round(A, 1),
            "benchmark": round(B, 1),
            "duplicate": round(D, 1),
        },
        "weights": {
            "financial": 0.25,
            "spatial": 0.20,
            "temporal": 0.20,
            "agency": 0.15,
            "benchmark": 0.10,
            "duplicate": 0.10,
        },
        "disclaimer": "Contribution to review priority, not a statistical fraud probability.",
    }
