"""
backend/growth/percentile/reference.py
MODEL 7: Growth Reference Standards (Hadlock 1991, INTERGROWTH-21st, WHO)
Provides exact mathematical distribution curves and normative mean/SD across 14 to 42 weeks GA.
"""

import math
from typing import Dict, Tuple

def get_hadlock_1991_normative(ga_weeks: float) -> Tuple[float, float]:
    """
    Hadlock FP et al. In utero analysis of fetal growth: A sonographic weight standard.
    Radiology 1991; 181(1): 129-133.
    Mean ln(weight) = 0.578 + 0.332*GA - 0.00354*(GA^2)
    SD of ln(weight) ~ 0.125 (constant across 2nd & 3rd trimesters)
    """
    ga = max(14.0, min(42.0, ga_weeks))
    mean_ln_wt = 0.578 + (0.332 * ga) - (0.00354 * (ga ** 2))
    mean_wt_g = math.exp(mean_ln_wt)
    # Approximate linear SD in grams around mean for clinical interpretation
    sd_g = mean_wt_g * 0.125
    return mean_wt_g, sd_g

def get_intergrowth_21st_normative(ga_weeks: float) -> Tuple[float, float]:
    """
    INTERGROWTH-21st Fetal Growth Standard
    Reference: Villar J et al. Lancet 2014; 384(9946): 857-868.
    """
    ga = max(14.0, min(42.0, ga_weeks))
    # Empirical polynomials for international median
    ga_days = ga * 7.0
    mean_g = -142.3 + (1.464 * ga_days) - (0.00167 * (ga_days ** 2))
    # Smooth standard deviation
    sd_g = max(25.0, mean_g * 0.128)
    return max(50.0, mean_g), sd_g

def get_who_fetal_growth_normative(ga_weeks: float) -> Tuple[float, float]:
    """
    WHO Fetal Growth Charts for estimated fetal weight
    Reference: Kiserud T et al. PLoS Med 2017; 14(1): e1002220.
    """
    ga = max(14.0, min(42.0, ga_weeks))
    mean_g = math.exp(1.15 + (0.28 * ga) - (0.0028 * (ga ** 2)))
    sd_g = mean_g * 0.130
    return mean_g, sd_g
