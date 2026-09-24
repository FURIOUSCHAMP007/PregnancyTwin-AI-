"""
backend/maternal_context/baseline/demographics.py
MODEL 9A: Maternal Baseline Demographics Engine
Validates and extracts maternal age, gravidity, parity, and obstetric baseline variables.
"""

from typing import Dict, Any, Tuple, Optional

def process_demographics(
    maternal_age_years: Optional[float],
    gravidity: Optional[int],
    parity: Optional[int]
) -> Dict[str, Any]:
    """
    Validates and formats baseline maternal demographic parameters.
    Keeps gravidity and parity distinct without synthetic assumptions.
    """
    age_valid = maternal_age_years is not None and 12.0 <= maternal_age_years <= 58.0
    gravidity_valid = gravidity is not None and gravidity >= 1
    parity_valid = parity is not None and parity >= 0

    return {
        "maternal_age_years": round(float(maternal_age_years), 1) if age_valid else 29.0,
        "gravidity": int(gravidity) if gravidity_valid else 1,
        "parity": int(parity) if parity_valid else 0,
        "is_valid": age_valid and gravidity_valid and parity_valid
    }
