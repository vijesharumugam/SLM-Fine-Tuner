import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.mongo import connect_to_mongo, close_mongo_connection
import uvicorn
from api.datasets import router as datasets_router
from api.training import router as training_router
from api.models import router as models_router
from api.chat import router as chat_router
import psutil

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Domain-Specific LLM Fine-Tuning Platform",
    description="API for dataset management, LLM fine-tuning, evaluation, and inference.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets_router)
app.include_router(training_router)
app.include_router(models_router)
app.include_router(chat_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}

@app.get("/system/metrics")
async def get_system_metrics():
    return {
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "ram_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
