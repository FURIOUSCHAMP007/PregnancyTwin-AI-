"""
backend/maternal_context/vitals/temperature.py
MODEL 9B: Maternal Body Temperature Engine
"""

from typing import Dict, Any, Optional

def calculate_temperature_dynamics(
    current_temp_c: float,
    previous_temp_c: Optional[float] = None
) -> Dict[str, Any]:
    temp_delta = round(current_temp_c - previous_temp_c, 2) if previous_temp_c is not None else None
    return {
        "temperature_c": float(current_temp_c),
        "temperature_delta": temp_delta
    }
