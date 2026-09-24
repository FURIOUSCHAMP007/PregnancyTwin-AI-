# ultrasound/measurement/validation.py
# MODEL 6 — BIOMETRY MEASUREMENT ENGINE: Validation, QC, & Plausibility Audits
# Enforces prototype reference ranges, Hadlock Z-scores, and HC/AC ratio checks.

class BiometryValidator:
    """
    Validates physical biometrics against master prototype reference ranges
    and computes gestational age Z-scores.
    
    Prototype Engineering Reference Ranges:
      - HC: ~150 – 380 mm
      - AC: ~130 – 400 mm
      - FL: ~25 – 80 mm
      - BPD: ~35 – 105 mm
      - OFD: ~50 – 130 mm
    """
    
    REFERENCE_BOUNDS = {
        "HC_mm": (140.0, 390.0),
        "AC_mm": (120.0, 410.0),
        "FL_mm": (20.0, 85.0),
        "BPD_mm": (30.0, 110.0),
        "OFD_mm": (45.0, 135.0)
    }
    
    @staticmethod
    def validate_measurements(biometrics, gestational_age_weeks=32.0):
        ga = float(gestational_age_weeks) if gestational_age_weeks else 32.0
        audit_results = {}
        flags = []
        
        hc = biometrics.get("HC_mm")
        ac = biometrics.get("AC_mm")
        fl = biometrics.get("FL_mm")
        bpd = biometrics.get("BPD_mm")
        ofd = biometrics.get("OFD_mm")
        
        # 1. Prototype Range Audits
        for key, (min_v, max_v) in BiometryValidator.REFERENCE_BOUNDS.items():
            val = biometrics.get(key)
            if val is not None:
                in_range = (min_v <= val <= max_v)
                audit_results[f"{key}_in_range"] = in_range
                if not in_range:
                    flags.append(f"{key} ({val} mm) outside prototype baseline bounds [{min_v}, {max_v}] mm")
                    
        # 2. Gestational Age Reference Z-scores (Hadlock Linearized)
        z_scores = {}
        
        if hc is not None:
            expected_hc = 7.8 * ga + 46.0
            z_hc = round((hc - expected_hc) / 9.5, 2)
            z_scores["HC_z"] = z_hc
            if abs(z_hc) > 2.5:
                flags.append(f"HC Z-score ({z_hc}) exceeds ±2.5 SD for GA {ga}w")
                
        if ac is not None:
            expected_ac = 8.5 * ga + 10.0
            z_ac = round((ac - expected_ac) / 11.0, 2)
            z_scores["AC_z"] = z_ac
            if abs(z_ac) > 2.5:
                flags.append(f"AC Z-score ({z_ac}) exceeds ±2.5 SD for GA {ga}w")
                
        if fl is not None:
            expected_fl = 1.98 * ga - 1.5
            z_fl = round((fl - expected_fl) / 2.8, 2)
            z_scores["FL_z"] = z_fl
            if abs(z_fl) > 2.5:
                flags.append(f"FL Z-score ({z_fl}) exceeds ±2.5 SD for GA {ga}w")
                
        # 3. HC / AC Ratio Consistency Check (Normally ~1.00 – 1.25, declines toward term)
        hc_ac_ratio = None
        if hc and ac and ac > 0:
            hc_ac_ratio = round(hc / ac, 2)
            if hc_ac_ratio < 0.85 or hc_ac_ratio > 1.40:
                flags.append(f"HC/AC ratio ({hc_ac_ratio}) abnormal (expected 0.95 - 1.30 for 3rd trimester)")
                
        # Overall Measurement Status
        if len(flags) == 0:
            qc_status = "PASS"
            review_recommendation = "READY_FOR_COMMISSION"
        elif any("exceeds ±2.5" in f for f in flags):
            qc_status = "REVIEW_REQUIRED"
            review_recommendation = "CLINICIAN_REVIEW_ADVISED"
        else:
            qc_status = "PASS_WITH_WARNING"
            review_recommendation = "NORMAL_MONITORING"
            
        return {
            "qc_status": qc_status,
            "review_recommendation": review_recommendation,
            "z_scores": z_scores,
            "hc_ac_ratio": hc_ac_ratio,
            "plausibility_flags": flags,
            "is_plausible": len(flags) == 0
        }
