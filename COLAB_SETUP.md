# Running the Backend in Google Colab

Since you have a low-spec laptop, running the heavy ML training backend in Google Colab is a great idea! You can run the **Backend** in Colab (to use their free GPUs) and run the **Frontend** locally on your laptop.

## Step 1: Upload the Backend to Colab
1. Zip the `backend` folder from your local machine.
2. Open Google Colab and start a new Notebook.
3. Enable GPU: Go to **Runtime** > **Change runtime type** > Select **T4 GPU**.
4. Upload the `backend.zip` file to the Colab files pane.
5. Unzip it by running this cell:
   ```bash
   !unzip backend.zip
   ```

## Step 2: Install Dependencies in Colab
Run this in a Colab cell:
```bash
!pip install fastapi uvicorn motor pymongo torch transformers peft trl accelerate bitsandbytes pandas datasets psutil python-multipart pydantic-settings pyngrok
```

## Step 3: Run the Server and Expose it with Ngrok
Because Colab is a remote server, your local React frontend can't normally talk to it. We use `pyngrok` to create a public URL for your FastAPI backend.

Run this in a Colab cell:
```python
import os
import subprocess
from pyngrok import ngrok

# 1. Provide your Ngrok Auth Token (Get a free one at https://dashboard.ngrok.com)
ngrok.set_auth_token("YOUR_NGROK_AUTH_TOKEN")

# 2. Start ngrok tunnel
public_url = ngrok.connect(8000).public_url
print("🚀 BACKEND PUBLIC URL:", public_url)

# 3. Change directory to where your backend code is
os.chdir('/content/backend')

# 4. Start the FastAPI server using subprocess
# Note: Since MongoDB isn't running in Colab by default, you may want to provide a MongoDB Atlas URI 
# in your .env file or install mongodb locally in colab.
print("Starting Uvicorn server...")
subprocess.Popen(["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"])
```

## Step 4: Connect your Local Frontend
1. Copy the `🚀 BACKEND PUBLIC URL` that ngrok printed (e.g., `https://1234-abcd.ngrok.io`).
2. On your local laptop, open your frontend code. You will need to replace `http://localhost:8000` with the Ngrok URL in files like `src/pages/Datasets.tsx`, `FineTuning.tsx`, etc.
3. Run `npm run dev` on your local laptop.

Your beautiful frontend will now be running on your local laptop, but all the heavy lifting (LoRA training, dataset processing, inference) will be handled by Google Colab's GPU!
