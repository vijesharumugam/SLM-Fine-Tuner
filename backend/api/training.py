from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.mongo import get_database
from bson import ObjectId
from datetime import datetime
import multiprocessing
from training.lora_trainer import run_training_job

router = APIRouter(prefix="/training", tags=["Training"])

class TrainingRequest(BaseModel):
    model_name: str
    dataset_id: str
    lora_r: int = 8
    lora_alpha: int = 16
    batch_size: int = 4
    epochs: int = 3
    learning_rate: float = 2e-4
    use_qlora: bool = True

@router.post("/start")
async def start_training(request: TrainingRequest):
    db = get_database()

    dataset = await db.datasets.find_one({"_id": ObjectId(request.dataset_id)})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    job_doc = {
        "status": "pending",
        "start_time": datetime.utcnow(),
        "config": request.model_dump(),
    }

    result = await db.training_jobs.insert_one(job_doc)
    job_id = str(result.inserted_id)

    # Use 'spawn' context to safely initialize CUDA in the child process
    ctx = multiprocessing.get_context("spawn")
    p = ctx.Process(target=run_training_job, args=(job_id, request.model_dump()))
    p.start()

    return {"message": "Training job started", "job_id": job_id}

@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    db = get_database()
    job = await db.training_jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job["_id"] = str(job["_id"])
    return job

@router.get("/history")
async def list_jobs():
    db = get_database()
    jobs = await db.training_jobs.find().sort("start_time", -1).to_list(100)
    for j in jobs:
        j["_id"] = str(j["_id"])
    return jobs

@router.delete("/job/{job_id}")
async def delete_job(job_id: str):
    db = get_database()
    result = await db.training_jobs.delete_one({"_id": ObjectId(job_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}

@router.delete("/clear/completed")
async def clear_completed_jobs():
    db = get_database()
    result = await db.training_jobs.delete_many({"status": {"$in": ["completed", "failed"]}})
    return {"message": f"Cleared {result.deleted_count} jobs"}
