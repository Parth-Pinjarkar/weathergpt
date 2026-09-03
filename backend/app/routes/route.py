from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.route_service import analyze_route_weather

router = APIRouter(prefix="/route", tags=["route"])

class RouteRequest(BaseModel):
    from_location: str
    to_location: str

@router.post("/analyze")
def analyze_route_endpoint(req: RouteRequest, db: Session = Depends(get_db)):
    try:
        result = analyze_route_weather(db, req.from_location, req.to_location)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
