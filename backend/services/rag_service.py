import json, re
import pandas as pd
from typing import Optional
from utils.logger import get_logger

logger = get_logger(__name__)

class RAGService:
    def __init__(self):
        self.knowledge_base = []

    def load_dataset(self, file_path: str):
        try:
            if file_path.endswith(".csv"):
                df = pd.read_csv(file_path)
            elif file_path.endswith(".json") or file_path.endswith(".jsonl"):
                try:
                    df = pd.read_json(file_path, lines=True)
                except ValueError:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    df = pd.DataFrame(data)
            else:
                return
            inst = next((c for c in ["instruction", "prompt", "question", "input"] if c in df.columns), None)
            resp = next((c for c in ["response", "completion", "answer", "output"] if c in df.columns), None)
            if inst and resp:
                self.knowledge_base = [
                    {"q": str(row[inst]), "a": str(row[resp])}
                    for _, row in df.iterrows()
                ]
            logger.info(f"RAG loaded {len(self.knowledge_base)} facts from {file_path}")
        except Exception as e:
            logger.error(f"RAG load error: {e}")

    def _normalize(self, text: str) -> str:
        return re.sub(r"[^a-z0-9 ]", "", text.lower())

    def exact_match(self, query: str):
        """
        Find the best-matching knowledge base entry for the query.
        Returns (answer, score) where score is 0.0-1.0.
        Score >= 0.4 is considered a reliable match.
        """
        if not self.knowledge_base:
            return None, 0.0

        stop = {
            "what", "is", "the", "of", "tell", "me", "about", "has", "does",
            "how", "many", "his", "her", "which", "who", "where", "are", "did",
            "do", "a", "an", "in", "on", "at", "to", "for", "and", "or"
        }

        q_words = set(self._normalize(query).split()) - stop
        if not q_words:
            q_words = set(self._normalize(query).split())

        best_score = 0.0
        best_answer = None
        for item in self.knowledge_base:
            kb_words = set(self._normalize(item["q"]).split()) - stop
            if not kb_words:
                continue
            overlap = len(q_words & kb_words)
            score = overlap / max(len(q_words), len(kb_words))
            if score > best_score:
                best_score = score
                best_answer = item["a"]

        return best_answer, best_score

    def build_system_prompt(self) -> str:
        if not self.knowledge_base:
            return "You are a helpful AI assistant."
        facts = "\n".join(f"Q: {i['q']}\nA: {i['a']}" for i in self.knowledge_base)
        return (
            "You are a factual AI assistant. Answer ONLY using the knowledge base below. "
            "Copy the answer EXACTLY as written. Do NOT rephrase, add, or invent anything.\n\n"
            "KNOWLEDGE BASE:\n" + facts + "\nEND OF KNOWLEDGE BASE"
        )


rag_service = RAGService()
