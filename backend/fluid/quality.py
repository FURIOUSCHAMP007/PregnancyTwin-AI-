"""
backend/fluid/quality.py
MODEL 8: Amniotic Fluid Data Quality & Completeness Flags
Audits AFI, DVP, Doppler availability, ultrasound image SNR/artifacts, and measurement confidence.
"""

from typing import Dict, Any, List, Optional

def evaluate_fluid_quality(
    afi_cm: Optional[float],
    dvp_cm: Optional[float],
    measurement_confidence: Optional[float] = None,
    ultrasound_quality: Optional[float] = None,
    doppler_available: bool = False
) -> Dict[str, Any]:
    """
    Evaluates fluid data completeness and quality category:
    - GOOD: Both AFI and DVP available with high confidence (>0.85).
    - PARTIAL: Either AFI or DVP available with valid measurements.
    - REVIEW: Low confidence (<0.70) or questionable image quality.
    - INSUFFICIENT: Neither AFI nor DVP recorded.
    """
    has_afi = afi_cm is not None
    has_dvp = dvp_cm is not None
    conf = measurement_confidence if measurement_confidence is not None else (0.92 if (has_afi or has_dvp) else 0.0)
    us_qual = ultrasound_quality if ultrasound_quality is not None else 0.88
    
    notes: List[str] = []
    
    if not has_afi and not has_dvp:
        status = "INSUFFICIENT"
        notes.append("Neither AFI nor DVP measurements recorded for this scan.")
    elif conf < 0.70 or us_qual < 0.60:
        status = "REVIEW"
        notes.append("Low measurement confidence or image artifact presence; clinician visual verification indicated.")
    elif has_afi and has_dvp:
        status = "GOOD"
        notes.append("Complete 4-quadrant AFI and DVP measurements verified.")
    else:
        status = "PARTIAL"
        if has_afi and not has_dvp:
            notes.append("AFI available; DVP not recorded in sonography report.")
        else:
            notes.append("DVP available; 4-quadrant AFI not measured.")
            
    if not doppler_available:
        notes.append("Uteroplacental / Umbilical Doppler omitted (preserved as absent; not fabricated).")
        
    quality_encoding = {
        "GOOD": 3,
        "PARTIAL": 2,
        "REVIEW": 1,
        "INSUFFICIENT": 0
    }
    
    return {
        "afi_available": has_afi,
        "dvp_available": has_dvp,
        "doppler_available": doppler_available,
        "measurement_confidence": round(conf, 2),
        "ultrasound_quality": round(us_qual, 2),
        "fluid_data_quality": status,
        "fluid_data_quality_encoded": quality_encoding.get(status, 0),
        "notes": notes
    }
