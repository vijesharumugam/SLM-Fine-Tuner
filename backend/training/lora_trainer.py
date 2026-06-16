import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, prepare_model_for_kbit_training
from datasets import Dataset
import pandas as pd
from datetime import datetime


def run_training_job(job_id: str, config: dict):
    try:
        from pymongo import MongoClient
        from bson import ObjectId
        from config import settings

        client = MongoClient(settings.MONGODB_URI)
        db = client[settings.DATABASE_NAME]
        db.training_jobs.update_one({"_id": ObjectId(job_id)}, {"$set": {"status": "running"}})

        # ── Load dataset ──────────────────────────────────────────────────────
        dataset_info = db.datasets.find_one({"_id": ObjectId(config["dataset_id"])})
        if not dataset_info:
            raise ValueError("Dataset not found")

        file_path = dataset_info["path"]
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        elif file_path.endswith(".json") or file_path.endswith(".jsonl"):
            try:
                df = pd.read_json(file_path, lines=True)
            except ValueError:
                import json
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                df = pd.DataFrame(data)
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                df = pd.DataFrame({"text": f.readlines()})

        # ── Load tokenizer early to format data with correct chat template ────
        model_id = config["model_name"]
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        if not tokenizer.pad_token:
            tokenizer.pad_token = tokenizer.eos_token

        # ── Format with the model's native chat template ──────────────────────
        def format_with_chat_template(row):
            if "instruction" in row and "response" in row:
                messages = [
                    {"role": "user",      "content": str(row["instruction"])},
                    {"role": "assistant", "content": str(row["response"])}
                ]
            elif "instruction" in row and "output" in row:
                messages = [
                    {"role": "user",      "content": str(row["instruction"])},
                    {"role": "assistant", "content": str(row["output"])}
                ]
            elif "prompt" in row and "completion" in row:
                messages = [
                    {"role": "user",      "content": str(row["prompt"])},
                    {"role": "assistant", "content": str(row["completion"])}
                ]
            else:
                return {"text": str(row.get("text", ""))}
            try:
                formatted = tokenizer.apply_chat_template(
                    messages, tokenize=False, add_generation_prompt=False
                )
            except Exception:
                formatted = (
                    f"User: {messages[0]['content']}\n"
                    f"Assistant: {messages[1]['content']}{tokenizer.eos_token}"
                )
            return {"text": formatted}

        hf_dataset = Dataset.from_pandas(df)
        hf_dataset = hf_dataset.map(format_with_chat_template)

        # ── Load model ────────────────────────────────────────────────────────
        device_map = "auto" if torch.cuda.is_available() else "cpu"
        bnb_config = None
        if config["use_qlora"] and torch.cuda.is_available():
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16
            )

        model_kwargs = {"device_map": device_map}
        if bnb_config:
            model_kwargs["quantization_config"] = bnb_config
        model = AutoModelForCausalLM.from_pretrained(model_id, **model_kwargs)

        if config["use_qlora"] and torch.cuda.is_available():
            model = prepare_model_for_kbit_training(model)

        # ── LoRA config — alpha = 2x r for strong learning signal ─────────────
        lora_r = config["lora_r"]
        peft_config = LoraConfig(
            r=lora_r,
            lora_alpha=lora_r * 2,
            target_modules=["q_proj", "v_proj"],
            bias="none",
            task_type="CAUSAL_LM"
        )

        output_dir = os.path.join(settings.MODELS_PATH, f"model_{job_id}")
        os.makedirs(output_dir, exist_ok=True)

        # ── Training ──────────────────────────────────────────────────────────
        from trl import SFTTrainer, SFTConfig

        # max_seq_length is NOT in SFTConfig in newest trl — pass to SFTTrainer only
        training_args = SFTConfig(
            output_dir=output_dir,
            per_device_train_batch_size=config["batch_size"],
            gradient_accumulation_steps=4,
            learning_rate=config["learning_rate"],
            num_train_epochs=config["epochs"],
            save_strategy="no",
            logging_steps=5,
            use_cpu=not torch.cuda.is_available(),
            dataset_text_field="text",
        )

        try:
            trainer = SFTTrainer(
                model=model,
                train_dataset=hf_dataset,
                peft_config=peft_config,
                args=training_args,
                max_seq_length=512,
            )
        except TypeError:
            trainer = SFTTrainer(
                model=model,
                train_dataset=hf_dataset,
                peft_config=peft_config,
                args=training_args,
            )

        trainer.train()

        # ── Save adapter + tokenizer ──────────────────────────────────────────
        trainer.model.save_pretrained(output_dir)
        tokenizer.save_pretrained(output_dir)

        db.training_jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {
                "status": "completed",
                "end_time": datetime.utcnow(),
                "model_path": output_dir
            }}
        )
        db.trained_models.insert_one({
            "name": f"FineTuned-{model_id.split('/')[-1]}",
            "job_id": job_id,
            "path": output_dir,
            "created_at": datetime.utcnow(),
            "config": config
        })

    except Exception as e:
        from pymongo import MongoClient
        from bson import ObjectId
        from config import settings
        client = MongoClient(settings.MONGODB_URI)
        db = client[settings.DATABASE_NAME]
        db.training_jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "failed", "error": str(e), "end_time": datetime.utcnow()}}
        )
