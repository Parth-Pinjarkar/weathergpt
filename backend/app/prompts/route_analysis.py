"""
WeatherGPT — Route Analysis Prompting
"""

from typing import Dict, Any, List


def get_route_analysis_prompt(from_loc: str, to_loc: str, checkpoints: List[Dict[str, Any]], overall_risk: str) -> str:
    ck_lines = []
    for c in checkpoints:
        ck_lines.append(f"- {c.get('name')}: {c.get('temp')}°C, Rain {c.get('rain_probability')}%, Wind {c.get('wind_speed')} km/h, Risk: {c.get('risk_level', 'LOW')}")
    summary_ck = "\n".join(ck_lines)

    return f"""Route corridor: {from_loc} to {to_loc}.
Overall Route Weather Threat Level: {overall_risk}.
Corridor Checkpoint Telemetry:
{summary_ck}

Provide a concise, professional driving advisory. Detail:
1. Most critical corridor hazard (e.g., ghat fog, aquaplaning risk, heavy downpour).
2. Recommended travel window or departure adjustment.
3. Essential precautions (headlights, reduced speed limit, alternate road bypass).
"""
