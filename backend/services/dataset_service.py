import os
import aiofiles
from fastapi import UploadFile, BackgroundTasks
from config import settings
from utils.logger import get_logger
from database.mongo import get_database
import pandas as pd
from datetime import datetime

logger = get_logger(__name__)

async def process_dataset(file: UploadFile, background_tasks: BackgroundTasks) -> str:
    # 1. Save the file temporarily or permanently
    file_path = os.path.join(settings.DATASETS_PATH, file.filename)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    # 2. Register dataset in DB with 'processing' status
    db = get_database()
    dataset_doc = {
        "filename": file.filename,
        "path": file_path,
        "status": "processing",
        "uploaded_at": datetime.utcnow(),
        "stats": {}
    }
    result = await db["datasets"].insert_one(dataset_doc)
    dataset_id = str(result.inserted_id)

    # 3. Add background task for processing
    background_tasks.add_task(background_process, file_path, dataset_id)

    return dataset_id

async def background_process(file_path: str, dataset_id: str):
    logger.info(f"Starting background processing for {dataset_id}")
    try:
        # Load data
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith('.json') or file_path.endswith('.jsonl'):
            try:
                # Try JSON Lines format first
                df = pd.read_json(file_path, lines=True)
            except ValueError:
                # Fallback to standard JSON array
                import json
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                df = pd.DataFrame(data)
        else:
            # Handle text files by treating each line as a sample
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            df = pd.DataFrame({"text": lines})

        # Basic cleaning
        df = df.dropna()
        if 'text' not in df.columns and len(df.columns) > 0:
            # If no 'text' column, assume the first column is the text data
            df = df.rename(columns={df.columns[0]: 'text'})

        # Calculate stats
        total_samples = len(df)
        avg_length = df['text'].astype(str).apply(len).mean() if 'text' in df.columns else 0

        # Update DB
        db = get_database()
        from bson import ObjectId
        await db["datasets"].update_one(
            {"_id": ObjectId(dataset_id)},
            {"$set": {
                "status": "ready",
                "stats": {
                    "total_samples": total_samples,
                    "avg_length": float(avg_length)
                }
            }}
        )
        logger.info(f"Finished processing {dataset_id}")
    except Exception as e:
        logger.error(f"Error processing {dataset_id}: {str(e)}")
        db = get_database()
        from bson import ObjectId
        await db["datasets"].update_one(
            {"_id": ObjectId(dataset_id)},
            {"$set": {"status": "error", "error_message": str(e)}}
        )
