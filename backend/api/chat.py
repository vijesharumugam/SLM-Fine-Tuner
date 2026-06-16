from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from inference.inference_service import engine
from services.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    max_tokens: int = 256

@router.post("/")
async def chat(request: ChatRequest):
    if not engine.model:
        raise HTTPException(
            status_code=400,
            detail="No model loaded. Please load a model from the Model Registry first."
        )
    try:
        exact_answer, score = rag_service.exact_match(request.message)

        # ── Tier 1: Strong match — return verbatim dataset answer ────────────
        if exact_answer and score >= 0.4:
            return {"response": exact_answer}

        # ── Tier 2: Weak match — model guided by knowledge base context ──────
        if exact_answer and score >= 0.15:
            system_prompt = rag_service.build_system_prompt()
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": request.message}
            ]
        else:
            # ── Tier 3: No match — normal friendly conversation ──────────────
            messages = [
                {"role": "system", "content": "You are a helpful and friendly AI assistant. Respond naturally and conversationally."},
                {"role": "user",   "content": request.message}
            ]

        try:
            prompt = engine.tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
        except Exception:
            # Fallback for models without system role support
            content = messages[0]["content"] + "\n\nUser: " + request.message if len(messages) > 1 else request.message
            prompt = engine.tokenizer.apply_chat_template(
                [{"role": "user", "content": content}],
                tokenize=False, add_generation_prompt=True
            )

        response = engine.generate(
            prompt,
            max_new_tokens=request.max_tokens,
            repetition_penalty=1.15
        )
        return {"response": response.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
