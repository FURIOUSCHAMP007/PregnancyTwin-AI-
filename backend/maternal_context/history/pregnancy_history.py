"""
backend/maternal_context/history/pregnancy_history.py
MODEL 9C: Pregnancy & Obstetric History Engine
Separates historical background from transient visit measurements without artificial synthetic score collapse.
"""

from typing import Dict, Any, Optional

def process_pregnancy_history(
    previous_fgr: Optional[bool] = False,
    previous_preterm_birth: Optional[bool] = False,
    previous_stillbirth: Optional[bool] = False,
    preeclampsia_history: Optional[bool] = False,
    chronic_hypertension: Optional[bool] = False,
    pregestational_diabetes: Optional[bool] = False,
    gestational_diabetes_history: Optional[bool] = False,
    smoking: Optional[bool] = False
) -> Dict[str, Any]:
    """
    Constructs isolated binary indicators for obstetric and medical background risk features.
    """
    fgr = bool(previous_fgr)
    ptb = bool(previous_preterm_birth)
    sb = bool(previous_stillbirth)
    pe = bool(preeclampsia_history)
    htn = bool(chronic_hypertension)
    dm = bool(pregestational_diabetes)
    gdm = bool(gestational_diabetes_history)
    smk = bool(smoking)

    total_factors = sum([fgr, ptb, sb, pe, htn, dm, gdm, smk])

    return {
        "previous_fgr": fgr,
        "previous_preterm_birth": ptb,
        "previous_stillbirth": sb,
        "preeclampsia_history": pe,
        "chronic_hypertension": htn,
        "pregestational_diabetes": dm,
        "gestational_diabetes_history": gdm,
        "smoking": smk,
        "total_obstetric_risk_factors_count": total_factors,
        # Vectorized binary encodings for XGBoost
        "vector": {
            "previous_fgr_enc": 1 if fgr else 0,
            "previous_ptb_enc": 1 if ptb else 0,
            "previous_sb_enc": 1 if sb else 0,
            "preeclampsia_hist_enc": 1 if pe else 0,
            "chronic_htn_enc": 1 if htn else 0,
            "pregestational_dm_enc": 1 if dm else 0,
            "smoking_enc": 1 if smk else 0
        }
    }
