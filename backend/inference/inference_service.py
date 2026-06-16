import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel
import logging

logger = logging.getLogger(__name__)

class InferenceEngine:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.current_model_id = None

    def load_model(self, base_model_id: str, adapter_path: str = None):
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading base model {base_model_id} on {device}")

        self.tokenizer = AutoTokenizer.from_pretrained(base_model_id)
        if not self.tokenizer.pad_token:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        kwargs = {}
        if torch.cuda.is_available():
            kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16
            )

        self.model = AutoModelForCausalLM.from_pretrained(
            base_model_id, device_map="auto", **kwargs
        )

        if adapter_path:
            logger.info(f"Loading LoRA adapter from {adapter_path}")
            self.model = PeftModel.from_pretrained(self.model, adapter_path)

        self.current_model_id = adapter_path or base_model_id

    def generate(self, prompt: str, max_new_tokens: int = 256, **kwargs) -> str:
        if not self.model or not self.tokenizer:
            raise ValueError("Model not loaded")

        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        generate_kwargs = {
            "max_new_tokens": max_new_tokens,
            "do_sample": True,
            "top_p": 0.95,
            "temperature": 0.1,
        }
        generate_kwargs.update(kwargs)

        outputs = self.model.generate(**inputs, **generate_kwargs)

        # Return only the newly generated tokens (strip the input prompt)
        input_length = inputs.input_ids.shape[1]
        generated_tokens = outputs[0][input_length:]
        return self.tokenizer.decode(generated_tokens, skip_special_tokens=True)


engine = InferenceEngine()
