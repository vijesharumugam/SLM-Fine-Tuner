from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from database.mongo import get_database
from bson import ObjectId
import os, shutil, tempfile
from inference.inference_service import engine

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("/")
async def list_models():
    db = get_database()
    models = await db.trained_models.find().sort("created_at", -1).to_list(100)
    for m in models:
        m["_id"] = str(m["_id"])
    return models

@router.delete("/{model_id}")
async def delete_model(model_id: str):
    db = get_database()
    model = await db.trained_models.find_one({"_id": ObjectId(model_id)})
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    await db.trained_models.delete_one({"_id": ObjectId(model_id)})

    import shutil
    if os.path.exists(model["path"]):
        shutil.rmtree(model["path"], ignore_errors=True)

    return {"message": "Model deleted successfully"}

@router.post("/load/{model_id}")
async def load_model(model_id: str):
    db = get_database()
    model = await db.trained_models.find_one({"_id": ObjectId(model_id)})
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    try:
        base_model = model["config"]["model_name"]
        adapter_path = model["path"]
        engine.load_model(base_model, adapter_path)

        # Auto-load the training dataset into the RAG service for factual grounding
        from services.rag_service import rag_service
        dataset_id = model.get("config", {}).get("dataset_id")
        if dataset_id:
            try:
                dataset_info = await db.datasets.find_one({"_id": ObjectId(dataset_id)})
                if dataset_info and os.path.exists(dataset_info["path"]):
                    rag_service.load_dataset(dataset_info["path"])
            except Exception as e:
                # RAG loading is an optional enhancement — don't block model loading
                pass

        return {"message": f"Model {model['name']} loaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{model_id}")
async def download_model(model_id: str):
    db = get_database()
    model = await db.trained_models.find_one({"_id": ObjectId(model_id)})
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    model_path = model["path"]
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model files not found on disk")

    try:
        # Create a temporary zip file
        tmp_dir = tempfile.mkdtemp()
        safe_name = model["name"].replace(" ", "_").replace("/", "-")
        zip_path = os.path.join(tmp_dir, safe_name)
        shutil.make_archive(zip_path, "zip", model_path)

        return FileResponse(
            path=zip_path + ".zip",
            media_type="application/zip",
            filename=f"{safe_name}.zip"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
