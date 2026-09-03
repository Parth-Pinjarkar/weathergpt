import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models.models import ChatSession, ChatMessage
from app.services.ai_service import generate_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])
# Rate limiting is handled globally by the slowapi limiter registered in main.py.
# The AI/chat route gets the stricter 30/min limit set there; no local limiter needed.


class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    role: Optional[str] = "general"
    lang: Optional[str] = None
    location: Optional[str] = None

@router.post("")
def chat_endpoint(request: Request, req: ChatRequest, db: Session = Depends(get_db)):
    try:
        # 1. Resolve or Create Chat Session
        session = None
        if req.session_id:
            session = db.query(ChatSession).filter(ChatSession.id == req.session_id).first()
        
        if not session:
            session = ChatSession()
            db.add(session)
            db.commit()
            db.refresh(session)
            
        # 2. Save User Message
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=req.query
        )
        db.add(user_msg)
        db.commit()
        
        # 3. Retrieve conversation history for context
        conversation_history = []
        try:
            # Get last 20 messages from this session for context
            recent_messages = (
                db.query(ChatMessage)
                .filter(ChatMessage.session_id == session.id)
                .order_by(ChatMessage.created_at.desc())
                .limit(20)
                .all()
            )
            # Reverse to get chronological order
            recent_messages.reverse()
            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in recent_messages
            ]
        except Exception as e:
            print(f"[Chat] Warning: Could not retrieve conversation history: {e}")
        
        # 4. Generate AI Response with conversation context
        ai_resp = generate_chat_response(
            query=req.query,
            db=db,
            role=req.role,
            lang_override=req.lang,
            location_override=req.location,
            conversation_history=conversation_history
        )
        
        # 5. Save Assistant Message with metadata (weather details if any)
        metadata_json = None
        if "metadata" in ai_resp:
            metadata_json = json.dumps(ai_resp["metadata"])
            
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=ai_resp["answer_text"],
            metadata_json=metadata_json
        )
        db.add(assistant_msg)
        db.commit()
        
        return {
            "session_id": session.id,
            "answer_text": ai_resp["answer_text"],
            "data_sources": ai_resp.get("data_sources", "Unknown"),
            "confidence_note": ai_resp.get("confidence_note", ""),
            "alert_level": ai_resp.get("alert_level", "LOW"),
            "metadata": ai_resp.get("metadata", None)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history/{session_id}")
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    messages = []
    for msg in session.messages:
        meta = None
        if msg.metadata_json:
            try:
                meta = json.loads(msg.metadata_json)
            except Exception:
                pass
        messages.append({
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
            "metadata": meta
        })
        
    return {
        "session_id": session_id,
        "messages": messages
    }
