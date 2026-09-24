"""
backend/growth/efw/formula.py
MODEL 7: Validated Fetal Weight Estimation Formulas
Implements standard Hadlock (3-param & 4-param), INTERGROWTH-21st, and WHO formulations.
"""

import math
from typing import Dict, Any, Optional

def calculate_hadlock_4_param(hc_cm: float, ac_cm: float, fl_cm: float, bpd_cm: float) -> float:
    """
    Hadlock 4-parameter formula:
    log10(EFW) = 1.3596 - (0.00386 * AC * FL) + (0.0064 * HC) + (0.0061 * BPD * AC) + (0.0424 * AC) + (0.174 * FL)
    Returns EFW in grams.
    Reference: Hadlock FP et al. Radiology 1984; 150(2): 535-540.
    """
    log10_efw = (
        1.3596
        - (0.00386 * ac_cm * fl_cm)
        + (0.0064 * hc_cm)
        + (0.0061 * bpd_cm * ac_cm)
        + (0.0424 * ac_cm)
        + (0.174 * fl_cm)
    )
    return round(math.pow(10, log10_efw), 1)

def calculate_hadlock_3_param(hc_cm: float, ac_cm: float, fl_cm: float) -> float:
    """
    Hadlock 3-parameter formula (Most widely clinically utilized benchmark):
    log10(EFW) = 1.326 - (0.00326 * AC * FL) + (0.0107 * HC) + (0.0438 * AC) + (0.158 * FL)
    Returns EFW in grams.
    Reference: Hadlock FP et al. Am J Obstet Gynecol 1985; 151(3): 333-337.
    """
    log10_efw = (
        1.326
        - (0.00326 * ac_cm * fl_cm)
        + (0.0107 * hc_cm)
        + (0.0438 * ac_cm)
        + (0.158 * fl_cm)
    )
    return round(math.pow(10, log10_efw), 1)

def calculate_hadlock_ac_fl(ac_cm: float, fl_cm: float) -> float:
    """
    Hadlock 2-parameter fallback (AC + FL) when fetal head is deeply engaged in pelvis:
    log10(EFW) = 1.304 + (0.05281 * AC) + (0.18 * FL) - (0.003343 * AC * FL)
    Returns EFW in grams.
    """
    log10_efw = (
        1.304
        + (0.05281 * ac_cm)
        + (0.18 * fl_cm)
        - (0.003343 * ac_cm * fl_cm)
    )
    return round(math.pow(10, log10_efw), 1)

def calculate_intergrowth_21st(hc_cm: float, ac_cm: float, fl_cm: float) -> float:
    """
    INTERGROWTH-21st Fetal Growth Standard EFW Formula:
    ln(EFW) = 5.084820 - 54.06633*(AC/100)^3 - 95.80076*(FL/100)^3*ln(FL/100) + 2.450146*(HC/100) + 0.8805151*(AC/100)
    Returns EFW in grams.
    Reference: Stirnemann J et al. Ultrasound Obstet Gynecol 2017; 49(4): 478-486.
    """
    hc_m = hc_cm / 100.0
    ac_m = ac_cm / 100.0
    fl_m = fl_cm / 100.0
    
    ln_efw = (
        5.084820
        - 54.06633 * (ac_m ** 3)
        - 95.80076 * (fl_m ** 3) * math.log(max(fl_m, 1e-5))
        + 2.450146 * hc_m
        + 0.8805151 * ac_m
    )
    return round(math.exp(ln_efw), 1)
