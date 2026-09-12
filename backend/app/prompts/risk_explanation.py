"""
WeatherGPT — Risk Explanation Prompting
"""

from typing import Dict, Any, List


def get_risk_explanation_prompt(risk_score: int, category: str, breakdown: List[Dict[str, Any]], location: str) -> str:
    factors_str = "\n".join([f"- {f.get('factor')}: {f.get('weight', 0)} pts" for f in breakdown])
    return f"""Synthesize an operational risk explanation for {location}.
Calculated Weather Risk Index: {risk_score}/100 ({category} Alert).
Active Meteorological Factors:
{factors_str if factors_str else "- Nominal weather parameters observed"}

Explain in 2-3 concise sentences why this risk level exists, what physical hazards are most dangerous, and the exact preventive measures citizens or authorities should take immediately.
"""
