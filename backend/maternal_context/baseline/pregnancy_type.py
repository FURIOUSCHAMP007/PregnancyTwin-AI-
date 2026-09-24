"""
backend/maternal_context/baseline/pregnancy_type.py
MODEL 9A: Pregnancy Conception & Plurality Engine
Captures singleton vs. multiple gestations and IVF assisted reproduction context.
"""

from typing import Dict, Any, Optional

def process_pregnancy_type(
    pregnancy_type: Optional[str] = "singleton",
    ivf: Optional[bool] = False,
    multiple_pregnancy: Optional[bool] = False
) -> Dict[str, Any]:
    """
    Standardizes pregnancy plurality and conception methodology.
    """
    ptype = str(pregnancy_type).lower() if pregnancy_type else "singleton"
    is_mult = bool(multiple_pregnancy) or ("twin" in ptype) or ("multiple" in ptype)
    is_ivf = bool(ivf)

    return {
        "pregnancy_type": ptype if ptype in ["singleton", "multiple", "twin_dichorionic", "twin_monochorionic"] else "singleton",
        "ivf": is_ivf,
        "multiple_pregnancy": is_mult,
        "is_multiple_encoded": 1 if is_mult else 0,
        "is_ivf_encoded": 1 if is_ivf else 0
    }
