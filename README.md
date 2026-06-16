# Domain-Specific SLM Fine-Tuning Platform 

A complete, production-ready AI application for fine-tuning lightweight Small Language Models (SLMs) using QLoRA, evaluating performance, and chatting in real-time. Designed specifically for low-spec environments (laptops, Colab, Kaggle).

## Features

- **Dataset Management:** Upload and preprocess CSV, JSON, and TXT files.
- **LoRA/QLoRA Fine-Tuning:** Efficiently train TinyLlama, Qwen, and Phi-3.
- **Model Registry:** Manage trained models and load adapters into memory.
- **Chat Interface:** Chat with your locally trained models instantly.
- **System Monitoring:** Track CPU, RAM, and Disk usage directly from the UI.

## Local Deployment (Windows/Mac/Linux)

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (running locally on port 27017 or a cloud URI)

### 1. Setup Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

## Google Colab / Kaggle Deployment

This platform is highly suitable for Colab's free T4 GPU.

1. Open a new Colab Notebook.
2. Clone your repository.
3. Install dependencies:
   ```bash
   !pip install fastapi uvicorn motor pymongo torch transformers peft trl accelerate bitsandbytes pandas datasets
   ```
4. Start a local MongoDB server inside Colab or provide a MongoDB Atlas URI in `.env`.
5. Expose the FastAPI server using `localtunnel` or `ngrok`.

## Production Deployment (Render, Railway, VPS)

- **Backend:** Deploy the `backend` folder as a Python Web Service. Set environment variables (`MONGODB_URI`, `ENVIRONMENT=production`).
- **Frontend:** Deploy the `frontend` folder as a Static Site using Vercel, Netlify, or Render. Make sure to update the API base URL in the React components from `localhost:8000` to your deployed backend URL.

## Stack
- **Backend:** FastAPI, PyTorch, HuggingFace (Transformers, PEFT, TRL)
- **Database:** MongoDB (Motor Async Driver)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
