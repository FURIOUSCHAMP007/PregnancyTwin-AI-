"""
backend/growth/percentile/calculator.py
MODEL 7: Growth Percentile and Z-Score Calculation Engine
"""

import math
from typing import Dict, Any, Optional
from .reference import (
    get_hadlock_1991_normative,
    get_intergrowth_21st_normative,
    get_who_fetal_growth_normative
)

def normal_cdf(z: float) -> float:
    """Standard normal cumulative distribution function."""
    return (1.0 + math.erf(z / math.sqrt(2.0))) / 2.0

def compute_growth_percentile(
    efw_g: Optional[float],
    ga_weeks: float,
    reference_standard: str = "HADLOCK_1991"
) -> Dict[str, Any]:
    """
    Computes exact percentile and Z-score for a given EFW and Gestational Age.
    """
    if efw_g is None or efw_g <= 0:
        return {
            "percentile": None,
            "z_score": None,
            "reference_standard": reference_standard,
            "reference_mean_g": None,
            "reference_sd_g": None,
            "centile_category": "UNKNOWN"
        }
        
    ga = max(14.0, min(42.0, ga_weeks))
    
    if reference_standard == "INTERGROWTH_21ST":
        mean_g, sd_g = get_intergrowth_21st_normative(ga)
    elif reference_standard == "WHO_FETAL_GROWTH":
        mean_g, sd_g = get_who_fetal_growth_normative(ga)
    else:
        # Default Hadlock 1991 standard
        reference_standard = "HADLOCK_1991"
        mean_g, sd_g = get_hadlock_1991_normative(ga)
        
    z_score = (efw_g - mean_g) / max(sd_g, 1.0)
    percentile_raw = normal_cdf(z_score) * 100.0
    percentile = max(0.1, min(99.9, round(percentile_raw, 1)))
    
    # Categorization
    if percentile < 10.0:
        category = "FGR_SUSPECTED" if percentile < 5.0 else "SMALL_FOR_GESTATIONAL_AGE"
    elif percentile > 90.0:
        category = "LARGE_FOR_GESTATIONAL_AGE"
    else:
        category = "APPROPRIATE_FOR_GESTATIONAL_AGE"
        
    # Standard reference centile weights at this GA
    p5_g = round(mean_g - 1.645 * sd_g, 1)
    p10_g = round(mean_g - 1.282 * sd_g, 1)
    p50_g = round(mean_g, 1)
    p90_g = round(mean_g + 1.282 * sd_g, 1)
    p95_g = round(mean_g + 1.645 * sd_g, 1)
    
    return {
        "percentile": percentile,
        "z_score": round(z_score, 2),
        "reference_standard": reference_standard,
        "reference_mean_g": round(mean_g, 1),
        "reference_sd_g": round(sd_g, 1),
        "centile_category": category,
        "reference_5th_g": p5_g,
        "reference_10th_g": p10_g,
        "reference_50th_g": p50_g,
        "reference_90th_g": p90_g,
        "reference_95th_g": p95_g
    }
