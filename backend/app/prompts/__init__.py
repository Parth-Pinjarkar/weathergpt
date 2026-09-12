"""WeatherGPT Prompt Engineering Package"""
from .system import SYSTEM_PROMPT, STRICT_GROUNDING_INSTRUCTION
from .weather_assistant import get_persona_prompt
from .risk_explanation import get_risk_explanation_prompt
from .route_analysis import get_route_analysis_prompt
from .activity_advisor import get_activity_advisor_prompt

__all__ = [
    "SYSTEM_PROMPT",
    "STRICT_GROUNDING_INSTRUCTION",
    "get_persona_prompt",
    "get_risk_explanation_prompt",
    "get_route_analysis_prompt",
    "get_activity_advisor_prompt"
]
