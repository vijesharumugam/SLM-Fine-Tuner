from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from services.dataset_service import process_dataset
from utils.logger import get_logger

router = APIRouter(prefix="/datasets", tags=["Datasets"])
logger = get_logger(__name__)

@router.post("/upload")
async def upload_dataset(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.json', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload CSV, JSON, or TXT.")
    
    # Save and process file
    file_id = await process_dataset(file, background_tasks)
    return {"message": "Dataset uploaded successfully and is being processed.", "dataset_id": file_id}

@router.get("/")
async def list_datasets():
    from database.mongo import get_database
    db = get_database()
    datasets = await db["datasets"].find().to_list(100)
    for ds in datasets:
        ds["_id"] = str(ds["_id"])
    return datasets

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    from database.mongo import get_database
    from bson import ObjectId
    db = get_database()
    dataset = await db["datasets"].find_one({"_id": ObjectId(dataset_id)})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    dataset["_id"] = str(dataset["_id"])
    return dataset

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    from database.mongo import get_database
    from bson import ObjectId
    db = get_database()
    result = await db["datasets"].delete_one({"_id": ObjectId(dataset_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"message": "Dataset deleted successfully"}
